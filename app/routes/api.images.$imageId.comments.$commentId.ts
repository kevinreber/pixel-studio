import { ActionFunctionArgs, json } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { invariantResponse } from "~/utils";
import { deleteComment } from "~/server/deleteComment";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);
  const commentId = params.commentId;
  invariantResponse(commentId, "Comment ID is required");

  try {
    if (request.method === "DELETE") {
      await deleteComment({ commentId, userId: user.id });
      return json({ success: true });
    }

    return json(
      { success: false, error: "Method not allowed" },
      { status: 405 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete comment";
    return json(
      { success: false, error: message },
      { status: error instanceof Error ? 400 : 500 }
    );
  }
};
