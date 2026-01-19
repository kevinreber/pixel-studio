import { prisma } from "~/services/prisma.server";
import { Logger } from "~/utils/logger.server";

export const deleteVideoComment = async ({
  commentId,
  userId,
}: {
  commentId: string;
  userId: string;
}) => {
  Logger.info({
    message: "Deleting video comment",
    metadata: { commentId, userId },
  });

  // First verify the comment belongs to the user
  const comment = await prisma.videoComment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });

  if (!comment) {
    throw new Error("Comment not found");
  }

  if (comment.userId !== userId) {
    throw new Error("Not authorized to delete this comment");
  }

  const response = await prisma.videoComment.delete({
    where: { id: commentId },
  });

  return response;
};
