import React from "react";
import { useRevalidator } from "@remix-run/react";
import { createBrowserClient } from "@supabase/ssr";
import type { Session } from "@supabase/supabase-js";
// import type { Database } from "database.types";

/**
 * This code was referenced from the following tutorial:
 * YouTube: https://youtu.be/ocWc_FFc5jE?si=70KZNTDwPLKZ7Pwz&t=5550
 * Github Repo : https://github.com/rajeshdavidbabu/remix-supabase-social/blob/master/youtube%20course/app/lib/supabase.ts
 */

type SupabaseEnv = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
};

type UseSupabase = {
  env: SupabaseEnv;
  serverSession: Session | null;
};

export const useSupabaseClient = ({ env, serverSession }: UseSupabase) => {
  const [supabase] = React.useState(() =>
  createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
  );
  const serverAccessToken = serverSession?.access_token;
  const revalidator = useRevalidator();

  React.useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token !== serverAccessToken) {
        // Revalidate the app.
        revalidator.revalidate();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, serverAccessToken, revalidator]);

  return { supabase };
};