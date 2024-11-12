import { prisma } from "~/services/prisma.server";

interface DeleteCommentParams {
  commentId: string;
  userId: string;
}

export const deleteComment = async ({
  commentId,
  userId,
}: DeleteCommentParams) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });

  if (!comment) {
    throw new Error("Comment not found");
  }

  if (comment.userId !== userId) {
    throw new Error("Not authorized");
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  return { success: true };
};
