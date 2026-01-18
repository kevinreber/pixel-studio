import { prisma } from "~/services/prisma.server";
import { Logger } from "~/utils/logger.server";
import { createNotification } from "./notifications";

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

  // Create notification for the user being followed
  await createNotification({
    type: "NEW_FOLLOWER",
    recipientId: followingId,
    actorId: followerId,
  });

  return response;
};
