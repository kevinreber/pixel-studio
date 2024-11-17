import {
  redirect,
  type LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { authenticator } from "~/services/auth.server";
import { stripeCheckout } from "~/services/stripe.server";
import { loader as UserLoaderData } from "../root";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = (await authenticator.isAuthenticated(request, {
    failureRedirect: "/",
  })) as { id: string };

  const url = await stripeCheckout({
    userId: user.id,
  });

  return redirect(url);
};

export const meta: MetaFunction<
  typeof loader,
  { root: typeof UserLoaderData }
> = ({ data, params, matches }) => {
  // Incase our Profile loader ever fails, we can get logged in user data from root
  const userMatch = matches.find((match) => match.id === "root");
  const username = userMatch?.data.data?.username || userMatch?.data.data?.name;

  return [{ title: `Checkout | ${username}` }];
};
