import { prisma } from "~/services/prisma.server";
import { invariantResponse } from "~/utils/invariantResponse";

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
  console.log(`updating user credits for: ${userId}`);

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

  invariantResponse(userData.count > 0, "Not enough credits");
};
