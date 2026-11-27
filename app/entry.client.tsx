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

// Only initialize Sentry in production to avoid sending local dev errors.
//
// This gate used to read `process.env.NODE_ENV`. Vite folds that to a literal
// in the client bundle, and in the deployed production build it folded to
// false: the shipped entry.client chunk contained no DSN at all, the whole
// block having been dropped as dead code. That is why Sentry logged zero
// production browser events while PostHog was recording hundreds of exceptions
// on the same pages. `import.meta.env.PROD` is the constant Vite guarantees —
// false under `vite dev`, true in a built client.
const isProduction = import.meta.env.PROD;

if (isProduction) {
  const clientEnv = (window as unknown as { ENV?: Record<string, string> }).ENV;
  const sentryDsn =
    clientEnv?.SENTRY_DSN ||
    "https://cd7847ec1fa0966145399ddcd6a5a6f4@o4506551058759680.ingest.us.sentry.io/4507813698666496";

  Sentry.init({
    dsn: sentryDsn,
    environment: clientEnv?.SENTRY_ENVIRONMENT || "production",
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
}

const GA_MEASUREMENT_ID = "G-2TQ0PM7CJ4";

// Loaded here rather than from a <script> in root.tsx's <head>: gtag.js appends
// its own nodes to <head>, which shifts the SSR children React is hydrating and
// triggers "Hydration failed because the initial UI does not match what was
// rendered on the server". Same reason PostHog is deferred below.
function initGoogleAnalytics() {
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  function gtag(...args: unknown[]) {
    w.dataLayer!.push(args);
  }
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

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
      // The project had $pageview events but no $web_vitals for 30+ days,
      // which PostHog flags as a health warning. Opt in explicitly.
      capture_performance: { web_vitals: true },
      persistence: "localStorage+cookie",
      loaded: () => {
        if (import.meta.env.DEV) {
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

  // Initialize PostHog after hydration is fully committed. PostHog autocapture
  // synchronously injects a <script> into <body>, which shifts SSR DOM children
  // out from under React's in-progress hydration and causes "Expected server
  // HTML to contain a matching <link> in <body>" mismatches in <Scripts />.
  // Defer to the next macrotask so React's hydration commit runs first.
  const initDeferredAnalytics = () => {
    initGoogleAnalytics();
    initPostHog();
  };

  if (typeof window !== "undefined") {
    if (document.readyState === "complete") {
      setTimeout(initDeferredAnalytics, 0);
    } else {
      window.addEventListener("load", () => setTimeout(initDeferredAnalytics, 0), {
        once: true,
      });
    }
  }
});
