import { prisma } from "~/services/prisma.server";
import { getS3BucketThumbnailURL, getS3BucketURL } from "~/utils";

export const getImage = async (imageId: string) => {
  const image = await prisma.image.findUnique({
    where: { id: imageId },
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
  });

  // Append Images source URL since we cannot use `env` variables in our UI
  const formattedImages = {
    ...image,
    url: getS3BucketURL(imageId),
    thumbnailURL: getS3BucketThumbnailURL(imageId),
  };

  return formattedImages;
};
