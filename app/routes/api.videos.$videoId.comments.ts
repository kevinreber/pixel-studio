import { ActionFunctionArgs, json } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { createVideoComment } from "~/server/createVideoComment";
import { VideoCommentSchema, VideoCommentResponseSchema } from "~/schemas/videoComment";
import { z } from "zod";
import { invalidateCache } from "~/utils/cache.server";

export const action = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<Response> => {
  const user = await requireUserLogin(request);
  const formData = Object.fromEntries(await request.formData());
  const videoId = params.videoId;

  try {
    // Validate the incoming data
    const validatedData = VideoCommentSchema.parse({
      videoId,
      comment: formData.comment,
    });

    if (request.method === "POST") {
      // Invalidate the video details cache
      await invalidateCache(`video-details:${videoId}`);
      const comment = await createVideoComment({
        message: validatedData.comment,
        videoId: validatedData.videoId,
        userId: user.id,
      });

      // Validate the response
      const response = VideoCommentResponseSchema.parse({
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
    console.error("Error creating video comment:", error);

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
