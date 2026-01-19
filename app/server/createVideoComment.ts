import { prisma } from "~/services/prisma.server";
import { Logger } from "~/utils/logger.server";

interface CreateVideoCommentParams {
  message: string;
  videoId: string;
  userId: string;
}

export interface VideoCommentResponse {
  id: string;
  message: string;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    image: string | null;
  };
}

export const createVideoComment = async ({
  message,
  videoId,
  userId,
}: CreateVideoCommentParams): Promise<VideoCommentResponse> => {
  Logger.info({
    message: "Creating video comment",
    metadata: { videoId, userId },
  });

  const comment = await prisma.videoComment.create({
    data: {
      message,
      videoId,
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
