import { prisma } from "~/services/prisma.server";
import {
  getS3BucketBlurURL,
  getS3BucketThumbnailURL,
  getS3BucketURL,
  getS3VideoURL,
  getS3VideoThumbnailURL,
} from "~/utils/s3Utils";

/**
 * @description
 * This function gets a set from our DB
 */
export const getSet = async ({ setId }: { setId: string }) => {
  if (!setId) {
    throw new Error("Set ID is required");
  }
  try {
    const set = await prisma.set.findUnique({
      where: {
        id: setId,
      },
      select: {
        images: true,
        videos: true,
        prompt: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!set) {
      throw new Error("Set not found");
    }
    // Append Images source URL since we cannot use `env` variables in our UI
    const formattedImages = set.images.map((image) => ({
      ...image,
      url: getS3BucketURL(image.id),
      thumbnailURL: getS3BucketThumbnailURL(image.id),
      blurURL: getS3BucketBlurURL(image.id),
    }));

    // Append Video source URLs
    const formattedVideos = set.videos.map((video) => ({
      ...video,
      url: getS3VideoURL(video.id),
      thumbnailURL: getS3VideoThumbnailURL(video.id),
    }));

    return {
      ...set,
      images: formattedImages,
      videos: formattedVideos,
    };
  } catch (error) {
    console.error(error);
    return [];
  }
};
