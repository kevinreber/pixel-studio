import { prisma } from "~/services/prisma.server";
import { invalidateCache } from "~/utils/cache.server";
import { invariantResponse } from "~/utils/invariantResponse";
import { Logger } from "~/utils/logger.server";

/**
 * @description
 * Checks if a user has enough credits without deducting.
 * Returns the user's current credit balance.
 * Throws an error if user doesn't have enough credits.
 */
export const checkUserCredits = async (
  userId: string,
  requiredCredits: number
): Promise<number> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.credits < requiredCredits) {
    throw new Error(
      `Not enough credits. You have ${user.credits} credits but need ${requiredCredits}.`
    );
  }

  return user.credits;
};

/**
 *
 * @description
 * This function updates a user's number of credits.
 * If a user has 0 credits available, an error is thrown
 */
export const updateUserCredits = async (
  userId: string,
  numberOfCreditsToDecrement = 1
) => {
  Logger.info({
    message: `Updating user credits by ${numberOfCreditsToDecrement} for ${userId}`,
    metadata: {
      userId,
      numberOfCreditsToDecrement,
    },
  });

  const userData = await prisma.user.updateMany({
    where: {
      id: userId,
      credits: {
        gte: numberOfCreditsToDecrement,
      },
    },
    data: {
      credits: {
        decrement: numberOfCreditsToDecrement,
      },
    },
  });

  Logger.info({
    message: `Number of rows updated: ${userData.count}`,
    metadata: {
      userId,
      userData,
      numberOfCreditsToDecrement,
    },
  });
  Logger.info({
    message: `Successfully updated user credits by ${numberOfCreditsToDecrement} for: ${userId}`,
    metadata: {
      userId,
      numberOfCreditsToDecrement,
    },
  });
  const cacheKey = `user-login:${userId}`;
  await invalidateCache(cacheKey);

  invariantResponse(userData.count > 0, "Not enough credits");
};
