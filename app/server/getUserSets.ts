import { prisma } from "~/services/prisma.server";
import { getS3BucketThumbnailURL } from "~/utils/s3Utils";

const DEFAULT_CURRENT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

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
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "totalImages";
  sortOrder?: "asc" | "desc";
}

export interface GetUserSetsResponse {
  sets: Set[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const getUserSets = async (
  userId: string,
  options: GetUserSetsOptions = {}
): Promise<GetUserSetsResponse> => {
  const {
    prompt,
    model,
    page = DEFAULT_CURRENT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = options;

  const whereClause = {
    userId,
    prompt: prompt
      ? { contains: prompt, mode: "insensitive" as const }
      : undefined,
    images: model
      ? { some: { model: { contains: model, mode: "insensitive" as const } } }
      : undefined,
  };

  // Get total count for pagination
  const totalCount = await prisma.set.count({
    where: whereClause,
  });

  // Calculate pagination values
  const skip = (page - 1) * pageSize;
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  // Determine sort order
  const orderByClause =
    sortBy === "totalImages"
      ? { images: { _count: sortOrder } }
      : { [sortBy]: sortOrder };

  const sets = await prisma.set.findMany({
    where: whereClause,
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
    orderBy: orderByClause,
    skip,
    take: pageSize,
  });

  const formattedData: Array<Set> = [];
  for (const set of sets) {
    const formattedImages = set.images.map((image) => ({
      ...image,
      model: image.model || "",
      thumbnailUrl: getS3BucketThumbnailURL(image.id),
    }));

    formattedData.push({
      id: set.id,
      prompt: set.prompt,
      createdAt: set.createdAt,
      totalImages: set._count.images,
      images: formattedImages,
      user: set.user,
    });
  }

  return {
    sets: formattedData,
    totalCount,
    currentPage: page,
    totalPages,
    hasNextPage,
    hasPrevPage,
  };
};

export type GetUserSetsAPIResponse = Awaited<ReturnType<typeof getUserSets>>;
