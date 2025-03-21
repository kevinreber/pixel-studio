import { ActionFunctionArgs, json } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { invariantResponse } from "~/utils";
import { deleteComment } from "~/server/deleteComment";
import { invalidateCache } from "~/utils/cache.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);
  const { imageId, commentId } = params;
  invariantResponse(commentId, "Comment ID is required");
  invariantResponse(imageId, "Image ID is required");

  try {
    if (request.method === "DELETE") {
      await deleteComment({ commentId, userId: user.id });
      await invalidateCache(`image-details:${imageId}`);
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
