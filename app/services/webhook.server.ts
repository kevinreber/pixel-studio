import type Stripe from "stripe";
import { prisma } from "./prisma.server";

const CHECKOUT_SESSION_COMPLETED = "checkout.session.completed";

export const handleStripeEvent = async (
  type: string,
  data: Stripe.Event.Data,
  id: string
) => {
  try {
    console.log("HANDLING STRIPE EVENT.......");
    console.log("TYPE: ", type);
    const isTestEvent = id === "evt_00000000000000";

    if (isTestEvent) {
      return;
    }

    switch (type) {
      case CHECKOUT_SESSION_COMPLETED:
        const checkoutSessionCompleted = data.object as {
          id: string;
          amount: number;
          metadata: {
            userId: string;
          };
        };

        const creditsToAdd = 100;
        console.log("CHECKOUT SESSION COMPLETED: ", checkoutSessionCompleted);
        // Update users credits in DB after checkout
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
        console.log("DONE UPDATING USER DATA: ", userData);
        return userData;

      default:
        console.log(`Unhandled event type: ${type}`);
    }

    return;
  } catch (error) {
    console.error({ message: error });
  }
};
