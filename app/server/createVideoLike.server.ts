import { prisma } from "~/services/prisma.server";
import { Logger } from "~/utils/logger.server";

/**
 * @description
 * This function creates a User's Like for a Video
 */
export const createVideoLike = async ({
  videoId,
  userId,
}: {
  videoId: string;
  userId: string;
}) => {
  Logger.info({
    message: `Creating Video Like`,
    metadata: { videoId, userId },
  });

  const data = { userId, videoId };

  const response = await prisma.videoLike.create({ data });

  return response;
};
