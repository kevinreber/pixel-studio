import { LoaderFunctionArgs } from "@remix-run/node";
import { getFollowing, getFollowingSet } from "~/server";
import { getGoogleSessionAuth } from "~/services";
import { Logger } from "~/utils/logger.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const userId = params.userId;

  if (!userId) {
    return Response.json({ error: "User ID is required" }, { status: 400 });
  }

  const searchParams = new URL(request.url).searchParams;
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 50;

  try {
    const result = await getFollowing(userId, page, pageSize);

    // Get current user to check if they're following each user in the list
    const session = await getGoogleSessionAuth(request);
    const currentUserId = session?.id;

    // Batch query to check follow status for all users at once (avoids N+1 queries)
    const userIds = result.following.map((u) => u.id);
    const followingSet = currentUserId
      ? await getFollowingSet(currentUserId, userIds)
      : new Set<string>();

    // Add isFollowedByCurrentUser to each user
    const followingWithStatus = result.following.map((user) => ({
      ...user,
      isFollowedByCurrentUser: followingSet.has(user.id),
    }));

    return Response.json({
      following: followingWithStatus,
      count: result.count,
      hasMore: result.hasMore,
    });
  } catch (error) {
    Logger.error({
      message: "Error fetching following",
      error: error instanceof Error ? error : new Error(String(error)),
      metadata: { userId },
    });
    return Response.json({ error: "Failed to fetch following" }, { status: 500 });
  }
};
