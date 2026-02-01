import { sentryVitePlugin } from "@sentry/vite-plugin";
import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { vercelPreset } from "@vercel/remix/vite";

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
    }),
  ],

  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: (id) => {
          // Separate vendor chunks for better caching
          if (id.includes("node_modules")) {
            // React core
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor-react";
            }
            // Radix UI components
            if (id.includes("@radix-ui")) {
              return "vendor-radix";
            }
            // Lucide icons
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            // Zod validation
            if (id.includes("zod")) {
              return "vendor-zod";
            }
            // Other vendor libraries
            return "vendor";
          }
        },
      },
    },
  },
});
