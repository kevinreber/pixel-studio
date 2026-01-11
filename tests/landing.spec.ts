import { test, expect } from "@playwright/test";

test("Landing page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/pixel studio/i)).toBeVisible();
});
