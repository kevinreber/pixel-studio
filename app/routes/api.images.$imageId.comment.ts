import { ActionFunctionArgs, json } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { invariantResponse } from "~/utils";
import { createComment, type CommentResponse } from "~/server/createComment";

interface CommentAPIResponse {
  success: boolean;
  comment?: CommentResponse;
  error?: string;
}

export const action = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<Response> => {
  const user = await requireUserLogin(request);
  const imageId = params.imageId;
  invariantResponse(imageId, "Image ID is required");

  const formData = await request.formData();
  const message = formData.get("comment")?.toString().trim();

  if (!message) {
    return json<CommentAPIResponse>(
      { success: false, error: "Comment message is required" },
      { status: 400 }
    );
  }

  try {
    if (request.method === "POST") {
      const comment = await createComment({
        message,
        imageId,
        userId: user.id,
      });

      return json<CommentAPIResponse>({
        success: true,
        comment,
      });
    }

    return json<CommentAPIResponse>(
      { success: false, error: "Method not allowed" },
      { status: 405 }
    );
  } catch (error) {
    console.error("Error creating comment:", error);
    return json<CommentAPIResponse>(
      {
        success: false,
        error: "Failed to create comment",
      },
      { status: 500 }
    );
  }
};
