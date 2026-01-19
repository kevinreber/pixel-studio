import * as Sentry from "@sentry/remix";
import posthog from "posthog-js";
/**
 * By default, Remix will handle hydrating your app on the client for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.client
 */

import { RemixBrowser, useLocation, useMatches } from "@remix-run/react";
import { startTransition, StrictMode, useEffect } from "react";
import { hydrateRoot } from "react-dom/client";

// Initialize Sentry
Sentry.init({
  dsn: "https://cd7847ec1fa0966145399ddcd6a5a6f4@o4506551058759680.ingest.us.sentry.io/4507813698666496",
  tracesSampleRate: 1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,

  integrations: [
    Sentry.browserTracingIntegration({
      useEffect,
      useLocation,
      useMatches,
    }),
  ],
});

// Initialize PostHog after DOM is ready
function initPostHog() {
  const env = (window as unknown as { ENV?: Record<string, string> }).ENV;
  const apiKey = env?.POSTHOG_API_KEY;
  const host = env?.POSTHOG_HOST || "https://us.i.posthog.com";

  if (apiKey) {
    posthog.init(apiKey, {
      api_host: host,
      autocapture: true, // Enable automatic event capture
      capture_pageview: true, // Enable automatic pageview tracking
      capture_pageleave: true,
      persistence: "localStorage+cookie",
      loaded: () => {
        if (process.env.NODE_ENV === "development") {
          console.log("[Analytics] PostHog initialized");
        }
      },
    });
  }
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>
  );

  // Initialize PostHog after hydration
  initPostHog();
});