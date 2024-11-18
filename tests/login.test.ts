import { test, expect } from "@playwright/test";

// const BASE_URL = process.env.ORIGIN;

test.skip("Login page renders", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveTitle(/login/i);
});
