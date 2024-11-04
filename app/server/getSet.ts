import { prisma } from "~/services/prisma.server";

/**
 * @description
 * This function gets a set from our DB
 */
export const getSet = async ({ setId }: { setId: string }) => {
  if (!setId) {
    throw new Error("Set ID is required");
  }
  try {
    const set = await prisma.set.findUnique({
      where: {
        id: setId,
      },
      select: {
        images: true,
      },
    });

    if (!set) {
      throw new Error("Set not found");
    }
    return set;
  } catch (error) {
    console.error(error);
    return [];
  }
};
