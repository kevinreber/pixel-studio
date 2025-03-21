import { ActionFunctionArgs, json } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { invariantResponse } from "~/utils";
import { createCommentLike, deleteCommentLike } from "~/server/commentLikes";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);
  const commentId = params.commentId;
  invariantResponse(commentId, "Comment ID is required");

  try {
    if (request.method === "POST") {
      await createCommentLike({ commentId, userId: user.id });
    } else if (request.method === "DELETE") {
      await deleteCommentLike({ commentId, userId: user.id });
    }

    return json({ success: true });
  } catch (error) {
    return json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update comment like",
      },
      { status: 500 }
    );
  }
};
