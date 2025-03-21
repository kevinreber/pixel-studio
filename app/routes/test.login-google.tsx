import { json, redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  getSupabaseWithHeaders,
  getAuthState,
} from "~/services/supabase.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // Check if we're already authenticated
  const { user, session, headers } = await getAuthState({ request });

  // Only redirect if we have both user and session
  if (user && session) {
    return redirect("/test/callback-google", { headers });
  }

  return json(null, { headers });
}

export async function action({ request }: ActionFunctionArgs) {
  console.log("action Signing in with Google");
  const origin = new URL(request.url).origin;
  console.log("Current origin:", origin);

  const { supabase, headers } = getSupabaseWithHeaders({
    request,
    useBase: true,
  });

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/test/callback-google`,
        skipBrowserRedirect: false,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
        // pkce: true,
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

export default function LoginGoogle() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Sign in</h1>
          <p className="mt-2 text-gray-600">to continue to the application</p>
        </div>

        <Form method="post" className="mt-8 space-y-6">
          <button
            type="submit"
            className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Sign in with Google
          </button>
        </Form>
      </div>
    </div>
  );
}
