import type Stripe from "stripe";
import { prisma } from "./prisma.server";
import { Logger } from "~/utils/logger.server";

const CHECKOUT_SESSION_COMPLETED = "checkout.session.completed";

export const handleStripeEvent = async (
  type: string,
  data: Stripe.Event.Data,
  id: string
) => {
  try {
    Logger.info({
      message: "Processing Stripe webhook event",
      metadata: { type, id }
    });

    const isTestEvent = id === "evt_00000000000000";
    if (isTestEvent) {
      Logger.info({ message: "Skipping test event" });
      return;
    }

    switch (type) {
      case CHECKOUT_SESSION_COMPLETED: {
        const checkoutSessionCompleted = data.object as {
          id: string;
          amount: number;
          metadata: {
            userId: string;
          };
        };

        const creditsToAdd = 100;
        Logger.info({
          message: "Processing completed checkout session",
          metadata: {
            sessionId: checkoutSessionCompleted.id,
            userId: checkoutSessionCompleted.metadata.userId,
            creditsToAdd
          }
        });

        const userData = await prisma.user.update({
          where: {
            id: checkoutSessionCompleted.metadata.userId,
          },
          data: {
            credits: {
              increment: creditsToAdd,
            },
          },
        });

        Logger.info({
          message: "Successfully updated user credits",
          metadata: {
            userId: userData.id,
            newCreditBalance: userData.credits
          }
        });

        return userData;
      }

      default:
        Logger.warn({
          message: "Unhandled webhook event type",
          metadata: { type }
        });
    }

    return;
  } catch (error) {
    Logger.error({
      message: "Error processing Stripe webhook",
      error: error instanceof Error ? error : new Error(String(error)),
      metadata: { type, id }
    });
  }
};
