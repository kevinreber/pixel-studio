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

// Whether we report errors is decided at RUNTIME, deliberately not from a
// build-time constant.
//
// The Vercel build runs with NODE_ENV=development. That was verified by
// reproducing the deployed bundle byte-for-byte: `NODE_ENV=development npm run
// build` emits entry.client-CQYCRvrO.js, the exact hash Vercel serves. In such
// a build BOTH `process.env.NODE_ENV === "production"` and
// `import.meta.env.PROD` fold to false, so any `if (...)` wrapper around
// Sentry.init is dropped as dead code before it ever ships. That is why Sentry
// recorded zero production browser events for 90+ days while PostHog recorded
// hundreds of exceptions on the same pages.
//
// `window.ENV.SENTRY_ENVIRONMENT` is written by the server at request time and
// resolves from VERCEL_ENV, so it is "production" or "preview" on a deployment
// and "development" locally. A runtime read cannot be eliminated by the
// bundler, so error reporting no longer depends on the build mode being right.
const clientEnv = (window as unknown as { ENV?: Record<string, string> }).ENV;
const sentryEnvironment = clientEnv?.SENTRY_ENVIRONMENT;

// `window.ENV` is built from the root loader's data, so it serializes to `{}`
// on an error page — the root loader never produced data, and `Layout` reads it
// through `useRouteLoaderData`, which is undefined while the error boundary
// renders. Verified on the preview: a 404 emits `window.ENV = {}`.
//
// Falling back to the hostname keeps reporting alive on exactly the pages most
// worth reporting from. It is also runtime-only, so it survives the build mode
// problem described above.
const isLocalHost = /^(localhost|127\.0\.0\.1|\[::1\]|::1)$/.test(
  window.location.hostname
);
const isDeployed = sentryEnvironment
  ? sentryEnvironment === "production" || sentryEnvironment === "preview"
  : !isLocalHost;

if (isDeployed) {
  const sentryDsn =
    clientEnv?.SENTRY_DSN ||
    "https://cd7847ec1fa0966145399ddcd6a5a6f4@o4506551058759680.ingest.us.sentry.io/4507813698666496";

  Sentry.init({
    dsn: sentryDsn,
    // Derived from the host only on the error-page path above, where the server
    // could not tell us. Preview deployments are always *.vercel.app.
    environment:
      sentryEnvironment ||
      (window.location.hostname.endsWith(".vercel.app")
        ? "preview"
        : "production"),
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
        // Runtime check for the same reason as the Sentry gate above:
        // `import.meta.env.DEV` folds to *true* in the Vercel build, so this
        // would otherwise log on every production page load.
        if (!isDeployed) {
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
