import { test, expect } from "@playwright/test";

test("Explore page redirects to login if not logged in", async ({ page }) => {
  await page.goto("/explore");
  // Should be redirected to login page
  await expect(page).toHaveURL(/login/);
});
