import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["production", "development", "test"] as const),
  SESSION_SECRET: z.string(),
  HONEYPOT_SECRET: z.string(),
});

// eslint-disable-next-line import/namespace
type SchemaType = z.infer<typeof schema>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv extends SchemaType {}
  }
}

/**
 * Canonical app origin, e.g. `https://www.pixelstudioai.com`.
 *
 * Trimmed because a stray leading/trailing space in the `ORIGIN` env var yields
 * a malformed URL; downstream OAuth redirect and callback URLs built from it
 * then fail to parse (a whitespace-prefixed value breaks `URL`/GoTrue parsing).
 */
export const ORIGIN = process.env.ORIGIN?.trim() || "http://localhost:5173";

export function init() {
  const parsed = schema.safeParse(process.env);

  if (parsed.success === false) {
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors
    );

    throw new Error("Invalid envirmonment variables");
  }
}

/**
 * This is used in both `entry.server.ts` and `root.tsx` to ensure that
 * the environment variables are set and globally available before the app is
 * started.
 *
 * NOTE: Do *not* add any environment variables in here that you do not wish to
 * be included in the client.
 * @returns all public ENV variables
 */
export function getEnv() {
  return {
    MODE: process.env.NODE_ENV,
    POSTHOG_API_KEY: process.env.POSTHOG_API_KEY,
    POSTHOG_HOST: process.env.POSTHOG_HOST || "https://us.i.posthog.com",
    // A Sentry DSN is a public credential — it ships in the client bundle by
    // design. `entry.client.tsx` read `window.ENV.SENTRY_DSN` before it was
    // exposed here, so it always fell through to its hardcoded default.
    SENTRY_DSN: process.env.SENTRY_DSN,
    // Labels browser events. Without it every event lands in one bucket and
    // production is indistinguishable from a local or CI run.
    SENTRY_ENVIRONMENT:
      process.env.SENTRY_ENVIRONMENT ||
      process.env.VERCEL_ENV ||
      process.env.NODE_ENV,
  };
}

type ENV = ReturnType<typeof getEnv>;

declare global {
  // eslint-disable-next-line no-var
  var ENV: ENV;
  interface Window {
    ENV: ENV;
  }
}
