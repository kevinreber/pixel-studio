import { test, expect } from "@playwright/test";

test("Login page renders", async ({ page }) => {
  await page.goto("/login");
  // Use getByRole to be more specific - targets the h1 heading
  await expect(page.getByRole("heading", { name: /sign in to your account/i })).toBeVisible();
});
