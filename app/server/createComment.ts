import { prisma } from "~/services/prisma.server";

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
    },
  });

  return comment;
};
