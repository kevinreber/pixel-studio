import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { AUTH_KEY, USER_ID_KEY } from "~/services/auth.server";
import { commitSession, getSessionCookie } from "~/services/session.server";
import { signOutOfSupabase } from "~/services/supabase.server";

export async function action({ request }: ActionFunctionArgs) {
  try {
    await signOutOfSupabase({ request, useBase: true });
    const cookieSession = await getSessionCookie(request);
    cookieSession.unset(USER_ID_KEY);
    cookieSession.unset(AUTH_KEY);

    return redirect("/login", {
      headers: {
        "Set-Cookie": await commitSession(cookieSession),
      },
    });
  } catch (error: unknown) {
    const headers =
      error && typeof error === "object" && "headers" in error
        ? (error.headers as Headers) ?? new Headers()
        : new Headers();

    return json(
      { error: error instanceof Error ? error.message : String(error) },
      { headers }
    );
  }
}
