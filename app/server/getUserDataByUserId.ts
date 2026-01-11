import { prisma } from "~/services/prisma.server";
import { getS3BucketThumbnailURL, getS3BucketURL } from "utils/s3Utils";

export const getUserDataByUserId = async (userId: string) => {
  // If UserA is visiting UserB's profile, we do not want to show UserB's Private images to UserA
  // const selectImageQuery = createImageSelectQuery();

  const count = await prisma.image.count({
    where: {
      user: {
        id: userId,
      },
    },
  });
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
        // take: pageSize,
        // skip: (page - 1) * pageSize,
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
    },
  });

  // Append images source URL since we cannot use `env` variables in our UI
  const formattedImages = userData?.images.map((image) => ({
    ...image,
    url: getS3BucketURL(image.id),
    thumbnailURL: getS3BucketThumbnailURL(image.id),
  }));

  return { user: userData, images: formattedImages, count };
};
