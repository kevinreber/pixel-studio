import * as Sentry from "@sentry/remix";

Sentry.init({
    dsn: "https://cd7847ec1fa0966145399ddcd6a5a6f4@o4506551058759680.ingest.us.sentry.io/4507813698666496",
    tracesSampleRate: 1,
    autoInstrumentRemix: true
})