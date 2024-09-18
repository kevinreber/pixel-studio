// import { redirect, type LoaderFunctionArgs } from '@remix-run/node'
// // import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
// import { getSupabaseWithHeaders } from '~/services/supabase.server'

// export async function loader({ request }: LoaderFunctionArgs) {
//     console.log('Hit auth callback.................');
    
//   const requestUrl = new URL(request.url)
//   const code = requestUrl.searchParams.get('code')
//   const next = requestUrl.searchParams.get('next') || '/'
// //   const headers = new Headers()

//   if (code) {
//     // const cookies = parse(request.headers.get('Cookie') ?? '')
//     // const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
//     //   cookies: {
//     //     getAll() {
//     //       return parseCookieHeader(request.headers.get('Cookie') ?? '')
//     //     },
//     //     setAll(cookiesToSet) {
//     //       cookiesToSet.forEach(({ name, value, options }) =>
//     //         headers.append('Set-Cookie', serializeCookieHeader(name, value, options))
//     //       )
//     //     },
//     //   },
//     // })

//     const { supabase, headers } = getSupabaseWithHeaders({
//         request,
//     })

//     console.log('supabase', supabase);
//     console.log('headers', headers);

//     const { error } = await supabase.auth.exchangeCodeForSession(code)

//     if (!error) {
//       return redirect(next, { headers })
//     }
//   }

//   // return the user to an error page with instructions
// //   return redirect('/auth/auth-code-error', { headers })
//   return redirect('/login')
// }

import { redirect, type LoaderFunctionArgs } from '@remix-run/node'
import { json, useOutletContext } from '@remix-run/react';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
import React from 'react';
import { getSupabaseEnv } from '~/services/supabase.server';

export async function loader({ request }: LoaderFunctionArgs) {
    console.log('Hit auth callback.................');

    const response = new Response()
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
  
    if (code) {
    const { DATABASE_URL, DATABASE_ANON_KEY } = getSupabaseEnv();
      const supabaseClient = createServerClient(
        DATABASE_URL,
        DATABASE_ANON_KEY,
        { request, response }
      )
      await supabaseClient.auth.exchangeCodeForSession(code)
    }
  
    return redirect('/', {
      headers: response.headers,
    })

  const requestUrl = new URL(request.url)
//   const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'
  const headers = new Headers()

  if (code) {
    const { DATABASE_URL, DATABASE_ANON_KEY } = getSupabaseEnv();
    // const cookies = parse(request.headers.get('Cookie') ?? '')
    // const supabase = createServerClient(DATABASE_URL!, DATABASE_ANON_KEY!, {
    //   cookies: {
    //     getAll() {
    //       return parseCookieHeader(request.headers.get('Cookie') ?? '')
    //     },
    //     setAll(cookiesToSet) {
    //       cookiesToSet.forEach(({ name, value, options }) =>
    //         headers.append('Set-Cookie', serializeCookieHeader(name, value, options))
    //       )
    //     },
    //   },
    // })
    const supabaseClient = createServerClient(
        DATABASE_URL,
        DATABASE_ANON_KEY,
        { request, response }
      )
      await supabaseClient.auth.exchangeCodeForSession(code)

    // const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return redirect(next, { headers })
    }
  }

  // return the user to an error page with instructions
//   return redirect('/auth/auth-code-error', { headers })
//   return redirect('/login')
  return json({ success: true }, { headers });
}



export default function Index() {

    const { supabase, domainUrl } = useOutletContext<{ supabase: Record<string, any>; domainUrl: string }>();


  React.useEffect(() => {
    const handleAuth = async () => {
      const { error } = await supabase.auth.getSessionFromUrl();
      if (error) {
        console.error('Error retrieving session:', error.message);
      } else {
        // Redirect the user to their dashboard or desired page after successful login
        window.location.replace('/dashboard');  // Example redirection
      }
    };
    handleAuth();
  }, []);

  return <div>Logging you in...</div>;
}