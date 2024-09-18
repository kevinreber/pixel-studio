import { createCookieSessionStorage } from "@remix-run/node";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "pixel_studio_session",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: process.env.SESSION_SECRET!.split(","),
    secure: process.env.NODE_ENV === "production",
  },
});

// TODO: Need to look into this and confirm if session is being created as expected
export const getSessionUserId = async (request: Request) => {
  const cookieSession = await sessionStorage.getSession(
    request.headers.get("cookie"),
  );
  return cookieSession.get("userId");
};

export const { getSession, commitSession, destroySession } = sessionStorage;
