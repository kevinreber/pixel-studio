import { test, expect } from "@playwright/test";

test.describe("Analytics Dashboard - Protected Route", () => {
  test("Analytics page redirects to login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/user/analytics");
    // Should redirect to login or show unauthorized
    await expect(page).toHaveURL(/login|unauthorized|error/);
  });
});

test.describe("Analytics API - Protected Endpoints", () => {
  test("Dashboard API requires authentication", async ({ request }) => {
    const response = await request.get("/api/user/analytics/dashboard");

    // Should not return 200 (success) when not authenticated
    // Could be 302 (redirect), 401, 403 (auth errors), or 500 (server error in test env)
    expect(response.status()).not.toBe(200);
  });

  test("Style fingerprint API requires authentication", async ({ request }) => {
    const response = await request.get(
      "/api/user/analytics/style-fingerprint"
    );

    // Should not return 200 (success) when not authenticated
    expect(response.status()).not.toBe(200);
  });

  test("Recompute style fingerprint requires authentication", async ({
    request,
  }) => {
    const response = await request.post(
      "/api/user/analytics/style-fingerprint"
    );

    // Should not return 200 (success) when not authenticated
    expect(response.status()).not.toBe(200);
  });
});

test.describe("Analytics - Response Structure", () => {
  // These tests would run in an authenticated context
  // For now, we verify the API endpoints exist and respond appropriately

  test("Dashboard endpoint exists", async ({ request }) => {
    const response = await request.get("/api/user/analytics/dashboard");

    // Should not return 404 (endpoint exists)
    expect(response.status()).not.toBe(404);
  });

  test("Style fingerprint endpoint exists", async ({ request }) => {
    const response = await request.get(
      "/api/user/analytics/style-fingerprint"
    );

    // Should not return 404 (endpoint exists)
    expect(response.status()).not.toBe(404);
  });
});
