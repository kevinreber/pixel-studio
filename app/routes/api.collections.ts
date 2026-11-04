import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { prisma } from "~/services/prisma.server";
import {
  trackCollection,
  AnalyticsEvents,
} from "~/services/analytics.server";
import { checkAndUnlockAchievements } from "~/services/achievements.server";
import { Logger } from "~/utils/logger.server";
import { cacheDelete } from "~/utils/cache.server";
import { CollectionSchema } from "~/schemas/collection";
import {
  checkRateLimit,
  writeLimiter,
  getRateLimitIdentifier,
  rateLimitResponse,
} from "~/services/rateLimit.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUserLogin(request);
  const url = new URL(request.url);
  const imageId = url.searchParams.get("imageId");

  const videoId = url.searchParams.get("videoId");

  const collections = await prisma.collection.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      title: true,
      _count: {
        select: { images: true, videos: true },
      },
      images: imageId
        ? {
            where: { id: imageId },
            select: { id: true },
          }
        : false,
      videos: videoId
        ? {
            where: { videoId },
            select: { id: true },
          }
        : false,
    },
    orderBy: { createdAt: "desc" },
  });

  return json({
    collections: collections.map((c) => ({
      id: c.id,
      title: c.title,
      imageCount: c._count.images,
      videoCount: c._count.videos,
      totalCount: c._count.images + c._count.videos,
      hasImage: imageId ? c.images.length > 0 : undefined,
      hasVideo: videoId ? c.videos.length > 0 : undefined,
    })),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const user = await requireUserLogin(request);
  const rl = await checkRateLimit(
    writeLimiter,
    getRateLimitIdentifier(request, user.id)
  );
  if (!rl.success) return rateLimitResponse(rl.reset);

  const formData = await request.formData();
  const parsed = CollectionSchema.pick({ title: true }).safeParse({
    title: formData.get("title")?.toString().trim(),
  });

  if (!parsed.success) {
    return json(
      { error: parsed.error.errors[0]?.message ?? "Invalid title" },
      { status: 400 }
    );
  }

  const collection = await prisma.collection.create({
    data: {
      title: parsed.data.title,
      userId: user.id,
    },
  });

  // Invalidate user collections cache so the new collection appears immediately
  await cacheDelete(`user-collections:${user.id}`);

  // Track collection creation
  trackCollection(user.id, AnalyticsEvents.COLLECTION_CREATED, {
    collectionId: collection.id,
    title: collection.title,
  });

  // Check collection-related achievements
  checkAndUnlockAchievements(user.id, "engagement").catch((err) =>
    Logger.error({ message: "Achievement check failed", error: err instanceof Error ? err : new Error(String(err)) })
  );

  return json({ success: true, collection });
};
