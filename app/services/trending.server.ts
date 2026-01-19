/**
 * =============================================================================
 * TRENDING SERVICE
 * =============================================================================
 *
 * This service provides trending content based on engagement metrics.
 * Trending is calculated based on likes, comments, and recency.
 *
 * FEATURES:
 * - Trending images (most liked in recent time period)
 * - Trending videos (most liked in recent time period)
 * - Trending creators (most followed/engaged)
 * - Time-decay scoring for freshness
 *
 * SCORING ALGORITHM:
 * - Base score = likes * 3 + comments * 2
 * - Time decay: score * (1 / (hours_old / 24 + 1))
 * - This gives newer content a boost while still rewarding engagement
 *
 * =============================================================================
 */

import { prisma } from "~/services/prisma.server";
import {
  getS3BucketURL,
  getS3BucketThumbnailURL,
  getS3BucketBlurURL,
  getS3VideoURL,
  getS3VideoThumbnailURL,
} from "~/utils/s3Utils";

// Time periods for trending calculation
export const TRENDING_PERIODS = {
  "24h": 24,
  "48h": 48,
  "7d": 168,
  "30d": 720,
} as const;

export type TrendingPeriod = keyof typeof TRENDING_PERIODS;

export interface TrendingImage {
  id: string;
  title: string | null;
  prompt: string;
  model: string | null;
  userId: string;
  createdAt: Date;
  url: string;
  thumbnailURL: string;
  blurURL: string;
  likeCount: number;
  commentCount: number;
  score: number;
  user: {
    id: string;
    username: string;
    image: string | null;
  };
}

export interface TrendingVideo {
  id: string;
  title: string | null;
  prompt: string;
  model: string | null;
  userId: string;
  createdAt: Date;
  url: string;
  thumbnailURL: string;
  likeCount: number;
  commentCount: number;
  score: number;
  user: {
    id: string;
    username: string;
    image: string | null;
  };
}

export interface TrendingCreator {
  id: string;
  username: string;
  image: string | null;
  followerCount: number;
  imageCount: number;
  totalLikes: number;
  recentLikes: number;
  score: number;
}

export interface TrendingResponse {
  images: TrendingImage[];
  videos: TrendingVideo[];
  creators: TrendingCreator[];
  period: TrendingPeriod;
  generatedAt: Date;
}

/**
 * Get trending images based on engagement in the specified time period
 */
export async function getTrendingImages(
  period: TrendingPeriod = "48h",
  limit = 20
): Promise<TrendingImage[]> {
  const hours = TRENDING_PERIODS[period];
  const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

  // Get images with their engagement counts
  const images = await prisma.image.findMany({
    where: {
      private: false,
      createdAt: { gte: cutoffDate },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 200, // Get more than needed for scoring
  });

  // Calculate trending score for each image
  const scoredImages = images.map((image) => {
    const hoursOld =
      (Date.now() - new Date(image.createdAt).getTime()) / (1000 * 60 * 60);
    const baseScore = image._count.likes * 3 + image._count.comments * 2;
    const timeDecay = 1 / (hoursOld / 24 + 1);
    const score = baseScore * timeDecay;

    return {
      id: image.id,
      title: image.title,
      prompt: image.prompt,
      model: image.model,
      userId: image.userId,
      createdAt: image.createdAt,
      url: getS3BucketURL(image.id),
      thumbnailURL: getS3BucketThumbnailURL(image.id),
      blurURL: getS3BucketBlurURL(image.id),
      likeCount: image._count.likes,
      commentCount: image._count.comments,
      score,
      user: image.user,
    };
  });

  // Sort by score and return top results
  return scoredImages
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get trending videos based on engagement in the specified time period
 */
export async function getTrendingVideos(
  period: TrendingPeriod = "48h",
  limit = 10
): Promise<TrendingVideo[]> {
  const hours = TRENDING_PERIODS[period];
  const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

  const videos = await prisma.video.findMany({
    where: {
      private: false,
      status: "complete",
      createdAt: { gte: cutoffDate },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  const scoredVideos = videos.map((video) => {
    const hoursOld =
      (Date.now() - new Date(video.createdAt).getTime()) / (1000 * 60 * 60);
    const baseScore = video._count.likes * 3 + video._count.comments * 2;
    const timeDecay = 1 / (hoursOld / 24 + 1);
    const score = baseScore * timeDecay;

    return {
      id: video.id,
      title: video.title,
      prompt: video.prompt,
      model: video.model,
      userId: video.userId,
      createdAt: video.createdAt,
      url: getS3VideoURL(video.id),
      thumbnailURL: getS3VideoThumbnailURL(video.id),
      likeCount: video._count.likes,
      commentCount: video._count.comments,
      score,
      user: video.user,
    };
  });

  return scoredVideos
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get trending creators based on recent follower growth and engagement
 *
 * Optimized to use aggregated queries instead of N+1 pattern.
 * Uses raw SQL for efficient like counting across all users.
 */
export async function getTrendingCreators(
  period: TrendingPeriod = "7d",
  limit = 10
): Promise<TrendingCreator[]> {
  const hours = TRENDING_PERIODS[period];
  const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

  // Get users with their basic stats in a single query
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      image: true,
      _count: {
        select: {
          followedBy: true,
          images: true,
        },
      },
    },
    where: {
      images: {
        some: {
          private: false,
        },
      },
    },
    take: 100,
  });

  if (users.length === 0) {
    return [];
  }

  const userIds = users.map((u) => u.id);

  // Get total likes per user in a single aggregated query
  const totalLikesPerUser = await prisma.imageLike.groupBy({
    by: ["imageId"],
    where: {
      image: {
        userId: { in: userIds },
      },
    },
    _count: true,
  });

  // Get image ownership to map likes back to users
  const imageOwnership = await prisma.image.findMany({
    where: {
      id: { in: totalLikesPerUser.map((l) => l.imageId) },
    },
    select: {
      id: true,
      userId: true,
      createdAt: true,
    },
  });

  // Build a map of imageId -> userId and imageId -> createdAt
  const imageToUser = new Map(imageOwnership.map((img) => [img.id, img.userId]));
  const imageCreatedAt = new Map(imageOwnership.map((img) => [img.id, img.createdAt]));

  // Aggregate likes by user
  const userLikesMap = new Map<string, { total: number; recent: number }>();
  for (const likeGroup of totalLikesPerUser) {
    const userId = imageToUser.get(likeGroup.imageId);
    if (!userId) continue;

    const current = userLikesMap.get(userId) || { total: 0, recent: 0 };
    current.total += likeGroup._count;

    // Check if this image's likes count as recent
    const imgCreatedAt = imageCreatedAt.get(likeGroup.imageId);
    if (imgCreatedAt && imgCreatedAt >= cutoffDate) {
      current.recent += likeGroup._count;
    }

    userLikesMap.set(userId, current);
  }

  // Calculate scores and build result
  const usersWithStats: TrendingCreator[] = users.map((user) => {
    const likes = userLikesMap.get(user.id) || { total: 0, recent: 0 };

    // Calculate score based on followers, recent engagement
    const score =
      user._count.followedBy * 2 +
      likes.recent * 3 +
      user._count.images * 0.5;

    return {
      id: user.id,
      username: user.username,
      image: user.image,
      followerCount: user._count.followedBy,
      imageCount: user._count.images,
      totalLikes: likes.total,
      recentLikes: likes.recent,
      score,
    };
  });

  return usersWithStats
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get all trending content (images, videos, creators)
 */
export async function getTrendingContent(
  period: TrendingPeriod = "48h"
): Promise<TrendingResponse> {
  const [images, videos, creators] = await Promise.all([
    getTrendingImages(period, 20),
    getTrendingVideos(period, 10),
    getTrendingCreators(period === "24h" || period === "48h" ? "7d" : period, 10),
  ]);

  return {
    images,
    videos,
    creators,
    period,
    generatedAt: new Date(),
  };
}

/**
 * Get a single "hot" or featured image (highest score)
 */
export async function getFeaturedImage(): Promise<TrendingImage | null> {
  const trending = await getTrendingImages("48h", 1);
  return trending[0] ?? null;
}

/**
 * Check if content is currently trending
 */
export async function isContentTrending(
  contentId: string,
  type: "image" | "video"
): Promise<boolean> {
  if (type === "image") {
    const trending = await getTrendingImages("48h", 50);
    return trending.some((img) => img.id === contentId);
  } else {
    const trending = await getTrendingVideos("48h", 20);
    return trending.some((vid) => vid.id === contentId);
  }
}
