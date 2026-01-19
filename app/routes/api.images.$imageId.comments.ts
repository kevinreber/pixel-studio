import { ActionFunctionArgs, json } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { createComment } from "~/server/createComment";
import { CommentSchema, CommentResponseSchema } from "~/schemas/comment";
import { z } from "zod";
import { invalidateCache } from "~/utils/cache.server";
import {
  trackComment,
  AnalyticsEvents,
} from "~/services/analytics.server";

export const action = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<Response> => {
  const user = await requireUserLogin(request);
  const formData = Object.fromEntries(await request.formData());
  const imageId = params.imageId;

  try {
    // Validate the incoming data
    const validatedData = CommentSchema.parse({
      imageId,
      comment: formData.comment,
    });

    if (request.method === "POST") {
      // Invalidate the image details cache
      await invalidateCache(`image-details:${imageId}`);
      const comment = await createComment({
        message: validatedData.comment,
        imageId: validatedData.imageId,
        userId: user.id,
      });

      // Track comment creation
      trackComment(user.id, AnalyticsEvents.IMAGE_COMMENT_CREATED, {
        targetId: validatedData.imageId,
        targetType: "image",
        commentId: comment.id,
        messageLength: validatedData.comment.length,
      });

      // Validate the response
      const response = CommentResponseSchema.parse({
        success: true,
        comment,
      });

      return json(response);
    }

    return json(
      { success: false, error: "Method not allowed" },
      { status: 405 }
    );
  } catch (error) {
    console.error("Error creating comment:", error);

    if (error instanceof z.ZodError) {
      return json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    return json(
      { success: false, error: "Failed to create comment" },
      { status: 500 }
    );
  }
};
