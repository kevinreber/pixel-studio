import {
  redirect,
  type LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { requireUserLogin } from "~/services/auth.server";
import { stripeCheckout } from "~/services/stripe.server";
import { loader as UserLoaderData } from "../root";
import { Logger } from "~/utils/logger.server";

export const meta: MetaFunction<
  typeof loader,
  { root: typeof UserLoaderData }
> = ({ data, params, matches }) => {
  // Incase our Profile loader ever fails, we can get logged in user data from root
  const userMatch = matches.find((match) => match.id === "root");
  const username = userMatch?.data.data?.username || userMatch?.data.data?.name;

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

  Logger.info({
    message: "[checkout.tsx]: Redirecting to Stripe checkout",
    metadata: { checkoutUrl: url },
  });

  return redirect(url);
};
