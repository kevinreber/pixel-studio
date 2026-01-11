import { ActionFunctionArgs, json } from "@remix-run/node";
import { createFollow, deleteFollow } from "~/server";
import { requireUserLogin } from "~/services";
import { invariantResponse } from "~/utils";
import { cacheDelete } from "~/utils/cache.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);
  const targetUserId = params.userId;

  invariantResponse(targetUserId, "User ID is required");
  invariantResponse(user, "User is required");
  invariantResponse(user.id !== targetUserId, "Cannot follow yourself");

  // Invalidate caches
  await cacheDelete(`user-profile:${targetUserId}`);
  await cacheDelete(`user-profile:${user.id}`);
  await cacheDelete(`user-follow-stats:${targetUserId}`);
  await cacheDelete(`user-follow-stats:${user.id}`);
  await cacheDelete(`following-feed:${user.id}`);

  if (request.method === "POST") {
    await createFollow({ followerId: user.id, followingId: targetUserId });
  } else if (request.method === "DELETE") {
    await deleteFollow({ followerId: user.id, followingId: targetUserId });
  }

  return json({ success: true });
};
