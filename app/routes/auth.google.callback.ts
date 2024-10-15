import { MetaFunction, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";
// import { SocialsProvider } from "remix-auth-socials";

export const meta: MetaFunction = () => {
  return [{ title: "User Login" }];
};

export const loader = ({ request }: LoaderFunctionArgs) => {
  // return authenticator.authenticate(SocialsProvider.GOOGLE, request, {
  const url = new URL(request.url);
  const redirectToURL = url.searchParams.get("redirectTo") || "/explore";

  return authenticator.authenticate("google", request, {
    successRedirect: redirectToURL,
    failureRedirect: "/",
  });
};
