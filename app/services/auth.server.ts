import { Authenticator } from "remix-auth";
// import { GoogleStrategy, SocialsProvider } from "remix-auth-socials";
import { GoogleStrategy } from "remix-auth-google";
import { sessionStorage } from "~/services/session.server";
import { prisma } from "./prisma.server";
import { redirect } from "@remix-run/node";
import bcrypt from "bcryptjs";


export const SESSION_KEY = "_session";
export const USER_ID_KEY = "userId";
const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30;

// Create an instance of the authenticator
// It will take session storage as an input parameter and creates the user session on successful authentication
export const authenticator = new Authenticator(sessionStorage, {
  sessionKey: SESSION_KEY,
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
      // callbackURL: getCallback(SocialsProvider.GOOGLE),
      callbackURL: getCallback('google'),
    },
    async ({ profile }) => {
      // here you would find or create a user in your database
      // profile object contains all the user data like image, displayName, id
      return profile;
    },
  ),
);

export const getSessionExpirationDate = () =>
  new Date(Date.now() + SESSION_EXPIRATION_TIME);

export async function getPasswordHash(password: string) {
  const hash = await bcrypt.hash(password, 10);
  return hash;
}

export async function getUserId(request: Request) {
  const cookieSession = await sessionStorage.getSession(
    request.headers.get("cookie")
  );
  const sessionId = cookieSession.get(SESSION_KEY);
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
  const userId = await getUserId(request);
  if (userId) {
    throw redirect("/explore");
  }
}
