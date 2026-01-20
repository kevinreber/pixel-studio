/**
 * API endpoint to fetch the current user's images
 * Used by the image picker in video generation
 */

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { prisma } from "~/services/prisma.server";
import { getS3BucketThumbnailURL, getS3BucketURL } from "~/utils/s3Utils";

const DEFAULT_PAGE_SIZE = 24;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUserLogin(request);

  const searchParams = new URL(request.url).searchParams;
  const page = Math.max(Number(searchParams.get("page") || 1), 1);
  const pageSize = Math.min(Number(searchParams.get("pageSize") || DEFAULT_PAGE_SIZE), 50);
  const search = searchParams.get("search") || "";

  try {
    // Build where clause
    const where = {
      userId: user.id,
      ...(search && {
        OR: [
          { prompt: { contains: search, mode: "insensitive" as const } },
          { title: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    // Get total count
    const totalCount = await prisma.image.count({ where });

    // Get images (including private ones since it's the user's own images)
    const images = await prisma.image.findMany({
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        prompt: true,
        model: true,
        createdAt: true,
        private: true,
      },
    });

    // Add URLs
    const formattedImages = images.map((image) => ({
      ...image,
      url: getS3BucketURL(image.id),
      thumbnailURL: getS3BucketThumbnailURL(image.id),
    }));

    return json({
      images: formattedImages,
      pagination: {
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNextPage: page < Math.ceil(totalCount / pageSize),
        hasPrevPage: page > 1,
        pageSize,
      },
    });
  } catch (error) {
    console.error("Error fetching user images:", error);
    return json(
      { error: "Failed to fetch images", images: [], pagination: null },
      { status: 500 }
    );
  }
};
