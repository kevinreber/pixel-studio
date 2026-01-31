import Stripe from "stripe";
import { json } from "@remix-run/node";
import { Logger } from "~/utils/logger.server";

const isTestEnvironment = process.env.CI === "true" || process.env.NODE_ENV === "test";

// Create mock Stripe for test environments
const createMockStripe = () => ({
  checkout: {
    sessions: {
      create: async () => ({ id: "mock_session_id", url: "https://mock-checkout.stripe.com" }),
    },
  },
});

export const stripe = isTestEnvironment
  ? (createMockStripe() as unknown as Stripe)
  : new Stripe(process.env.STRIPE_SECRET_KEY!, {
      // Cast to any to allow for newer API versions that may not be in the types yet
      apiVersion: "2024-11-20.acacia" as Stripe.LatestApiVersion,
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
