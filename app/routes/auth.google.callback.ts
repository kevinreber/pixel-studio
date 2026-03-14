import { MetaFunction, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";
import {
  checkRateLimit,
  authLimiter,
  getRateLimitIdentifier,
  rateLimitResponse,
} from "~/services/rateLimit.server";
// import { SocialsProvider } from "remix-auth-socials";

export const meta: MetaFunction = () => {
  return [{ title: "User Login" }];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const rl = await checkRateLimit(
    authLimiter,
    getRateLimitIdentifier(request)
  );
  if (!rl.success) return rateLimitResponse(rl.reset);
  // return authenticator.authenticate(SocialsProvider.GOOGLE, request, {
  const url = new URL(request.url);
  const redirectToURL = url.searchParams.get("redirectTo") || "/explore";

  return authenticator.authenticate("google", request, {
    successRedirect: redirectToURL,
    failureRedirect: "/",
  });
};
