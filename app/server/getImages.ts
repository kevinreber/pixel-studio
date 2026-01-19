import { z } from "zod";
import { prisma } from "services/prisma.server";
import {
  getS3BucketBlurURL,
  getS3BucketThumbnailURL,
  getS3BucketURL,
  getS3VideoURL,
  getS3VideoThumbnailURL,
} from "utils/s3Utils";

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

export const VideosSearchResultSchema = z.object({
  id: z.string(),
  title: z.string().nullable().optional(),
  prompt: z.string(),
  model: z.string().nullable().optional(),
  userId: z.string(),
  duration: z.number().nullable().optional(),
  aspectRatio: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  createdAt: z.date(),
});

export const VideosSearchResultsSchema = z.array(VideosSearchResultSchema);

type Image = {
  id: string;
  title?: string | undefined | null;
  prompt: string;
  model: string;
  stylePreset?: string | null;
  userId: string;
  createdAt: Date;
};

type Video = {
  id: string;
  title?: string | undefined | null;
  prompt: string;
  model?: string | null;
  userId: string;
  duration?: number | null;
  aspectRatio?: string | null;
  status?: string | null;
  createdAt: Date;
};

export type ImageTagType = Image & {
  type: "image";
  url: string;
  thumbnailURL: string;
  blurURL: string;
};

export type VideoTagType = Video & {
  type: "video";
  url: string;
  thumbnailURL: string;
};

export type MediaItem = ImageTagType | VideoTagType;

export interface GetImagesResponse {
  status: "idle" | "error";
  images: ImageTagType[];
  videos: VideoTagType[];
  items: MediaItem[];
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

export type MediaTypeFilter = "all" | "images" | "videos";

export interface GetImagesOptions {
  searchTerm?: string;
  page?: number;
  pageSize?: number;
  mediaType?: MediaTypeFilter;
  model?: string;
}

export const getImages = async (
  searchTermOrOptions: string | GetImagesOptions = "",
  page = DEFAULT_CURRENT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<GetImagesResponse> => {
  // Support both old signature and new options object
  const options: GetImagesOptions =
    typeof searchTermOrOptions === "string"
      ? { searchTerm: searchTermOrOptions, page, pageSize }
      : searchTermOrOptions;

  const searchTerm = options.searchTerm ?? "";
  const currentPage = options.page ?? DEFAULT_CURRENT_PAGE;
  const currentPageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const mediaType = options.mediaType ?? "all";
  const modelFilter = options.model ?? "";

  const like = `%${searchTerm}%`;
  const modelLike = modelFilter ? `%${modelFilter}%` : "%";

  try {
    const shouldFetchImages = mediaType === "all" || mediaType === "images";
    const shouldFetchVideos = mediaType === "all" || mediaType === "videos";

    // Get total counts for images and videos
    const [imageCountResult, videoCountResult] = await Promise.all([
      shouldFetchImages
        ? prisma.$queryRaw`
            SELECT COUNT(*)::int as count
            FROM "Image" i
            WHERE i.private = false
              AND (i.title LIKE ${like} OR i.prompt LIKE ${like} OR i."stylePreset" LIKE ${like})
              AND i.model LIKE ${modelLike}
          `
        : Promise.resolve([{ count: 0 }]),
      shouldFetchVideos
        ? prisma.$queryRaw`
            SELECT COUNT(*)::int as count
            FROM "Video" v
            WHERE v.private = false AND v.status = 'complete'
              AND (v.title LIKE ${like} OR v.prompt LIKE ${like})
              AND (v.model LIKE ${modelLike} OR v.model IS NULL)
          `
        : Promise.resolve([{ count: 0 }]),
    ]);

    const imageCount =
      (imageCountResult as { count: number }[])[0]?.count || 0;
    const videoCount =
      (videoCountResult as { count: number }[])[0]?.count || 0;
    const totalCount = imageCount + videoCount;
    const totalPages = Math.ceil(totalCount / currentPageSize);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    // Get images and videos
    const [rawImages, rawVideos] = await Promise.all([
      shouldFetchImages
        ? prisma.$queryRaw`
            SELECT i.id, i.title, i.prompt, i.model, i."stylePreset", i."userId", i."createdAt"
            FROM "Image" i
            WHERE i.private = false
              AND (i.title LIKE ${like} OR i.prompt LIKE ${like} OR i."stylePreset" LIKE ${like})
              AND i.model LIKE ${modelLike}
            ORDER BY i."createdAt" DESC
          `
        : Promise.resolve([]),
      shouldFetchVideos
        ? prisma.$queryRaw`
            SELECT v.id, v.title, v.prompt, v.model, v."userId", v.duration, v."aspectRatio", v.status, v."createdAt"
            FROM "Video" v
            WHERE v.private = false AND v.status = 'complete'
              AND (v.title LIKE ${like} OR v.prompt LIKE ${like})
              AND (v.model LIKE ${modelLike} OR v.model IS NULL)
            ORDER BY v."createdAt" DESC
          `
        : Promise.resolve([]),
    ]);

    const imagesResult = ImagesSearchResultsSchema.safeParse(rawImages);
    const videosResult = VideosSearchResultsSchema.safeParse(rawVideos);

    if (!imagesResult.success) {
      return {
        status: "error",
        error: imagesResult.error.message,
        images: [],
        videos: [],
        items: [],
        pagination: {
          totalCount: 0,
          currentPage,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
          pageSize: currentPageSize,
        },
      } as const;
    }

    // Format images with URLs
    const formattedImages: ImageTagType[] = imagesResult.data.map((image) => ({
      ...image,
      type: "image" as const,
      url: getS3BucketURL(image.id),
      thumbnailURL: getS3BucketThumbnailURL(image.id),
      blurURL: getS3BucketBlurURL(image.id),
    }));

    // Format videos with URLs
    const formattedVideos: VideoTagType[] = videosResult.success
      ? videosResult.data.map((video) => ({
          ...video,
          type: "video" as const,
          url: getS3VideoURL(video.id),
          thumbnailURL: getS3VideoThumbnailURL(video.id),
        }))
      : [];

    // Combine and sort by createdAt descending
    const allItems: MediaItem[] = [...formattedImages, ...formattedVideos].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply pagination to combined results
    const skip = (currentPage - 1) * currentPageSize;
    const paginatedItems = allItems.slice(skip, skip + currentPageSize);

    // Separate paginated items back into images and videos for backwards compatibility
    const paginatedImages = paginatedItems.filter(
      (item): item is ImageTagType => item.type === "image"
    );
    const paginatedVideos = paginatedItems.filter(
      (item): item is VideoTagType => item.type === "video"
    );

    return {
      status: "idle",
      images: paginatedImages,
      videos: paginatedVideos,
      items: paginatedItems,
      pagination: {
        totalCount,
        currentPage,
        totalPages,
        hasNextPage,
        hasPrevPage,
        pageSize: currentPageSize,
      },
    } as const;
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error occurred",
      images: [],
      videos: [],
      items: [],
      pagination: {
        totalCount: 0,
        currentPage,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        pageSize: currentPageSize,
      },
    } as const;
  }
};
