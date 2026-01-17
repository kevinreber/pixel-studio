import { z } from "zod";
import { prisma } from "services/prisma.server";
import { getS3BucketBlurURL, getS3BucketThumbnailURL, getS3BucketURL } from "utils/s3Utils";

const DEFAULT_CURRENT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;

export const ImagesSearchResultSchema = z.object({
  id: z.string(),
  title: z.string().nullable().optional(),
  prompt: z.string(),
  model: z.string(),
  stylePreset: z.string().nullable().optional(),
  userId: z.string(),
  createdAt: z.date(),
});

export const ImagesSearchResultsSchema = z.array(ImagesSearchResultSchema);

type Image = {
  id: string;
  title?: string | undefined | null;
  prompt: string;
  model: string;
  stylePreset?: string | null;
  userId: string;
  createdAt: Date;
};

export type ImageTagType = Image & { url: string; thumbnailURL: string; blurURL: string };

export interface GetImagesResponse {
  status: "idle" | "error";
  images: ImageTagType[];
  error?: string;
  pagination: {
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    pageSize: number;
  };
}

export type GETImagesAPIResponse = ReturnType<typeof getImages>;

export const getImages = async (
  searchTerm = "",
  page = DEFAULT_CURRENT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<GetImagesResponse> => {
  const like = `%${searchTerm ?? ""}%`;

  try {
    // Get total count for pagination
    const totalCountResult = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM "Image" i
      WHERE i.private = false AND (i.title LIKE ${like} OR i.prompt LIKE ${like} OR i."stylePreset" LIKE ${like})
    `;

    const totalCount = (totalCountResult as { count: number }[])[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // NOTE: Postgres automatically converts camelCase to all lowercase. We need to add "" around the column names to prevent this from breaking our query.
    const rawImages = await prisma.$queryRaw`
    SELECT i.id, i.title, i.prompt, i.model, i."stylePreset", i."userId", i."createdAt" 
    FROM "Image" i
    WHERE i.private = false AND (i.title LIKE ${like} OR i.prompt LIKE ${like} OR i."stylePreset" LIKE ${like})
    ORDER BY i."createdAt" DESC
    LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize};
    `;

    const result = ImagesSearchResultsSchema.safeParse(rawImages);

    if (!result.success) {
      return {
        status: "error",
        error: result.error.message,
        images: [],
        pagination: {
          totalCount: 0,
          currentPage: page,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
          pageSize,
        },
      } as const;
    }

    // Append Images source URL since we cannot use `env` variables in our UI
    const formattedImages = result.data.map((image) => ({
      ...image,
      url: getS3BucketURL(image.id),
      thumbnailURL: getS3BucketThumbnailURL(image.id),
      blurURL: getS3BucketBlurURL(image.id),
    }));

    return {
      status: "idle",
      images: formattedImages,
      pagination: {
        totalCount,
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPrevPage,
        pageSize,
      },
    } as const;
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error occurred",
      images: [],
      pagination: {
        totalCount: 0,
        currentPage: page,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        pageSize,
      },
    } as const;
  }
};
