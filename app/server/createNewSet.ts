import { prisma } from "~/services/prisma.server";

/**
 * @description
 * This function creates a new set in our DB
 */
export const createNewSet = async ({
  prompt,
  userId,
}: {
  prompt: string;
  userId: string;
}) => {
  if (!userId) {
    throw new Error("User ID is required");
  }
  if (!prompt) {
    throw new Error("Prompt is required");
  }

  const set = await prisma.set.create({
    data: {
      prompt,
      userId,
    },
  });

  // Return new set created
  return set;
};
