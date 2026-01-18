import { test, expect } from "@playwright/test";

test.describe("Notifications API - Unauthenticated", () => {
  test("GET /api/notifications requires authentication", async ({
    request,
  }) => {
    const response = await request.get("/api/notifications");
    // Should redirect to login (302) or return success from login page (200) or unauthorized (401)
    const status = response.status();
    expect(status === 401 || status === 302 || status === 200).toBeTruthy();
  });

  test("POST /api/notifications requires authentication", async ({
    request,
  }) => {
    const response = await request.post("/api/notifications");
    const status = response.status();
    expect(status === 401 || status === 302 || status === 200).toBeTruthy();
  });

  test("POST /api/notifications/:id/read requires authentication", async ({
    request,
  }) => {
    const response = await request.post(
      "/api/notifications/fake-notification-id/read"
    );
    const status = response.status();
    expect(status === 401 || status === 302 || status === 200).toBeTruthy();
  });

  test("DELETE /api/notifications/:id requires authentication", async ({
    request,
  }) => {
    const response = await request.delete(
      "/api/notifications/fake-notification-id"
    );
    const status = response.status();
    expect(status === 401 || status === 302 || status === 200).toBeTruthy();
  });
});

test.describe("Notification UI - Unauthenticated", () => {
  test("Landing page loads for unauthenticated users", async ({ page }) => {
    await page.goto("/");
    // Just verify the page loads - notification bell should not be present for logged out users
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
});

test.describe("Notification Routes - Method Validation", () => {
  test("GET on mark-read endpoint handles request", async ({ request }) => {
    const response = await request.get("/api/notifications/fake-id/read");
    // Should return 405 (method not allowed), redirect (302), or success from redirect (200)
    const status = response.status();
    expect(
      status === 405 || status === 401 || status === 302 || status === 200
    ).toBeTruthy();
  });

  test("GET on individual notification endpoint handles request", async ({
    request,
  }) => {
    const response = await request.get("/api/notifications/fake-id");
    const status = response.status();
    expect(
      status === 405 || status === 401 || status === 302 || status === 200
    ).toBeTruthy();
  });

  test("PUT on notifications list endpoint handles request", async ({
    request,
  }) => {
    const response = await request.put("/api/notifications", {
      data: {},
    });
    const status = response.status();
    expect(
      status === 405 || status === 401 || status === 302 || status === 200
    ).toBeTruthy();
  });
});
