import { prisma } from "~/services/prisma.server";
import { Logger } from "~/utils/logger.server";

/**
 * @description
 * This function removes a follow relationship between two users
 */
export const deleteFollow = async ({
  followerId,
  followingId,
}: {
  followerId: string;
  followingId: string;
}) => {
  Logger.info({
    message: `Deleting follow relationship`,
    metadata: { followerId, followingId },
  });

  const response = await prisma.follow.delete({
    where: {
      followerId_followingId: { followerId, followingId },
    },
  });

  return response;
};
