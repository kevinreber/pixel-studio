import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { requireUserLogin } from "~/services/auth.server";
import { stripeCheckout } from "~/services/stripe.server";
import { Logger } from "~/utils/logger.server";
import {
  trackPayment,
  AnalyticsEvents,
} from "~/services/analytics.server";
import {
  checkRateLimit,
  financialLimiter,
  getRateLimitIdentifier,
  rateLimitResponse,
} from "~/services/rateLimit.server";

/**
 * Creating a Stripe Checkout session is a side effect, so it must never run on
 * a GET. It used to live in this route's loader, which `<Link prefetch>` and
 * any crawler would trigger on hover — minting live sessions nobody asked for
 * and inflating `checkout_started`. Those sessions then expired unpaid.
 *
 * GET now bounces to the pricing section, so stray navigations and prefetches
 * are inert. The purchase itself goes through the action below.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserLogin(request);
  return redirect("/#lp-pricing");
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);

  const rl = await checkRateLimit(
    financialLimiter,
    getRateLimitIdentifier(request, user.id)
  );
  if (!rl.success) return rateLimitResponse(rl.reset);

  Logger.info({
    message: "[checkout.tsx]: Starting checkout process",
    metadata: { userId: user.id },
  });

  const url = await stripeCheckout({
    userId: user.id,
  });

  // Track checkout started
  trackPayment(user.id, AnalyticsEvents.CHECKOUT_STARTED, {
    credits: 100, // Default credit package
  });

  Logger.info({
    message: "[checkout.tsx]: Redirecting to Stripe checkout",
    metadata: { checkoutUrl: url },
  });

  return redirect(url);
}
