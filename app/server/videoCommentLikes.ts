import { prisma } from "~/services/prisma.server";
import { Logger } from "~/utils/logger.server";

export const createVideoCommentLike = async ({
  commentId,
  userId,
}: {
  commentId: string;
  userId: string;
}) => {
  Logger.info({
    message: "Creating video comment like",
    metadata: { commentId, userId },
  });

  const response = await prisma.videoCommentLike.create({
    data: {
      commentId,
      userId,
    },
  });

  return response;
};

export const deleteVideoCommentLike = async ({
  commentId,
  userId,
}: {
  commentId: string;
  userId: string;
}) => {
  Logger.info({
    message: "Deleting video comment like",
    metadata: { commentId, userId },
  });

  const response = await prisma.videoCommentLike.delete({
    where: {
      userId_commentId: {
        commentId,
        userId,
      },
    },
  });

  return response;
};
