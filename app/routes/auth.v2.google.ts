import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { getSupabaseWithHeaders } from "~/services/supabase.server";

export async function action({ request }: ActionFunctionArgs) {
  console.log("Signing in with Supabase with Google SSO");

  const { supabase, headers } = getSupabaseWithHeaders({
    request,
    useBase: true,
  });

  try {
    const siteUrl = process.env.ORIGIN?.trim() || "http://localhost:5173";
    const redirectUrl = new URL("/auth/v2/callback-google", siteUrl).toString();

    console.log("Site URL:", siteUrl);
    console.log("Using redirect URL:", redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: false,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error("Supabase auth error:", error);
      return json(
        { error: error.message },
        {
          status: 400,
          headers,
        }
      );
    }

    if (!data.url) {
      console.error("No redirect URL received from Supabase");
      return json(
        { error: "Authentication failed" },
        {
          status: 400,
          headers,
        }
      );
    }

    console.log("Redirecting to:", data.url);
    return redirect(data.url, { headers });
  } catch (error) {
    console.error("Unexpected error during auth:", error);
    return json(
      { error: "Unexpected error during authentication" },
      {
        status: 500,
        headers,
      }
    );
  }
}
