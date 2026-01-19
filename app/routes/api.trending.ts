/**
 * API Routes for Trending Content
 *
 * GET /api/trending - Get trending images, videos, and creators
 */

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import {
  getTrendingContent,
  getTrendingImages,
  getTrendingVideos,
  getTrendingCreators,
  type TrendingPeriod,
  TRENDING_PERIODS,
} from "~/services/trending.server";
import { getCachedDataWithRevalidate } from "~/utils/cache.server";
import { Logger } from "~/utils/logger.server";

// Cache trending data for 5 minutes
const CACHE_TTL_5_MINUTES = 300;

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
  const periodParam = url.searchParams.get("period") || "48h";
  const typeParam = url.searchParams.get("type") || "all";
  const limitParam = parseInt(url.searchParams.get("limit") || "20", 10);

  // Validate period
  const period: TrendingPeriod = Object.keys(TRENDING_PERIODS).includes(periodParam)
    ? (periodParam as TrendingPeriod)
    : "48h";

  const limit = Math.min(Math.max(limitParam, 1), 50); // Clamp between 1-50

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
