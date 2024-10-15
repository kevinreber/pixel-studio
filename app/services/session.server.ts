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

export const { getSession, commitSession, destroySession } = sessionStorage;

export const getSessionCookie = async (request: Request) => {
  return getSession(request.headers.get("Cookie"));
};

// TODO: Need to look into this and confirm if session is being created as expected
export const getSessionUserId = async (request: Request) => {
  const cookieSession = await getSessionCookie(request);
  return cookieSession.get("userId");
};
