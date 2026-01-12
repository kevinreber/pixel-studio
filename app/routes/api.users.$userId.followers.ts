import { LoaderFunctionArgs } from "@remix-run/node";
import { getFollowers, isFollowing } from "~/server";
import { getGoogleSessionAuth } from "~/services";

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

    // Add isFollowedByCurrentUser to each follower
    const followersWithStatus = await Promise.all(
      result.followers.map(async (follower) => {
        const isFollowedByCurrentUser = currentUserId
          ? await isFollowing({ followerId: currentUserId, followingId: follower.id })
          : false;
        return { ...follower, isFollowedByCurrentUser };
      })
    );

    return Response.json({
      followers: followersWithStatus,
      count: result.count,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error("Error fetching followers:", error);
    return Response.json({ error: "Failed to fetch followers" }, { status: 500 });
  }
};
