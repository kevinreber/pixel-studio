import { prisma } from "~/services/prisma.server";
import { getS3BucketThumbnailURL } from "~/utils/s3Utils";

export type Set = {
  id: string;
  prompt: string;
  createdAt: string | Date;
  totalImages: number;
  images: Array<{
    id: string;
    prompt: string;
    thumbnailUrl: string;
    model: string;
  }>;
  user: { username: string };
};

export interface GetUserSetsOptions {
  prompt?: string;
  model?: string;
}

export const getUserSets = async (
  userId: string,
  options: GetUserSetsOptions = {}
) => {
  const { prompt, model } = options;

  const sets = await prisma.set.findMany({
    where: {
      userId,
      prompt: prompt ? { contains: prompt, mode: "insensitive" } : undefined,
      images: model
        ? { some: { model: { contains: model, mode: "insensitive" } } }
        : undefined,
    },
    include: {
      images: {
        take: 4,
        select: {
          id: true,
          prompt: true,
          model: true,
        },
      },
      _count: {
        select: {
          images: true,
        },
      },
      user: {
        select: {
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedData: Array<Set> = [];
  for (const set of sets) {
    const formattedImages = set.images.map((image) => ({
      ...image,
      model: image.model || "",
      thumbnailUrl: getS3BucketThumbnailURL(image.id),
    }));

    formattedData.push({
      ...set,
      totalImages: set._count.images,
      images: formattedImages,
    });
  }

  return formattedData;
};

export type GetUserSetsAPIResponse = Awaited<ReturnType<typeof getUserSets>>;
