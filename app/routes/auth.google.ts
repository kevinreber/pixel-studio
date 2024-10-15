import { authenticator, USER_ID_KEY } from "~/services/auth.server";
// import { SocialsProvider } from "remix-auth-socials";
import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { commitSession, getSessionCookie } from "~/services";
import { UserGoogleData } from "~/types";

export const action = async ({ request }: ActionFunctionArgs) => {
  // initiating authentication using Google Strategy
  // on success --> redirect to dashboard
  // on failure --> back to homepage/login
  // return authenticator.authenticate(SocialsProvider.GOOGLE, request, {

  // return authenticator.authenticate("google", request, {
  const user = (await authenticator.authenticate("google", request, {
    // successRedirect: "/explore",
    failureRedirect: "/",
  })) as UserGoogleData;

  const cookieSession = await getSessionCookie(request);

  // Store user data in session
  cookieSession.set(USER_ID_KEY, user.id);

  return redirect("/explore", {
    headers: {
      "Set-Cookie": await commitSession(cookieSession),
    },
  });
};
