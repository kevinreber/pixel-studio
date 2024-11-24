import Stripe from "stripe";
import { json } from "@remix-run/node";
import { Logger } from "~/utils/logger.server";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

export const stripeCheckout = async ({ userId }: { userId: string }) => {
  try {
    Logger.info({
      message: "[stripe.server]: Creating Stripe checkout session",
      metadata: { userId },
    });

    const session = await stripe.checkout.sessions.create({
      success_url: `${process.env.ORIGIN}/create`,
      cancel_url: `${process.env.ORIGIN}/create`,
      line_items: [{ price: process.env.STRIPE_CREDITS_PRICE_ID, quantity: 1 }],
      mode: "payment",
      metadata: {
        userId,
      },
      payment_method_types: ["card", "us_bank_account"],
      payment_intent_data: {
        metadata: {
          userId,
        },
      },
    });

    Logger.info({
      message: "[stripe.server]: Stripe checkout session created successfully",
      metadata: {
        userId,
        sessionId: session.id,
      },
    });

    return session.url!;
  } catch (error: unknown) {
    Logger.error({
      message: "[stripe.server]: Failed to create Stripe checkout session",
      error: error instanceof Error ? error : new Error(String(error)),
      metadata: { userId },
    });
    throw json(
      { errors: [{ message: "Failed to create checkout session" }] },
      400
    );
  }
};
