import { ActionFunctionArgs, json } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { prisma } from "~/services/prisma.server";
import { cacheDelete } from "~/utils/cache.server";
import {
  trackCollection,
  AnalyticsEvents,
} from "~/services/analytics.server";
import {
  checkRateLimit,
  writeLimiter,
  getRateLimitIdentifier,
  rateLimitResponse,
} from "~/services/rateLimit.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);
  const rl = await checkRateLimit(
    writeLimiter,
    getRateLimitIdentifier(request, user.id)
  );
  if (!rl.success) return rateLimitResponse(rl.reset);
  const formData = await request.formData();
  const videoId = formData.get("videoId")?.toString();
  const collectionId = formData.get("collectionId")?.toString();

  if (!videoId || !collectionId) {
    return json(
      { error: "Video ID and Collection ID are required" },
      { status: 400 }
    );
  }

  try {
    // Verify collection belongs to user
    const collection = await prisma.collection.findUnique({
      where: {
        id: collectionId,
        userId: user.id,
      },
    });

    if (!collection) {
      return json({ error: "Collection not found" }, { status: 404 });
    }

    // Verify the video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      return json({ error: "Video not found" }, { status: 404 });
    }

    // Create the connection using CollectionHasVideo
    await prisma.collectionHasVideo.create({
      data: {
        collectionId,
        videoId,
      },
    });

    // Invalidate user collections cache
    await cacheDelete(`user-collections:${user.id}`);

    // Track video added to collection
    trackCollection(user.id, AnalyticsEvents.COLLECTION_VIDEO_ADDED, {
      collectionId,
      title: collection.title,
    });

    return json({ success: true });
  } catch (error) {
    console.error("Error adding video to collection:", error);

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return json(
        {
          success: false,
          error: "Video already exists in this collection",
        },
        {
          status: 400,
        }
      );
    }

    return json(
      {
        success: false,
        error: "Failed to add video to collection",
      },
      {
        status: 500,
      }
    );
  }
};
