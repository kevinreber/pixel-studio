import { test, expect } from "@playwright/test";

test("Landing page renders", async ({ page }) => {
  await page.goto("/");
  // Check for the main heading or logo text
  await expect(page.getByRole("heading", { name: /pixel studio/i }).first()).toBeVisible();
});
