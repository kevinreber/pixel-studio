import { prisma } from "~/services/prisma.server";

export const getUserCollections = async (userId: string) => {
  const [collections, count] = await Promise.all([
    prisma.collection.findMany({
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
        images: {
          select: {
            id: true,
          },
        },
      },
    }),
    prisma.collection.count({
      where: {
        userId,
      },
    }),
  ]);

  return { collections, count };
};

export type GetUserCollectionsResponse = Awaited<
  ReturnType<typeof getUserCollections>
>;
