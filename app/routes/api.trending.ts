/**
 * API Routes for Trending Content
 *
 * GET /api/trending - Get trending images, videos, and creators
 */

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { requireUserLogin } from "~/services";
import {
  getTrendingContent,
  getTrendingImages,
  getTrendingVideos,
  getTrendingCreators,
  type TrendingPeriod,
} from "~/services/trending.server";
import { getCachedDataWithRevalidate } from "~/utils/cache.server";
import { Logger } from "~/utils/logger.server";

// Cache trending data for 5 minutes
const CACHE_TTL_5_MINUTES = 300;

// Zod schema for query parameter validation
const TrendingQuerySchema = z.object({
  period: z.enum(["24h", "48h", "7d", "30d"]).default("48h"),
  type: z.enum(["all", "images", "videos", "creators"]).default("all"),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 20;
      const num = parseInt(val, 10);
      // Return default if parsing fails (NaN)
      if (Number.isNaN(num)) return 20;
      // Clamp between 1-50
      return Math.min(Math.max(num, 1), 50);
    }),
});

/**
 * GET /api/trending - Get trending content
 * Query params:
 *   - period: "24h" | "48h" | "7d" | "30d" (default: "48h")
 *   - type: "all" | "images" | "videos" | "creators" (default: "all")
 *   - limit: number (default: 20 for images, 10 for videos/creators)
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUserLogin(request);

  const url = new URL(request.url);

  // Parse and validate query parameters with Zod
  const parseResult = TrendingQuerySchema.safeParse({
    period: url.searchParams.get("period") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });

  // Use defaults if validation fails (graceful degradation)
  const { period, type: typeParam, limit } = parseResult.success
    ? parseResult.data
    : { period: "48h" as TrendingPeriod, type: "all" as const, limit: 20 };

  try {
    const cacheKey = `trending:${period}:${typeParam}:${limit}`;

    const getData = async () => {
      switch (typeParam) {
        case "images":
          return {
            images: await getTrendingImages(period, limit),
            videos: [],
            creators: [],
            period,
            generatedAt: new Date(),
          };

        case "videos":
          return {
            images: [],
            videos: await getTrendingVideos(period, limit),
            creators: [],
            period,
            generatedAt: new Date(),
          };

        case "creators":
          return {
            images: [],
            videos: [],
            creators: await getTrendingCreators(period, limit),
            period,
            generatedAt: new Date(),
          };

        default:
          return getTrendingContent(period);
      }
    };

    const data = await getCachedDataWithRevalidate(
      cacheKey,
      getData,
      CACHE_TTL_5_MINUTES
    );

    return json({
      success: true,
      data,
    });
  } catch (error) {
    Logger.error({
      message: "Error fetching trending content",
      error: error instanceof Error ? error : new Error(String(error)),
      metadata: { userId: user.id, period, type: typeParam },
    });

    return json(
      { success: false, error: "Failed to fetch trending content" },
      { status: 500 }
    );
  }
};
