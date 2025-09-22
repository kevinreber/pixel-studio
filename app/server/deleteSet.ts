import { prisma } from "~/services/prisma.server";
import { cacheDelete } from "~/utils/cache.server";

/**
 * @description
 * This function deletes a set from our DB
 */
export const deleteSet = async ({ setId }: { setId: string }) => {
  console.log(`Deleting set in DB: ${setId}`);
  // TODO: Should we add a check to see if the user is the owner of the set?

  if (!setId) {
    throw new Error("Set ID is required");
  }
  try {
    const set = await prisma.set.delete({
      where: {
        id: setId,
      },
    });
    console.log(`Successfully deleted set in DB: ${setId}`);
    // Clear cache for the set
    // undefined is for `prompt` and `model`
    await cacheDelete(`sets:user:${set.userId}:undefined:undefined`);

    return set;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
