import type { ActionFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { stripe } from "~/services/stripe.server";
import { handleStripeEvent } from "~/services/webhook.server";

export const meta: MetaFunction = () => {
  return [{ title: "Stripe Webhook" }];
};

// [credit @kiliman to get this webhook working](https://github.com/remix-run/remix/discussions/1978)
// To have this webhook working locally, in another server we must run `stripe listen --forward-to localhost:3000/webhook` (yarn run stripe:listen)
export const action: ActionFunction = async ({ request }) => {
  console.log("WEBHOOK REQUEST: ", request);
  const payload = await request.text();
  const sig = request.headers.get("stripe-signature")!;
  console.log("PAYLOAD: ", payload);
  console.log("SIG: ", sig);
  try {
    const { type, data, id } = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEB_HOOK_SECRET!
    );

    const userData = await handleStripeEvent(type, data, id);

    return { data: userData };
  } catch (error: any) {
    throw json({ errors: [{ message: error.message }] }, 400);
  }
};
