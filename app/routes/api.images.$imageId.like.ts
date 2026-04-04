import { ActionFunctionArgs, json } from "@remix-run/node";
import { createImageLike, deleteImageLike } from "~/server";
import { requireUserLogin } from "~/services";
import { invariantResponse } from "~/utils";
import { cacheDelete } from "~/utils/cache.server";
import {
  trackEngagement,
  AnalyticsEvents,
} from "~/services/analytics.server";
import {
  checkRateLimit,
  writeLimiter,
  getRateLimitIdentifier,
  rateLimitResponse,
} from "~/services/rateLimit.server";
import { checkAndUnlockAchievements } from "~/services/achievements.server";
import { prisma } from "~/services/prisma.server";
import { Logger } from "~/utils/logger.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);
  const rl = await checkRateLimit(
    writeLimiter,
    getRateLimitIdentifier(request, user.id)
  );
  if (!rl.success) return rateLimitResponse(rl.reset);
  const imageId = params.imageId;
  invariantResponse(imageId, "Image ID is required");
  invariantResponse(user, "User is required");
  const likedImagesCacheKey = `liked-images:user:${user.id}`;
  await cacheDelete(likedImagesCacheKey);
  const imageDetailsCacheKey = `image-details:${imageId}`;
  await cacheDelete(imageDetailsCacheKey);

  if (request.method === "POST") {
    await createImageLike({ imageId, userId: user.id });
    trackEngagement(user.id, AnalyticsEvents.IMAGE_LIKED, {
      targetId: imageId,
      targetType: "image",
    });

    // Check engagement achievements for the image owner (likes received)
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { userId: true },
    });
    if (image) {
      checkAndUnlockAchievements(image.userId, "engagement").catch((err) =>
        Logger.error({ message: "Achievement check failed", error: err instanceof Error ? err : new Error(String(err)) })
      );
    }
  } else if (request.method === "DELETE") {
    await deleteImageLike({ imageId, userId: user.id });
    trackEngagement(user.id, AnalyticsEvents.IMAGE_UNLIKED, {
      targetId: imageId,
      targetType: "image",
    });
  }

  return json({ success: true });
};
