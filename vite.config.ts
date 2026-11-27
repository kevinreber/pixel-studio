import { sentryVitePlugin } from "@sentry/vite-plugin";
import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { vercelPreset } from "@vercel/remix/vite";

const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;

export default defineConfig({
  plugins: [
    remix({
      presets: [vercelPreset()],
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
      },
    }),
    tsconfigPaths(),
    sentryVitePlugin({
      org: "kevin-reber",
      project: "pixel-studio",
      // Explicit so the dependency is visible rather than silent. Without a
      // token the plugin skips the upload ("No auth token provided. Will not
      // upload source maps"), which is why production stack traces are
      // unmapped: PIXEL-STUDIO-77 reported ExploreImageDetailsPage.tsx:19,
      // a line inside the import block, because the frame came from the built
      // file instead of source. Set SENTRY_AUTH_TOKEN in the Vercel project.
      authToken: sentryAuthToken,
      sourcemaps: sentryAuthToken
        ? {
            // Production serves .js.map publicly today, so the original source
            // is downloadable while Sentry still cannot read it. Once the maps
            // reach Sentry, drop them from the deployed bundle.
            //
            // Conditional on the token: without one, nothing changes, so a
            // missing token can never leave both Sentry and devtools blind.
            filesToDeleteAfterUpload: ["./build/**/*.map"],
          }
        : undefined,
    }),
  ],

  build: {
    sourcemap: true,
  },
});
