import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [tsconfigPaths() as any],
  test: {
    globals: true,
    environment: "node",
    include: ["app/**/*.test.ts", "app/**/*.test.tsx"],
    exclude: ["node_modules", "build", "tests/**/*"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        "build/**",
        "tests/**",
        "**/*.test.ts",
        "**/*.test.tsx",
        "vitest.config.ts",
        "vite.config.ts",
        "playwright.config.ts",
      ],
    },
    setupFiles: ["./vitest.setup.ts"],
  },
});
