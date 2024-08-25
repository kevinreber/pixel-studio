import { test, expect } from "@playwright/test";

// const BASE_URL = process.env.ORIGIN;

test("Explore page renders", async ({ page }) => {
  await page.goto("/explore");
  await expect(page).toHaveTitle(/explore/i);
});
