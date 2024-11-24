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
      message: "[webhook.server]: Processing Stripe webhook event",
      metadata: { type, id, data: JSON.stringify(data) },
    });

    const isTestEvent = id === "evt_00000000000000";
    if (isTestEvent) {
      Logger.info({ message: "[webhook.server]: Skipping test event" });
      return;
    }

    switch (type) {
      case CHECKOUT_SESSION_COMPLETED: {
        const session = data.object as Stripe.Checkout.Session;

        Logger.info({
          message: "[webhook.server]: Checkout Session Data",
          metadata: {
            sessionId: session.id,
            metadata: session.metadata,
            customerId: session.customer,
            paymentStatus: session.payment_status,
          },
        });

        if (!session.metadata?.userId) {
          throw new Error("No userId found in session metadata");
        }

        const creditsToAdd = 100;
        Logger.info({
          message: "[webhook.server]: Updating user credits",
          metadata: {
            userId: session.metadata.userId,
            creditsToAdd,
          },
        });

        const userData = await prisma.user.update({
          where: {
            id: session.metadata.userId,
          },
          data: {
            credits: {
              increment: creditsToAdd,
            },
          },
        });

        Logger.info({
          message: "[webhook.server]: Successfully updated user credits",
          metadata: {
            userId: userData.id,
            newCreditBalance: userData.credits,
          },
        });

        return userData;
      }

      default:
        Logger.warn({
          message: "[webhook.server]: Unhandled webhook event type",
          metadata: { type },
        });
        return null;
    }
  } catch (error) {
    Logger.error({
      message: "[webhook.server]: Error processing Stripe webhook",
      error: error instanceof Error ? error : new Error(String(error)),
      metadata: { type, id },
    });
    throw error;
  }
};
