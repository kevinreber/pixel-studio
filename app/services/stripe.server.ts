import Stripe from "stripe";
import { json } from "@remix-run/node";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

export const stripeCheckout = async ({ userId }: { userId: string }) => {
  try {
    const session = await stripe.checkout.sessions.create({
      success_url: `${process.env.ORIGIN}/create`!,
      cancel_url: `${process.env.ORIGIN}/create`!,
      line_items: [{ price: process.env.STRIPE_CREDITS_PRICE_ID, quantity: 1 }],
      mode: "payment",
      metadata: {
        userId,
      },
      payment_method_types: ["card", "us_bank_account"],
    });

    return session.url!;
  } catch (error: any) {
    console.error(error);
    throw json({ errors: [{ message: error.message }] }, 400);
  }
};
