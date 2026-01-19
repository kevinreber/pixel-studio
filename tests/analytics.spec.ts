import { test, expect } from "@playwright/test";

test.describe("Analytics Dashboard - Protected Route", () => {
  test("Analytics page redirects to login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/user/analytics");
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("Analytics API - Protected Endpoints", () => {
  test("Dashboard API requires authentication", async ({ request }) => {
    const response = await request.get("/api/user/analytics/dashboard");

    // Should redirect to login or return 401/302
    expect([302, 401, 403]).toContain(response.status());
  });

  test("Style fingerprint API requires authentication", async ({ request }) => {
    const response = await request.get(
      "/api/user/analytics/style-fingerprint"
    );

    // Should redirect to login or return 401/302
    expect([302, 401, 403]).toContain(response.status());
  });

  test("Recompute style fingerprint requires authentication", async ({
    request,
  }) => {
    const response = await request.post(
      "/api/user/analytics/style-fingerprint"
    );

    // Should redirect to login or return 401/302
    expect([302, 401, 403]).toContain(response.status());
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
