import * as Sentry from "@sentry/remix";

// Only initialize Sentry in production to avoid sending local dev errors
const isProduction = process.env.NODE_ENV === "production";
const sentryDsn = process.env.SENTRY_DSN || "https://cd7847ec1fa0966145399ddcd6a5a6f4@o4506551058759680.ingest.us.sentry.io/4507813698666496";

if (isProduction) {
    Sentry.init({
        dsn: sentryDsn,
        tracesSampleRate: 1,
        autoInstrumentRemix: true
    });
}