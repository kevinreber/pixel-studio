import { prisma } from "~/services/prisma.server";

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
  console.log(
    `Creating Follow: ${followerId} is now following ${followingId}`
  );

  const response = await prisma.follow.create({
    data: { followerId, followingId },
  });

  return response;
};
