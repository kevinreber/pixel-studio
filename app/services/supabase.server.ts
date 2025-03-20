import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";

export const getSupabaseEnv = () => ({
  DATABASE_URL: process.env.DATABASE_URL!,
  DATABASE_ANON_KEY: process.env.DATABASE_ANON_KEY!,
});

export function getSupabaseWithHeaders({ request }: { request: Request }) {
  const headers = new Headers();

  const { DATABASE_URL, DATABASE_ANON_KEY } = getSupabaseEnv();

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

  const supabase = createServerClient(DATABASE_URL!, DATABASE_ANON_KEY!, {
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
