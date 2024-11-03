import { test, expect } from "@playwright/test";

// const BASE_URL = process.env.ORIGIN;

test("Explore page redirects to login if not logged in", async ({ page }) => {
  await page.goto("/explore");
  // should be redirected to login page
  expect(page.url()).toContain("/login");
  await expect(page).toHaveTitle(/login/i);
});

// ! TODO: fix this test after setting up mock user login
// test("Explore page renders", async ({ page }) => {
//   await page.goto("/explore");
//   await expect(page).toHaveTitle(/explore/i);
// });
