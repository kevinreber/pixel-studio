import { prisma } from "~/services/prisma.server";

/**
 * @description
 * This function deletes a set from our DB
 */
export const deleteSet = async ({ setId }: { setId: string }) => {
  // TODO: Should we add a check to see if the user is the owner of the set?

  if (!setId) {
    throw new Error("Set ID is required");
  }

  const set = await prisma.set.delete({
    where: {
      id: setId,
    },
  });

  return set;
};
