import { prisma } from "~/services/prisma.server";
import {
  getS3BucketBlurURL,
  getS3BucketThumbnailURL,
  getS3BucketURL,
} from "~/utils/s3Utils";

interface ImageUser {
  id: string;
  image: string | null;
  username: string;
}
interface ImageComment {
  id: string;
  message: string;
  createdAt: Date;
  updatedAt: Date | null;
  parentId: string | null;
  user: ImageUser;
  likes: Array<{ userId: string }>;
}

interface ImageLike {
  userId: string;
}

// Parent image info for remix badge
interface ParentImageInfo {
  id: string;
  model: string | null;
}

export interface ImageData {
  id: string;
  title: string | null;
  prompt: string;
  model: string | null;
  stylePreset?: string | null;
  private: boolean | null;
  user: ImageUser;
  createdAt: Date;
  comments?: ImageComment[];
  likes: ImageLike[];
  setId?: string | null;
  // Generation parameters (optional - not always available from all data sources)
  width?: number | null;
  height?: number | null;
  quality?: string | null;
  generationStyle?: string | null;
  negativePrompt?: string | null;
  seed?: number | null;
  cfgScale?: number | null;
  steps?: number | null;
  promptUpsampling?: boolean | null;
  // Remix fields (optional - not always available from all data sources)
  isRemix?: boolean | null;
  parentImageId?: string | null;
  parentImage?: ParentImageInfo | null;
}

export interface FormattedImageData extends ImageData {
  url: string;
  thumbnailURL: string;
  blurURL: string;
}

export interface GetImageDataAPIResponse extends ImageData {
  url: string;
  thumbnailURL: string;
  blurURL: string;
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
      // Generation parameters
      width: true,
      height: true,
      quality: true,
      generationStyle: true,
      negativePrompt: true,
      seed: true,
      cfgScale: true,
      steps: true,
      promptUpsampling: true,
      // Remix fields
      isRemix: true,
      parentImageId: true,
      parentImage: {
        select: {
          id: true,
          model: true,
        },
      },
    },
  });

  if (!image) return null;

  // Append Images source URL since we cannot use `env` variables in our UI
  const formattedImage = {
    ...image,
    url: getS3BucketURL(imageId),
    thumbnailURL: getS3BucketThumbnailURL(imageId),
    blurURL: getS3BucketBlurURL(imageId),
  };

  return formattedImage;
};

export type ImageDetail = Awaited<ReturnType<typeof getImage>>;
