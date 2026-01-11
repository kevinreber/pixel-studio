import { Authenticator } from "remix-auth";
// import { GoogleStrategy, SocialsProvider } from "remix-auth-socials";
import { GoogleStrategy } from "remix-auth-google";
import {
  commitSession,
  getSessionCookie,
  sessionStorage,
} from "~/services/session.server";
import { redirect } from "@remix-run/node";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { prisma } from "~/services/prisma.server";
import {
  getAuthState,
  getSupabaseWithHeaders,
  signOutOfSupabase,
} from "~/services/supabase.server";
export const AUTH_KEY = "_auth";
// ? Placeholder for GOOGLE_SESSION_KEY
// export const GOOGLE_SESSION_KEY = "_google_auth";
export const USER_ID_KEY = "_userId";

// Create an instance of the authenticator
// It will take session storage as an input parameter and creates the user session on successful authentication
export const authenticator = new Authenticator(sessionStorage, {
  sessionKey: AUTH_KEY,
});
// You may specify a <User> type which the strategies will return (this will be stored in the session)
// export let authenticator = new Authenticator<User>(sessionStorage, { sessionKey: '_session' });

// const getCallback = (provider: SocialsProvider) => {
const getCallback = (provider: string) => {
  return `${process.env.ORIGIN}/auth/${provider}/callback`;
};

authenticator.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: getCallback("google"),
    },
    async ({ profile }) => {
      // here you would find or create a user in your database
      // profile object contains all the user data like image, displayName, id
      return profile;
    }
  )
);

export async function requireAnonymous(request: Request) {
  const authUser = await authenticator.isAuthenticated(request);
  if (authUser) {
    throw redirect("/explore");

    // ! TODO: This is for redirecting users that are already logged in
    // const requestUrl = new URL(request.url);
    // const redirectToParam = requestUrl.searchParams.get("redirectTo");

    // const redirectTo = !redirectToParam
    //   ? "/explore"
    //   : redirectToParam ?? `${requestUrl.pathname}${requestUrl.search}`;
    // const redirectParams = redirectTo
    //   ? new URLSearchParams({ redirectTo })
    //   : null;
    // const redirectUrl = [redirectParams?.toString()].filter(Boolean).join("?");
    // throw redirect(redirectUrl);
  }
}

interface UserProfile {
  provider: "google"; // Assuming the provider is always 'google'
  id: string;
  displayName: string;
  name: {
    givenName: string;
  };
  emails: Email[];
  photos: Photo[];
  _json: GoogleUserJson;
}

interface Email {
  value: string;
}

interface Photo {
  value: string;
}

interface GoogleUserJson {
  sub: string;
  name: string;
  given_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
}

/**
 * @description
 * This function validates if a user is logged in and redirects the user to our
 * Login Page if they are not logged in
 */
export const requireUserLogin = async (
  request: Request
): Promise<UserProfile | SupabaseUser> => {
  try {
    // First check supabase auth
    const { supabase } = getSupabaseWithHeaders({
      request,
      useBase: true,
    });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      return session.user;
    }
    throw new Error("No supabase session found");
    // console.log("No supabase session found, checking auth state...");
    //   await signOutOfSupabase({ request, useBase: true });
    //   const cookieSession = await getSessionCookie(request);
    //   cookieSession.unset(USER_ID_KEY);
    //   cookieSession.unset(AUTH_KEY);

    //   throw redirect("/login", {
    //     headers: {
    //       "Set-Cookie": await commitSession(cookieSession),
    //     },
    //   });
    // }

    // const authUser = (await authenticator.isAuthenticated(
    //   request
    // )) as UserProfile;

    // if (!authUser) {
    //   const requestUrl = new URL(request.url);
    //   redirectTo =
    //     redirectTo === null
    //       ? null
    //       : redirectTo ?? `${requestUrl.pathname}${requestUrl.search}`;
    //   const loginParams = redirectTo
    //     ? new URLSearchParams({ redirectTo })
    //     : null;
    //   const loginRedirect = ["/login", loginParams?.toString()]
    //     .filter(Boolean)
    //     .join("?");
    //   throw redirect(loginRedirect);
    // }

    // return authUser;
  } catch (error) {
    console.error("Authentication error:", error);
    await signOutOfSupabase({ request, useBase: true });
    const cookieSession = await getSessionCookie(request);
    cookieSession.unset(USER_ID_KEY);
    cookieSession.unset(AUTH_KEY);

    throw redirect("/login", {
      headers: {
        "Set-Cookie": await commitSession(cookieSession),
      },
    });
    // }
    throw redirect("/login");
  }
};

/**
 *
 * @param request
 * @returns object of google session auth
 *
 * @example
 * {
 *   provider: 'google',
 *   id: '106056837321390283507',
 *   displayName: 'Pogi Boi Run Club',
 *   name: { givenName: 'Pogi Boi Run Club' },
 *   emails: [ { value: 'pogiboirunclub@gmail.com' } ],
 *   photos: [
 *     {
 *       value: 'https://lh3.googleusercontent.com/a/ACg8ocKmsqzYiAMBzDMm3JPUdTaSHwxn-ciCqH6lZu6X8fXgkwkxWA=s96-c'
 *     }
 *   ],
 *   _json: {
 *     sub: '106056837321390283507',
 *     name: 'Pogi Boi Run Club',
 *     given_name: 'Pogi Boi Run Club',
 *     picture: 'https://lh3.googleusercontent.com/a/ACg8ocKmsqzYiAMBzDMm3JPUdTaSHwxn-ciCqH6lZu6X8fXgkwkxWA=s96-c',
 *     email: 'pogiboirunclub@gmail.com',
 *     email_verified: true
 *  }
 * }
 */
export async function getGoogleSessionAuth(request: Request) {
  const cookieSession = await getSessionCookie(request);
  const sessionAuth = cookieSession.get(AUTH_KEY);
  if (!sessionAuth) {
    const authUser = await getUserFromAuth(request);
    return authUser ?? null;
  }
  return sessionAuth;
}

export async function handleAuthCallback(supabaseUser: SupabaseUser | null) {
  if (!supabaseUser) return null;

  // Look for existing user by ID (which is the same as Supabase ID)
  const existingUser = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
  });

  if (existingUser) {
    return existingUser;
  }

  // Look for user by email as fallback
  const userByEmail = await prisma.user.findUnique({
    where: { email: supabaseUser.email! },
  });

  if (userByEmail) {
    // This case should be rare/impossible if migration was done correctly
    console.warn(`Found user by email but not ID: ${supabaseUser.email}`);
    return userByEmail;
  }

  const username =
    supabaseUser.user_metadata.username ??
    generateUsernameFromEmail(supabaseUser.email!);

  // Create new user with same ID as Supabase
  return await prisma.user.create({
    data: {
      id: supabaseUser.id, // Use same ID from Supabase
      email: supabaseUser.email!,
      username,
    },
  });
}

function generateUsernameFromEmail(email: string): string {
  return email.split("@")[0];
}

/**
 * @description
 * This function checks if a user exists in the auth database
 * @param request
 * @returns user object if user exists, null otherwise
 */
export const getUserFromAuth = async (request: Request) => {
  try {
    const authState = await getAuthState({ request });
    if (!authState.user) {
      return null;
    }
    return authState.user;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
};
