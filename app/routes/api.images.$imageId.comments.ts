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
import {
  checkRateLimit,
  writeLimiter,
  getRateLimitIdentifier,
  rateLimitResponse,
} from "~/services/rateLimit.server";
import { checkAndUnlockAchievements } from "~/services/achievements.server";
import { processMentions } from "~/server/processMentions.server";
import { Logger } from "~/utils/logger.server";

export const action = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<Response> => {
  const user = await requireUserLogin(request);
  const rl = await checkRateLimit(
    writeLimiter,
    getRateLimitIdentifier(request, user.id)
  );
  if (!rl.success) return rateLimitResponse(rl.reset);
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

      // Check comment-related achievements for the commenter
      checkAndUnlockAchievements(user.id, "engagement").catch((err) =>
        Logger.error({ message: "Achievement check failed", error: err instanceof Error ? err : new Error(String(err)) })
      );

      // Process @mentions and notify mentioned users
      processMentions({
        message: validatedData.comment,
        actorId: user.id,
        imageId: validatedData.imageId,
        commentId: comment.id,
      }).catch((err) =>
        Logger.error({ message: "Mention processing failed", error: err instanceof Error ? err : new Error(String(err)) })
      );

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
