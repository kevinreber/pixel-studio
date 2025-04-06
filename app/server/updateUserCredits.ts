import { prisma } from "~/services/prisma.server";
import { invalidateCache } from "~/utils/cache.server";
import { invariantResponse } from "~/utils/invariantResponse";
import { Logger } from "~/utils/logger.server";

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
