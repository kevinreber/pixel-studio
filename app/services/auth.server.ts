import { Authenticator } from "remix-auth";
// import { GoogleStrategy, SocialsProvider } from "remix-auth-socials";
import { GoogleStrategy } from "remix-auth-google";
import { getSessionCookie, sessionStorage } from "~/services/session.server";
import { prisma } from "./prisma.server";
import { redirect } from "@remix-run/node";
import bcrypt from "bcryptjs";

export const AUTH_KEY = "_auth";
// ? Placeholder for GOOGLE_SESSION_KEY
// export const GOOGLE_SESSION_KEY = "_google_auth";
export const USER_ID_KEY = "_userId";
const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30;

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

export const getSessionExpirationDate = () =>
  new Date(Date.now() + SESSION_EXPIRATION_TIME);

export async function getPasswordHash(password: string) {
  const hash = await bcrypt.hash(password, 10);
  return hash;
}

// ! TODO: This is using sessionIDs
export async function getUserId(request: Request) {
  const cookieSession = await getSessionCookie(request);
  const sessionId = cookieSession.get(USER_ID_KEY);
  if (!sessionId) return null;
  const session = await prisma.session.findUnique({
    select: { user: { select: { id: true } } },
    where: { id: sessionId, expirationDate: { gt: new Date() } },
  });
  if (!session?.user) {
    // throw await logout({ request });
    throw redirect("/login");
  }
  return session.user.id;
}

export async function requireAnonymous(request: Request) {
  // const userId = await getUserId(request);
  // if (userId) {
  //   throw redirect("/explore");
  // }
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

/**
 * @description
 * This function validates if a user is logged in and redirects the user to our
 * Login Page if they are not logged in
 */
export const requireUserLogin = async (
  request: Request,
  { redirectTo }: { redirectTo?: string | null } = {}
) => {
  const authUser = await authenticator.isAuthenticated(request);

  if (!authUser) {
    const requestUrl = new URL(request.url);
    redirectTo =
      redirectTo === null
        ? null
        : redirectTo ?? `${requestUrl.pathname}${requestUrl.search}`;
    const loginParams = redirectTo ? new URLSearchParams({ redirectTo }) : null;
    const loginRedirect = ["/login", loginParams?.toString()]
      .filter(Boolean)
      .join("?");
    throw redirect(loginRedirect);
  }

  return authUser;
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
  if (!sessionAuth) return null;
  return sessionAuth;
}
