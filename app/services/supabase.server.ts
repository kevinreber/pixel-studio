import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";
import type { Session, User } from "@supabase/supabase-js";

export const getSupabaseEnv = () => ({
  DATABASE_BASE_URL: process.env.DATABASE_BASE_URL!,
  DATABASE_URL: process.env.DATABASE_URL!,
  DATABASE_ANON_KEY: process.env.DATABASE_ANON_KEY!,
});

export function getSupabaseWithHeaders({
  request,
  useBase = false,
}: {
  request: Request;
  useBase?: boolean;
}) {
  const headers = new Headers();

  const { DATABASE_BASE_URL, DATABASE_URL, DATABASE_ANON_KEY } =
    getSupabaseEnv();
  const dbUrl = useBase ? DATABASE_BASE_URL : DATABASE_URL;
  //   const supabase = createServerClient(
  //     DATABASE_URL,
  //     DATABASE_ANON_KEY,
  //     {
  //       cookies: {
  //         get(key) {
  //           return cookies[key];
  //         },
  //         set(key, value, options) {
  //           headers.append("Set-Cookie", serializeCookieHeader(key, value, options));
  //         },
  //         remove(key, options) {
  //           headers.append("Set-Cookie", serializeCookieHeader(key, "", options));
  //         },
  //       },
  //     }
  //   );

  const supabase = createServerClient(dbUrl!, DATABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          headers.append(
            "Set-Cookie",
            serializeCookieHeader(name, value, options)
          )
        );
      },
    },
  });

  return { supabase, headers };
}

export async function getSupabaseWithSessionAndHeaders({
  request,
}: {
  request: Request;
}) {
  const { supabase, headers } = getSupabaseWithHeaders({
    request,
  });
  const {
    data: { session: serverSession },
  } = await supabase.auth.getSession();

  return { serverSession, headers, supabase };
}

// Add this type to help with auth state
export type AuthState = {
  session: Session | null;
  user: User | null;
  error: string | null;
  headers: Headers;
};

export async function getAuthState({
  request,
}: {
  request: Request;
}): Promise<AuthState> {
  const { supabase, headers } = getSupabaseWithHeaders({
    request,
    useBase: true,
  });

  try {
    // First get session as it's less likely to error
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;

    // If we have a session, verify the user
    if (session) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      return {
        session,
        user,
        headers,
        error: null,
      };
    }

    // No session means not authenticated
    return {
      session: null,
      user: null,
      headers,
      error: "No user session exists",
    };
  } catch (error) {
    console.error("Auth state error:", error);
    return {
      session: null,
      user: null,
      headers,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
