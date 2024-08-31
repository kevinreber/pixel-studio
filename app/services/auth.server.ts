// import { GoogleStrategy, SocialsProvider } from "remix-auth-socials";
// import { sessionStorage } from "~/services/session.server";
import { prisma } from "./prisma.server";
import { redirect } from "@remix-run/node";
// import //   getSessionUserId,
// //   combineResponseInits,
// //   getSessionExpirationDate,
// "utils";
import { type Password, type User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { logout } from "~/server/logout";

export const SESSION_KEY = "sessionId";
// export const authenticator = new Authenticator<ProviderUser>(
//   connectionSessionStorage
// );

const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30;

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
    throw await logout({ request });
  }
  return session.user.id;
}

export async function verifyUserPassword(
  where: Pick<User, "username"> | Pick<User, "id">,
  password: Password["hash"]
) {
  const userWithPassword = await prisma.user.findUnique({
    where,
    select: { id: true, password: { select: { hash: true } } },
  });

  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }

  const isValid = await bcrypt.compare(
    password,
    userWithPassword.password.hash
  );

  if (!isValid) {
    return null;
  }

  return { id: userWithPassword.id };
}

export async function requireAnonymous(request: Request) {
  const userId = await getUserId(request);
  if (userId) {
    throw redirect("/explore");
  }
}
