import { ActionFunction } from "@remix-run/node";
import { authenticator, getGoogleSessionAuth } from "~/services/auth.server";
import { trackUserLogout } from "~/services/analytics.server";

export const action: ActionFunction = async ({ request }) => {
  // Track logout before clearing session
  const sessionAuth = await getGoogleSessionAuth(request);
  if (sessionAuth?.id) {
    trackUserLogout(sessionAuth.id);
  }

  await authenticator.logout(request, { redirectTo: "/" });
};
