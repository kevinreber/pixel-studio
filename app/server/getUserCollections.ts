import { prisma } from "~/services/prisma.server";

export const getUserCollections = async (userId: string) => {
  // Use _count for images instead of fetching all image IDs
  // Also remove separate count query - use collections.length since we're not paginating
  const collections = await prisma.collection.findMany({
    where: {
      userId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      title: true,
      description: true,
      user: {
        select: {
          id: true,
          username: true,
        },
      },
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { images: true },
      },
    },
  });

  // Transform _count.images to imageCount for backward compatibility
  const collectionsWithCount = collections.map((collection) => ({
    ...collection,
    imageCount: collection._count.images,
  }));

  return { collections: collectionsWithCount, count: collections.length };
};

export type GetUserCollectionsResponse = Awaited<
  ReturnType<typeof getUserCollections>
>;
