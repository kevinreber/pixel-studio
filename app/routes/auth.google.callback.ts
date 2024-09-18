import { MetaFunction, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";
// import { SocialsProvider } from "remix-auth-socials";

export const meta: MetaFunction = () => {
  return [{ title: "User Login" }];
};

export const loader = ({ request }: LoaderFunctionArgs) => {
  // return authenticator.authenticate(SocialsProvider.GOOGLE, request, {
    return authenticator.authenticate('google', request, {
    successRedirect: "/create",
    failureRedirect: "/",
  });
};
