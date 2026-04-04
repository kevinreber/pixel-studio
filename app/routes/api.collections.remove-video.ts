import { ActionFunctionArgs, json } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { prisma } from "~/services/prisma.server";
import { cacheDelete } from "~/utils/cache.server";
import {
  checkRateLimit,
  writeLimiter,
  getRateLimitIdentifier,
  rateLimitResponse,
} from "~/services/rateLimit.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "DELETE") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

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

    // Delete the connection
    await prisma.collectionHasVideo.deleteMany({
      where: {
        collectionId,
        videoId,
      },
    });

    // Invalidate user collections cache
    await cacheDelete(`user-collections:${user.id}`);

    return json({ success: true });
  } catch (error) {
    console.error("Error removing video from collection:", error);
    return json(
      { success: false, error: "Failed to remove video from collection" },
      { status: 500 }
    );
  }
};
