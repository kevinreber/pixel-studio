import {
  redirect,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { requireUserLogin } from "~/services/auth.server";
import { stripeCheckout } from "~/services/stripe.server";
import { loader as UserLoaderData } from "../root";
import { Logger } from "~/utils/logger.server";
import {
  trackPayment,
  AnalyticsEvents,
} from "~/services/analytics.server";

export const meta: MetaFunction<
  typeof loader,
  { root: typeof UserLoaderData }
> = ({ matches }) => {
  const userMatch = matches.find((match) => match.id === "root");
  const username =
    userMatch?.data?.userData?.username ||
    userMatch?.data?.userData?.name ||
    "Checkout";

  return [{ title: `Checkout | ${username}` }];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUserLogin(request);

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
};
