import type { ActionFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { stripe } from "~/services/stripe.server";
import { handleStripeEvent } from "~/services/webhook.server";
import { Logger } from "~/utils/logger.server";

export const meta: MetaFunction = () => {
  return [{ title: "Stripe Webhook" }];
};

// [credit @kiliman to get this webhook working](https://github.com/remix-run/remix/discussions/1978)
// To have this webhook working locally, in another server we must run `stripe listen --forward-to localhost:3000/webhook` (yarn run stripe:listen)
export const action: ActionFunction = async ({ request }) => {
  console.log("Webhook endpoint hit!", new Date().toISOString());

  Logger.info({
    message: "[webhook.ts]: Received webhook request",
    metadata: {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      timestamp: new Date().toISOString(),
    },
  });

  // Only allow POST requests
  if (request.method !== "POST") {
    Logger.warn({
      message: "[webhook.ts]: Invalid method for webhook",
      metadata: { method: request.method },
    });
    return json({ error: "Method not allowed" }, 405);
  }

  const payload = await request.text();

  Logger.info({
    message: "[webhook.ts]: Payload",
    metadata: { payload },
  });

  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    Logger.warn({
      message: "[webhook.ts]: Missing Stripe signature",
    });
    return json({ error: "No signature" }, 400);
  }

  try {
    Logger.info({
      message: "[webhook.ts]: Constructing Stripe event",
      metadata: {
        signaturePresent: !!sig,
        payloadLength: payload.length,
        webhookSecretPresent: !!process.env.STRIPE_WEB_HOOK_SECRET,
      },
    });

    const event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEB_HOOK_SECRET!
    );

    Logger.info({
      message: "[webhook.ts]: Successfully constructed Stripe event ",
      metadata: {
        eventType: event.type,
        eventId: event.id,
      },
    });

    const result = await handleStripeEvent(event.type, event.data, event.id);

    return json({ success: true, data: result });
  } catch (error: unknown) {
    Logger.error({
      message: "[webhook.ts]: Webhook error",
      error: error instanceof Error ? error : new Error(String(error)),
      metadata: {
        payload: payload.substring(0, 100) + "...", // Log first 100 chars of payload
      },
    });

    return json(
      {
        errors: [
          { message: error instanceof Error ? error.message : "Unknown error" },
        ],
      },
      400
    );
  }
};
