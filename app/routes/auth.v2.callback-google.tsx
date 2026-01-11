import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  getSupabaseWithHeaders,
  getAuthState,
  signOutOfSupabase,
} from "~/services/supabase.server";
import { createNewUserWithSupabaseData } from "~/server/createNewUser";
import { commitSession, getSessionCookie } from "~/services/session.server";
import { AUTH_KEY, USER_ID_KEY } from "~/services/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("HITTING callback-google loader with URL:", request.url);
  const { supabase, headers } = getSupabaseWithHeaders({
    request,
    useBase: true,
  });

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    console.error("Auth error:", error, errorDescription);
    throw new Error(`Authentication error: ${errorDescription || error}`);
  }

  // If we have a code, try to exchange it
  if (code) {
    try {
      console.log("Exchanging code for session...");
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        throw new Error(`Session exchange error: ${exchangeError.message}`);
      }

      console.log("Session exchange successful, redirecting...");
      return redirect("/auth/v2/callback-google", {
        headers,
      });
    } catch (error: unknown) {
      console.error("Exchange error:", error);
      if (error instanceof Error) {
        throw new Error(`Error exchanging code for session: ${error.message}`);
      }
      throw new Error("Error exchanging code for session");
    }
  }

  console.log("No code, getting auth state....");
  // No code means we're either already authenticated or something went wrong
  const authState = await getAuthState({ request });
  console.log("Auth state:", authState);
  if (authState.user || authState.session) {
    console.log("User or session found, creating new user...");
    const user = authState.user || authState.session?.user;

    if (user) {
      console.log("User data:", JSON.stringify(user, null, 2));
      await createNewUserWithSupabaseData(
        user,
        user.app_metadata?.provider || "google"
      );
    }

    const cookieSession = await getSessionCookie(request);
    console.log("Cookie session:", cookieSession);
    const userId = user?.id;
    console.log("User ID:", userId);

    if (!userId) {
      throw new Error("No user ID found in session");
    }

    cookieSession.set(USER_ID_KEY, userId);
    cookieSession.set(AUTH_KEY, user);
    console.log("Setting user ID in cookie session...");

    return redirect("/explore", {
      headers: {
        ...headers,
        "Set-Cookie": await commitSession(cookieSession),
      },
    });
  }

  // Not authenticated and no code, redirect to login
  return redirect("/login", { headers });
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { headers } = await signOutOfSupabase({ request, useBase: true });
    return redirect("/login", { headers });
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
