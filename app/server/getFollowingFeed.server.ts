import { prisma } from "~/services/prisma.server";
import { getS3BucketThumbnailURL, getS3BucketURL } from "~/utils/s3Utils";

/**
 * @description
 * Get images from users that the current user follows (feed)
 */
export const getFollowingFeed = async (
  userId: string,
  page = 1,
  pageSize = 20
) => {
  const skip = (page - 1) * pageSize;

  // Get list of users the current user follows
  const followingIds = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  const followingUserIds = followingIds.map((f) => f.followingId);

  if (followingUserIds.length === 0) {
    return {
      images: [],
      count: 0,
      hasMore: false,
    };
  }

  // Get images from followed users
  const [images, count] = await Promise.all([
    prisma.image.findMany({
      where: {
        userId: { in: followingUserIds },
        private: false,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.image.count({
      where: {
        userId: { in: followingUserIds },
        private: false,
      },
    }),
  ]);

  // Add thumbnailURL and url to each image
  const imagesWithUrls = images.map((image) => ({
    ...image,
    url: getS3BucketURL(image.id),
    thumbnailURL: getS3BucketThumbnailURL(image.id),
  }));

  return {
    images: imagesWithUrls,
    count,
    hasMore: skip + images.length < count,
  };
};
