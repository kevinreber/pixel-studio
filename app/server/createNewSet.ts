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
  console.log("Creating new set in DB...");
  if (!userId) {
    throw new Error("User ID is required");
  }
  if (!prompt) {
    throw new Error("Prompt is required");
  }

  try {
    const set = await prisma.set.create({
      data: {
        prompt,
        userId,
      },
    });
    console.log(`Successfully created new set in DB: ${set.id}`);

    // Return new set created
    return set;
  } catch (error) {
    console.error(`Error creating new set in DB: ${error}`);
    throw error;
  }
};
