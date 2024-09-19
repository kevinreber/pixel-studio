import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";

export const getSupabaseEnv = () => ({
    DATABASE_URL: process.env.DATABASE_URL!,
    DATABASE_ANON_KEY: process.env.DATABASE_ANON_KEY!,
});

export function getSupabaseWithHeaders({ request }: { request: Request }) {
//   const cookies = parseCookieHeader(request.headers.get("Cookie") ?? "");
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
      return parseCookieHeader(request.headers.get('Cookie') ?? '')
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) =>
        headers.append('Set-Cookie', serializeCookieHeader(name, value, options))
      )
    },
  },
})

  return { supabase, headers };
}

// ! Current error getting
// login:1 Failed to launch 
// 'postgres://postgres.uxqbliwogwtwdnuiodbt:lII2L2xdQrCP0aUn@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1/auth/v1/authorize?provider=google&redirect_to=http%3A%2F%2Flocalhost%3A5173%2Fauth%2Fcallback&code_challenge=v9WEmEh6ZBa132TGXH-_IfxZtXJCf9SYWsiruyaoniA&code_challenge_method=s256'
// because the scheme does not have a registered handler.


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