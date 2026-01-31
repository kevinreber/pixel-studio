import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 *
 * Performance optimizations applied:
 * - Increased CI workers from 1 to 4 for parallel execution
 * - Run only Chromium by default (use --project=all-browsers for cross-browser)
 * - Enabled web server auto-start
 * - Reduced retries and optimized trace collection
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only - reduced from 2 to 1 for faster feedback */
  retries: process.env.CI ? 1 : 0,
  /* Parallel workers: 4 on CI, 50% of CPUs locally */
  workers: process.env.CI ? 4 : "50%",
  /* Reporter: list for fast CI feedback, html for detailed local reports */
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "html",
  /* Global timeout per test - reduced for faster failure detection */
  timeout: 30000,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:5173",
    /* Collect trace only on failure to reduce overhead */
    trace: "retain-on-failure",
    /* Faster action timeout */
    actionTimeout: 10000,
    /* Faster navigation timeout */
    navigationTimeout: 15000,
  },

  /* Configure projects for major browsers */
  projects: [
    // Default: Chromium only (fast)
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    // Cross-browser testing (opt-in via --project=firefox or --project=webkit)
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    // Meta-project for full cross-browser testing
    {
      name: "all-browsers",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["chromium", "firefox", "webkit"],
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 120000,
    // Provide fallback environment variables for E2E tests
    // These allow the server to start even without full configuration
    // In CI, real values are provided via secrets in .env file
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/test",
      SESSION_SECRET: process.env.SESSION_SECRET || "test-secret-for-e2e-testing",
    },
  },
});
