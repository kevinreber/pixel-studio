import { prisma } from "~/services/prisma.server";
import {
  getS3BucketBlurURL,
  getS3BucketThumbnailURL,
  getS3BucketURL,
  getS3VideoURL,
  getS3VideoThumbnailURL,
} from "utils/s3Utils";

const DEFAULT_CURRENT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;

export type ProfileImage = {
  type: "image";
  id: string;
  title: string | null;
  prompt: string;
  model: string | null;
  stylePreset: string | null;
  private: boolean | null;
  createdAt: Date;
  url: string;
  thumbnailURL: string;
  blurURL: string;
  user: {
    id: string;
    username: string;
    image: string | null;
  };
  comments: {
    id: string;
    message: string;
    createdAt: Date;
    updatedAt: Date | null;
    user: {
      id: string;
      username: string;
      image: string | null;
    };
    parentId: string | null;
    likes: { userId: string }[];
  }[];
  likes: { userId: string }[];
};

export type ProfileVideo = {
  type: "video";
  id: string;
  title: string | null;
  prompt: string;
  model: string | null;
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
    image: string | null;
  };
};

export type ProfileMediaItem = ProfileImage | ProfileVideo;

export const getUserDataByUserId = async (
  userId: string,
  page = DEFAULT_CURRENT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE
) => {
  // Get counts for images and videos
  const [imageCount, videoCount] = await Promise.all([
    prisma.image.count({
      where: {
        userId,
        private: false,
      },
    }),
    prisma.video.count({
      where: {
        userId,
        private: false,
        status: "complete",
      },
    }),
  ]);

  const userData = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      createdAt: true,

      images: {
        orderBy: {
          createdAt: "desc",
        },
        where: { private: false },
        select: {
          id: true,
          title: true,
          prompt: true,
          model: true,
          stylePreset: true,
          private: true,
          user: {
            select: {
              id: true,
              username: true,
              image: true,
            },
          },
          createdAt: true,
          comments: {
            orderBy: {
              createdAt: "desc",
            },
            select: {
              id: true,
              message: true,
              createdAt: true,
              updatedAt: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  image: true,
                },
              },
              parentId: true,
              likes: true,
            },
          },
          likes: {
            select: {
              userId: true,
            },
          },
        },
      },

      videos: {
        orderBy: {
          createdAt: "desc",
        },
        where: {
          private: false,
          status: "complete",
        },
        select: {
          id: true,
          title: true,
          prompt: true,
          model: true,
          private: true,
          duration: true,
          aspectRatio: true,
          status: true,
          user: {
            select: {
              id: true,
              username: true,
              image: true,
            },
          },
          createdAt: true,
        },
      },
    },
  });

  // Format images with URLs and type
  const formattedImages: ProfileImage[] =
    userData?.images.map((image) => ({
      ...image,
      type: "image" as const,
      url: getS3BucketURL(image.id),
      thumbnailURL: getS3BucketThumbnailURL(image.id),
      blurURL: getS3BucketBlurURL(image.id),
    })) || [];

  // Format videos with URLs and type
  const formattedVideos: ProfileVideo[] =
    userData?.videos.map((video) => ({
      ...video,
      type: "video" as const,
      url: getS3VideoURL(video.id),
      thumbnailURL: getS3VideoThumbnailURL(video.id),
    })) || [];

  // Combine and sort by createdAt descending
  const allItems: ProfileMediaItem[] = [
    ...formattedImages,
    ...formattedVideos,
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Apply pagination
  const skip = (page - 1) * pageSize;
  const paginatedItems = allItems.slice(skip, skip + pageSize);
  const totalCount = imageCount + videoCount;

  return {
    user: userData,
    images: formattedImages.slice(skip, skip + pageSize),
    videos: formattedVideos.slice(skip, skip + pageSize),
    items: paginatedItems,
    count: totalCount,
  };
};
