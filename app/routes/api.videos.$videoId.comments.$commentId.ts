import { ActionFunctionArgs, json } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { deleteVideoComment } from "~/server/deleteVideoComment";
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
    if (request.method === "DELETE") {
      // Invalidate the video details cache
      await invalidateCache(`video-details:${videoId}`);

      await deleteVideoComment({
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
    console.error("Error deleting video comment:", error);

    if (error instanceof Error) {
      return json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return json(
      { success: false, error: "Failed to delete comment" },
      { status: 500 }
    );
  }
};
