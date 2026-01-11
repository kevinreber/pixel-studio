import { prisma } from "~/services/prisma.server";

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
  console.log(
    `Deleting Follow: ${followerId} is unfollowing ${followingId}`
  );

  const response = await prisma.follow.delete({
    where: {
      followerId_followingId: { followerId, followingId },
    },
  });

  return response;
};
