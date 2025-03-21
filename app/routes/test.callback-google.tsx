import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData } from "@remix-run/react";
import { PageContainer } from "~/components";
import {
  getSupabaseWithHeaders,
  getAuthState,
} from "~/services/supabase.server";
import type { AuthState } from "~/services/supabase.server";

type LoaderData = AuthState & {
  code: string | null;
  refreshed: boolean;
};

type ActionData = {
  message?: string;
  error?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = getSupabaseWithHeaders({
    request,
    useBase: true,
  });

  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // If we have a code, try to exchange it
  if (code) {
    try {
      // Exchange the code for session
      await supabase.auth.exchangeCodeForSession(code);

      // After exchange, redirect back to this page without the code
      // This ensures we load with a fresh session
      return redirect("/test/callback-google", { headers });
    } catch (error) {
      return json(
        {
          session: null,
          user: null,
          error: error instanceof Error ? error.message : String(error),
          code,
          refreshed: false,
        },
        { headers }
      );
    }
  }

  // No code means we're either already authenticated or redirected back after code exchange
  const authState = await getAuthState({ request });

  if (authState.user || authState.session) {
    return json(
      {
        ...authState,
        code: null,
        refreshed: true,
      },
      { headers }
    );
  }

  // Not authenticated and no code, redirect to login
  return redirect("/test/login-google", { headers });
}

export async function action({ request }: ActionFunctionArgs) {
  const { supabase, headers } = getSupabaseWithHeaders({
    request,
    useBase: true,
  });

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    return redirect("/test/login-google", { headers });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : String(error) },
      { headers }
    );
  }
}

export default function AuthCallbackGoogle() {
  const loaderData = useLoaderData<typeof loader>() as LoaderData;
  const actionData = useActionData<typeof action>() as ActionData;
  //   console.log("data", data);
  return (
    <PageContainer>
      <div className="flex flex-col mb-6">
        <div className="flex items-center gap-4 space-between col-span-full w-full">
          <h1 className="text-2xl font-bold">AuthCallbackGoogle</h1>
          <form method="post">
            <button
              type="submit"
              className="bg-red-500 text-white rounded hover:bg-red-600 px-2"
            >
              Sign Out
            </button>
          </form>
        </div>

        <div className="space-y-4 flex flex-col col-span-full">
          <div>
            <h2 className="text-lg font-semibold mb-2">Auth Code</h2>
            <pre className="bg-gray-700 p-4 rounded text-wrap">
              {loaderData.code || "No code present"}
            </pre>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Token Refreshed</h2>
            <pre className="bg-gray-700 p-4 rounded text-wrap">
              {loaderData.refreshed ? "true" : "false"}
            </pre>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Session Data</h2>
            <pre className="bg-gray-700 p-4 rounded text-wrap">
              {JSON.stringify(loaderData.session, null, 2)}
            </pre>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">User Data</h2>
            <pre className="bg-gray-700 p-4 rounded text-wrap">
              {JSON.stringify(loaderData.user, null, 2)}
            </pre>
          </div>

          {actionData && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Action Result</h2>
              <pre className="bg-gray-700 p-4 rounded text-wrap">
                {JSON.stringify(actionData, null, 2)}
              </pre>
            </div>
          )}

          {loaderData.error && (
            <div className="text-red-500">
              <h2 className="text-lg font-semibold mb-2">Error</h2>
              <pre className="bg-red-50 p-4 rounded text-wrap">
                {loaderData.error}
              </pre>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
