import { prisma } from "~/services/prisma.server";
import { getS3BucketThumbnailURL, getS3BucketURL } from "~/utils/s3Utils";

interface ImageComment {
  id: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
  parentId: string | null;
  user: {
    id: string;
    username: string;
    image: string;
  };
  likes: Array<{ userId: string }>;
}

interface ImageUser {
  id: string;
  image: string;
  username: string;
}

interface ImageLike {
  userId: string;
}

export interface ImageData {
  id: string;
  title: string | null;
  prompt: string;
  model: string | null;
  stylePreset: string | null;
  private: boolean | null;
  user: ImageUser;
  createdAt: Date;
  comments: ImageComment[];
  likes: ImageLike[];
  setId: string | null;
}

export interface FormattedImageData extends ImageData {
  url: string;
  thumbnailURL: string;
}

export interface GetImageDataAPIResponse extends ImageData {
  url: string;
  thumbnailURL: string;
}

export const getImage = async (
  imageId: string
): Promise<GetImageDataAPIResponse | null> => {
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
      setId: true,
    },
  });

  if (!image) return null;

  // Append Images source URL since we cannot use `env` variables in our UI
  const formattedImage: GetImageDataAPIResponse = {
    ...image,
    url: getS3BucketURL(imageId),
    thumbnailURL: getS3BucketThumbnailURL(imageId),
  };

  return formattedImage;
};

export type ImageDetail = Awaited<ReturnType<typeof getImage>>;