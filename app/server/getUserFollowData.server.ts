import { prisma } from "~/services/prisma.server";

/**
 * @description
 * Get follow statistics for a user (followers count and following count)
 */
export const getUserFollowStats = async (userId: string) => {
  const [followersCount, followingCount] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);

  return { followersCount, followingCount };
};

/**
 * @description
 * Check if a user is following another user
 */
export const isFollowing = async ({
  followerId,
  followingId,
}: {
  followerId: string;
  followingId: string;
}): Promise<boolean> => {
  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId, followingId },
    },
  });

  return follow !== null;
};

/**
 * @description
 * Get list of users who follow a specific user
 */
export const getFollowers = async (userId: string, page = 1, pageSize = 20) => {
  const skip = (page - 1) * pageSize;

  const [followers, count] = await Promise.all([
    prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.follow.count({ where: { followingId: userId } }),
  ]);

  return {
    followers: followers.map((f) => f.follower),
    count,
    hasMore: skip + followers.length < count,
  };
};

/**
 * @description
 * Get list of users a specific user is following
 */
export const getFollowing = async (userId: string, page = 1, pageSize = 20) => {
  const skip = (page - 1) * pageSize;

  const [following, count] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);

  return {
    following: following.map((f) => f.following),
    count,
    hasMore: skip + following.length < count,
  };
};
