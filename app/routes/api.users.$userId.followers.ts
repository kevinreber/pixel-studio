import { LoaderFunctionArgs } from "@remix-run/node";
import { getFollowers, getFollowingSet } from "~/server";
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
    const result = await getFollowers(userId, page, pageSize);

    // Get current user to check if they're following each user in the list
    const session = await getGoogleSessionAuth(request);
    const currentUserId = session?.id;

    // Batch query to check follow status for all followers at once (avoids N+1 queries)
    const followerIds = result.followers.map((f) => f.id);
    const followingSet = currentUserId
      ? await getFollowingSet(currentUserId, followerIds)
      : new Set<string>();

    // Add isFollowedByCurrentUser to each follower
    const followersWithStatus = result.followers.map((follower) => ({
      ...follower,
      isFollowedByCurrentUser: followingSet.has(follower.id),
    }));

    return Response.json({
      followers: followersWithStatus,
      count: result.count,
      hasMore: result.hasMore,
    });
  } catch (error) {
    Logger.error({
      message: "Error fetching followers",
      error: error instanceof Error ? error : new Error(String(error)),
      metadata: { userId },
    });
    return Response.json({ error: "Failed to fetch followers" }, { status: 500 });
  }
};
