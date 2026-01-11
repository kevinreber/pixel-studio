import { test, expect } from "@playwright/test";

test("Login page renders", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText(/sign in/i)).toBeVisible();
});
