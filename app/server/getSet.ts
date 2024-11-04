import { prisma } from "~/services/prisma.server";
import { getS3BucketThumbnailURL, getS3BucketURL } from "~/utils/s3Utils";

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
    // return set;
    // Append Images source URL since we cannot use `env` variables in our UI
    const formattedImages = set.images.map((image) => ({
      ...image,
      url: getS3BucketURL(image.id),
      thumbnailURL: getS3BucketThumbnailURL(image.id),
    }));

    return {
      ...set,
      images: formattedImages,
    };
  } catch (error) {
    console.error(error);
    return [];
  }
};
