import { prisma } from "~/services/prisma.server";

interface CommentLikeParams {
  commentId: string;
  userId: string;
}

export const createCommentLike = async ({
  commentId,
  userId,
}: CommentLikeParams) => {
  await prisma.commentLike.create({
    data: {
      userId,
      commentId,
    },
  });

  return { success: true };
};

export const deleteCommentLike = async ({
  commentId,
  userId,
}: CommentLikeParams) => {
  await prisma.commentLike.delete({
    where: {
      userId_commentId: {
        userId,
        commentId,
      },
    },
  });

  return { success: true };
};
