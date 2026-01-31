import { ActionFunctionArgs, json } from "@remix-run/node";
import { createVideoLike, deleteVideoLike } from "~/server";
import { requireUserLogin } from "~/services";
import { invariantResponse } from "~/utils";
import { cacheDelete } from "~/utils/cache.server";
import {
  trackEngagement,
  AnalyticsEvents,
} from "~/services/analytics.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);
  const videoId = params.videoId;
  invariantResponse(videoId, "Video ID is required");
  invariantResponse(user, "User is required");

  const videoDetailsCacheKey = `video-details:${videoId}`;
  await cacheDelete(videoDetailsCacheKey);

  if (request.method === "POST") {
    await createVideoLike({ videoId, userId: user.id });
    trackEngagement(user.id, AnalyticsEvents.VIDEO_LIKED, {
      targetId: videoId,
      targetType: "video",
    });
  } else if (request.method === "DELETE") {
    await deleteVideoLike({ videoId, userId: user.id });
    trackEngagement(user.id, AnalyticsEvents.VIDEO_UNLIKED, {
      targetId: videoId,
      targetType: "video",
    });
  }

  return json({ success: true });
};
