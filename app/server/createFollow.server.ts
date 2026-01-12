import { prisma } from "~/services/prisma.server";
import { Logger } from "~/utils/logger.server";

/**
 * @description
 * This function creates a follow relationship between two users
 */
export const createFollow = async ({
  followerId,
  followingId,
}: {
  followerId: string;
  followingId: string;
}) => {
  Logger.info({
    message: `Creating follow relationship`,
    metadata: { followerId, followingId },
  });

  const response = await prisma.follow.create({
    data: { followerId, followingId },
  });

  return response;
};
