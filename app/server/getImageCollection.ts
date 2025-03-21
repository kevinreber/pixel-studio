import { prisma } from "~/services/prisma.server";

export const getImageCollection = async (imageId: string, user?: any) => {
  if (!user || !user.id) {
    return [];
  }

  const collection = await prisma.collection.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      title: true,
      _count: {
        select: {
          images: true,
        },
      },
      images: {
        where: {
          imageId: imageId,
        },
        select: {
          id: true,
        },
      },
    },
  });

  return collection;
};

export type GetImageCollectionResponse = Awaited<
  ReturnType<typeof getImageCollection>
>;
