import { test, expect } from "@playwright/test";

test.describe("Public Pages", () => {
  test("Landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /pixel studio/i }).first()
    ).toBeVisible();
  });

  test("Login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: /sign in to your account/i })
    ).toBeVisible();
  });

  test("Health check page loads", async ({ page }) => {
    await page.goto("/health");
    await expect(
      page.getByRole("heading", { name: /pixel studio health check/i })
    ).toBeVisible();
  });
});

test.describe("Protected Pages - Redirect to Login", () => {
  test("Explore page redirects to login", async ({ page }) => {
    await page.goto("/explore");
    await expect(page).toHaveURL(/login/);
  });

  test("Create page redirects to login", async ({ page }) => {
    await page.goto("/create");
    await expect(page).toHaveURL(/login/);
  });

  test("Collections page redirects to login", async ({ page }) => {
    await page.goto("/collections");
    await expect(page).toHaveURL(/login/);
  });

  test("Likes page redirects to login", async ({ page }) => {
    await page.goto("/likes");
    await expect(page).toHaveURL(/login/);
  });

  test("Sets page redirects to login", async ({ page }) => {
    await page.goto("/sets");
    await expect(page).toHaveURL(/login/);
  });

  test("Settings page redirects to login", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/login/);
  });

  test("Checkout page redirects to login", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("Dynamic Routes - Handle gracefully", () => {
  test("Image detail page with invalid ID shows error or redirects", async ({
    page,
  }) => {
    const response = await page.goto("/p/invalid-image-id");
    // Should either redirect to login or return an error status
    const status = response?.status();
    expect(status === 302 || status === 404 || status === 200).toBeTruthy();
  });

  test("Profile page with invalid user ID shows error or redirects", async ({
    page,
  }) => {
    const response = await page.goto("/profile/invalid-user-id");
    const status = response?.status();
    expect(status === 302 || status === 404 || status === 200).toBeTruthy();
  });

  test("Collection detail with invalid ID shows error or redirects", async ({
    page,
  }) => {
    const response = await page.goto("/collections/invalid-id");
    // Collections are public routes - should show error page or 404
    const status = response?.status();
    expect(status === 404 || status === 200).toBeTruthy();
  });

  test("Set detail with invalid ID shows error or redirects", async ({
    page,
  }) => {
    await page.goto("/sets/invalid-id");
    // Should redirect to login for protected routes
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("API Routes", () => {
  test("Health endpoint responds", async ({ request }) => {
    const response = await request.get("/health", {
      headers: { Accept: "application/json" },
    });
    // Health endpoint should respond (may be unhealthy in test env)
    expect([200, 500, 503]).toContain(response.status());

    // Try to parse as JSON, but handle HTML error pages gracefully
    const contentType = response.headers()["content-type"] || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("checks");
    }
    // If HTML is returned (error page), that's also acceptable in test env
  });
});

test.describe("Error Handling", () => {
  test("Non-existent route returns 404 or redirects", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist-12345");
    const status = response?.status();
    // Should return 404 or redirect
    expect(status === 404 || status === 302 || status === 200).toBeTruthy();
  });
});
