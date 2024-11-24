import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { stripe } from "~/services/stripe.server";
import { handleStripeEvent } from "~/services/webhook.server";
import { Logger } from "~/utils/logger.server";

// [credit @kiliman to get this webhook working](https://github.com/remix-run/remix/discussions/1978)
// To have this webhook working locally, in another server we must run `stripe listen --forward-to localhost:3000/webhook` (yarn run stripe:listen)
export const action: ActionFunction = async ({ request }) => {
  console.log("Webhook endpoint hit!", new Date().toISOString());

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const payload = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return json({ error: "No signature" }, { status: 400 });
  }

  try {
    Logger.info({
      message: "[api.webhook.ts]: Processing webhook request",
      metadata: {
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        signature: sig,
      },
    });

    const event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEB_HOOK_SECRET!
    );

    const result = await handleStripeEvent(event.type, event.data, event.id);

    return json(
      { success: true, data: result },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type, stripe-signature",
        },
      }
    );
  } catch (error: unknown) {
    Logger.error({
      message: "[api.webhook.ts]: Webhook error",
      error: error instanceof Error ? error : new Error(String(error)),
    });

    return json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type, stripe-signature",
        },
      }
    );
  }
};
