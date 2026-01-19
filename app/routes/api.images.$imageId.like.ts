import { ActionFunctionArgs, json } from "@remix-run/node";
import { createImageLike, deleteImageLike } from "~/server";
import { requireUserLogin } from "~/services";
import { invariantResponse } from "~/utils";
import { cacheDelete } from "~/utils/cache.server";
import {
  trackEngagement,
  AnalyticsEvents,
} from "~/services/analytics.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);
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
  } else if (request.method === "DELETE") {
    await deleteImageLike({ imageId, userId: user.id });
    trackEngagement(user.id, AnalyticsEvents.IMAGE_UNLIKED, {
      targetId: imageId,
      targetType: "image",
    });
  }

  return json({ success: true });
};
