import { ActionFunctionArgs, json } from "@remix-run/node";
import { createFollow, deleteFollow } from "~/server";
import { requireUserLogin } from "~/services";
import { invariantResponse } from "~/utils";
import { cacheDelete, cacheDeletePattern } from "~/utils/cache.server";
import { Logger } from "~/utils/logger.server";

// Prevent automatic revalidation of parent routes after follow/unfollow actions
// The UI handles optimistic updates, so we don't need to refetch all data
export const shouldRevalidate = () => {
  return false;
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);
  const targetUserId = params.userId;

  invariantResponse(targetUserId, "User ID is required");
  invariantResponse(user, "User is required");
  invariantResponse(user.id !== targetUserId, "Cannot follow yourself");

  try {
    if (request.method === "POST") {
      await createFollow({ followerId: user.id, followingId: targetUserId });
    } else if (request.method === "DELETE") {
      await deleteFollow({ followerId: user.id, followingId: targetUserId });
    }

    // Invalidate caches after successful operation
    // Use pattern deletion for keys that include pagination
    await Promise.all([
      cacheDeletePattern(`user-profile:${targetUserId}:*`),
      cacheDeletePattern(`user-profile:${user.id}:*`),
      cacheDelete(`user-follow-stats:${targetUserId}`),
      cacheDelete(`user-follow-stats:${user.id}`),
      cacheDeletePattern(`following-feed:${user.id}:*`),
    ]);

    return json({ success: true });
  } catch (error) {
    Logger.error({
      message: "Follow action error",
      error: error instanceof Error ? error : new Error(String(error)),
      metadata: { userId: user.id, targetUserId },
    });
    return json({ success: false, error: "Failed to update follow status" }, { status: 500 });
  }
};
