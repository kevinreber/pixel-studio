import type Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma.server";
import { Logger } from "~/utils/logger.server";
import { invalidateCache } from "~/utils/cache.server";
import {
  trackPayment,
  AnalyticsEvents,
} from "~/services/analytics.server";

const CHECKOUT_SESSION_COMPLETED = "checkout.session.completed";

// Stripe considers a session fulfillable in either of these states. "unpaid"
// means the payment is still pending and must not grant credits.
const FULFILLABLE_PAYMENT_STATUSES = ["paid", "no_payment_required"];

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

    switch (type) {
      case CHECKOUT_SESSION_COMPLETED: {
        const session = data.object as Stripe.Checkout.Session;
        return handleCheckoutSession(session, id);
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

const handleCheckoutSession = async (
  session: Stripe.Checkout.Session,
  stripeEventId: string
) => {
  Logger.info({
    message: "[webhook.server]: Processing checkout session",
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

  if (!FULFILLABLE_PAYMENT_STATUSES.includes(session.payment_status)) {
    Logger.warn({
      message:
        "[webhook.server]: Skipping checkout session that is not yet paid",
      metadata: {
        sessionId: session.id,
        paymentStatus: session.payment_status,
      },
    });
    return { status: "not_paid", paymentStatus: session.payment_status };
  }

  return await updateUserCredits(
    session.metadata.userId,
    session.id,
    stripeEventId
  );
};

const updateUserCredits = async (
  userId: string,
  stripeSessionId: string,
  stripeEventId: string
) => {
  const creditsToAdd = 100;

  Logger.info({
    message: "[webhook.server]: Updating user credits",
    metadata: {
      userId,
      creditsToAdd,
      stripeEventId,
    },
  });

  let userData;

  try {
    // Grant and record in one transaction. The ledger row carries the Stripe
    // event id under a unique constraint, so a replayed delivery fails here and
    // rolls the increment back rather than granting credits a second time.
    userData = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          credits: {
            increment: creditsToAdd,
          },
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          type: "purchase",
          amount: creditsToAdd,
          balanceAfter: updated.credits,
          description: `Purchased ${creditsToAdd} credits via Stripe`,
          metadata: {
            previousBalance: updated.credits - creditsToAdd,
            newBalance: updated.credits,
          },
          stripeSessionId,
          stripeEventId,
        },
      });

      return updated;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Already applied by an earlier delivery of this same event. Report
      // success so Stripe stops retrying.
      Logger.info({
        message:
          "[webhook.server]: Duplicate Stripe event ignored, credits already granted",
        metadata: { userId, stripeEventId, stripeSessionId },
      });
      return { status: "duplicate_ignored", stripeEventId };
    }
    throw error;
  }

  const cacheKey = `user-login:${userId}`;
  await invalidateCache(cacheKey);

  // Track payment completed and credits purchased
  trackPayment(userId, AnalyticsEvents.PAYMENT_COMPLETED, {
    credits: creditsToAdd,
    stripeSessionId,
  });

  trackPayment(userId, AnalyticsEvents.CREDITS_PURCHASED, {
    credits: creditsToAdd,
    stripeSessionId,
  });

  Logger.info({
    message: "[webhook.server]: Successfully updated user credits",
    metadata: {
      userId: userData.id,
      newCreditBalance: userData.credits,
    },
  });

  return userData;
};
