import { ActionFunctionArgs, json } from "@remix-run/node";
import { createVideoLike, deleteVideoLike } from "~/server";
import { requireUserLogin } from "~/services";
import { invariantResponse } from "~/utils";
import { cacheDelete } from "~/utils/cache.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);
  const videoId = params.videoId;
  invariantResponse(videoId, "Video ID is required");
  invariantResponse(user, "User is required");

  const videoDetailsCacheKey = `video-details:${videoId}`;
  await cacheDelete(videoDetailsCacheKey);

  if (request.method === "POST") {
    await createVideoLike({ videoId, userId: user.id });
  } else if (request.method === "DELETE") {
    await deleteVideoLike({ videoId, userId: user.id });
  }

  return json({ success: true });
};
