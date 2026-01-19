import { ActionFunctionArgs, json } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { createVideoCommentLike, deleteVideoCommentLike } from "~/server/videoCommentLikes";
import { invalidateCache } from "~/utils/cache.server";

export const action = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<Response> => {
  const user = await requireUserLogin(request);
  const videoId = params.videoId;
  const commentId = params.commentId;

  if (!commentId) {
    return json({ success: false, error: "Comment ID is required" }, { status: 400 });
  }

  try {
    // Invalidate the video details cache
    await invalidateCache(`video-details:${videoId}`);

    if (request.method === "POST") {
      await createVideoCommentLike({
        commentId,
        userId: user.id,
      });
      return json({ success: true });
    } else if (request.method === "DELETE") {
      await deleteVideoCommentLike({
        commentId,
        userId: user.id,
      });
      return json({ success: true });
    }

    return json(
      { success: false, error: "Method not allowed" },
      { status: 405 }
    );
  } catch (error) {
    console.error("Error with video comment like:", error);

    return json(
      { success: false, error: "Failed to process like" },
      { status: 500 }
    );
  }
};
