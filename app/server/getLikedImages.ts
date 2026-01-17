import { prisma } from "~/services/prisma.server";
import { getS3BucketThumbnailURL, getS3BucketURL } from "~/utils/s3Utils";

export const getLikedImages = async (userId: string) => {
  const likedImages = await prisma.imageLike.findMany({
    where: {
      userId: userId,
    },
    include: {
      image: {
        select: {
          id: true,
          title: true,
          prompt: true,
          setId: true,
          model: true,
          stylePreset: true,
          private: true,
          createdAt: true,
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
    orderBy: {
      image: {
        createdAt: "desc",
      },
    },
  });

  const formattedImages = likedImages.map((like) => ({
    ...like.image,
    thumbnailURL: getS3BucketThumbnailURL(like.image.id),
    url: getS3BucketURL(like.image.id),
  }));

  return formattedImages;
};

export type GetLikedImagesAPIResponse = Awaited<
  ReturnType<typeof getLikedImages>
>;
