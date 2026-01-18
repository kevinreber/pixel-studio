import { prisma } from "~/services/prisma.server";
import { Logger } from "~/utils/logger.server";
import { createNotification } from "./notifications";

interface CreateCommentParams {
  message: string;
  imageId: string;
  userId: string;
}

export interface CommentResponse {
  id: string;
  message: string;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    image: string | null;
  };
}

export const createComment = async ({
  message,
  imageId,
  userId,
}: CreateCommentParams): Promise<CommentResponse> => {
  Logger.info({
    message: "Creating comment",
    metadata: { imageId, userId },
  });

  const comment = await prisma.comment.create({
    data: {
      message,
      imageId,
      userId,
    },
    select: {
      id: true,
      message: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
      image: {
        select: {
          userId: true,
        },
      },
    },
  });

  // Create notification for the image owner
  if (comment.image) {
    await createNotification({
      type: "IMAGE_COMMENT",
      recipientId: comment.image.userId,
      actorId: userId,
      imageId,
      commentId: comment.id,
    });
  }

  // Return the comment without the image field for backwards compatibility
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { image: _image, ...commentResponse } = comment;
  return commentResponse;
};
