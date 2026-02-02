import { prisma } from "~/services/prisma.server";
import {
  getS3BucketBlurURL,
  getS3BucketThumbnailURL,
  getS3BucketURL,
  getS3VideoURL,
  getS3VideoThumbnailURL,
} from "~/utils/s3Utils";

export type FeedItemType = "image" | "video";

export interface FeedImage {
  type: "image";
  id: string;
  title: string | null;
  prompt: string;
  model: string | null;
  userId: string;
  private: boolean | null;
  createdAt: Date;
  url: string;
  thumbnailURL: string;
  blurURL: string;
  user: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
  };
  likes: { userId: string }[];
  _count: {
    comments: number;
    likes: number;
  };
}

export interface FeedVideo {
  type: "video";
  id: string;
  title: string | null;
  prompt: string;
  model: string | null;
  userId: string;
  private: boolean | null;
  createdAt: Date;
  url: string;
  thumbnailURL: string;
  duration: number | null;
  aspectRatio: string | null;
  status: string | null;
  user: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
}

export type FeedItem = FeedImage | FeedVideo;

export type FeedData = Awaited<ReturnType<typeof getFollowingFeed>>;

/**
 * @description
 * Get images and videos from users that the current user follows (feed)
 */
export const getFollowingFeed = async (
  userId: string,
  page = 1,
  pageSize = 20
) => {
  // Get list of users the current user follows (limited to prevent unbounded queries)
  const followingIds = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
    take: 1000,
  });

  const followingUserIds = followingIds.map((f) => f.followingId);

  if (followingUserIds.length === 0) {
    return {
      items: [] as FeedItem[],
      images: [] as FeedImage[],
      count: 0,
      hasMore: false,
    };
  }

  // Get images and videos from followed users in parallel
  const [images, videos, imageCount, videoCount] = await Promise.all([
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
    }),
    prisma.video.findMany({
      where: {
        userId: { in: followingUserIds },
        private: false,
        status: "complete", // Only show completed videos
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
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.image.count({
      where: {
        userId: { in: followingUserIds },
        private: false,
      },
    }),
    prisma.video.count({
      where: {
        userId: { in: followingUserIds },
        private: false,
        status: "complete",
      },
    }),
  ]);

  // Transform images with URLs and type
  const imagesWithUrls: FeedImage[] = images.map((image) => ({
    type: "image" as const,
    ...image,
    url: getS3BucketURL(image.id),
    thumbnailURL: getS3BucketThumbnailURL(image.id),
    blurURL: getS3BucketBlurURL(image.id),
  }));

  // Transform videos with URLs and type
  const videosWithUrls: FeedVideo[] = videos.map((video) => ({
    type: "video" as const,
    id: video.id,
    title: video.title,
    prompt: video.prompt,
    model: video.model,
    userId: video.userId,
    private: video.private,
    createdAt: video.createdAt,
    url: getS3VideoURL(video.id),
    thumbnailURL: getS3VideoThumbnailURL(video.id),
    duration: video.duration,
    aspectRatio: video.aspectRatio,
    status: video.status,
    user: video.user,
    _count: {
      likes: 0,
      comments: 0,
    },
  }));

  // Combine and sort by createdAt descending
  const allItems: FeedItem[] = [...imagesWithUrls, ...videosWithUrls].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Apply pagination to combined results
  const skip = (page - 1) * pageSize;
  const paginatedItems = allItems.slice(skip, skip + pageSize);
  const totalCount = imageCount + videoCount;

  return {
    items: paginatedItems,
    // Keep images for backwards compatibility
    images: imagesWithUrls.slice(skip, skip + pageSize),
    count: totalCount,
    hasMore: skip + paginatedItems.length < totalCount,
  };
};
