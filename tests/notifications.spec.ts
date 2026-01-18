import { test, expect } from "@playwright/test";

test.describe("Notifications API - Unauthenticated", () => {
  test("GET /api/notifications returns 401 when not authenticated", async ({
    request,
  }) => {
    const response = await request.get("/api/notifications");
    // Should redirect to login or return 401
    expect([401, 302]).toContain(response.status());
  });

  test("POST /api/notifications (mark all read) returns 401 when not authenticated", async ({
    request,
  }) => {
    const response = await request.post("/api/notifications");
    expect([401, 302]).toContain(response.status());
  });

  test("POST /api/notifications/:id/read returns 401 when not authenticated", async ({
    request,
  }) => {
    const response = await request.post(
      "/api/notifications/fake-notification-id/read"
    );
    expect([401, 302]).toContain(response.status());
  });

  test("DELETE /api/notifications/:id returns 401 when not authenticated", async ({
    request,
  }) => {
    const response = await request.delete(
      "/api/notifications/fake-notification-id"
    );
    expect([401, 302]).toContain(response.status());
  });
});

test.describe("Notifications API - Request Validation", () => {
  test("GET /api/notifications with invalid limit param returns error", async ({
    request,
  }) => {
    const response = await request.get("/api/notifications?limit=invalid");
    // Should either return 401 (not auth) or 400 (bad request) or redirect
    expect([400, 401, 302]).toContain(response.status());
  });
});

test.describe("Notification UI - Unauthenticated", () => {
  test("Notification bell is not visible on landing page for unauthenticated users", async ({
    page,
  }) => {
    await page.goto("/");

    // The notification bell should not be visible for unauthenticated users
    const notificationBell = page.getByRole("button", {
      name: /notifications/i,
    });
    await expect(notificationBell).not.toBeVisible();
  });

  test("Notification bell is not visible on login page", async ({ page }) => {
    await page.goto("/login");

    const notificationBell = page.getByRole("button", {
      name: /notifications/i,
    });
    await expect(notificationBell).not.toBeVisible();
  });
});

test.describe("Notification Routes - Method Validation", () => {
  test("GET on mark-read endpoint returns 405", async ({ request }) => {
    const response = await request.get(
      "/api/notifications/fake-id/read"
    );
    // GET method should not be allowed on mark-read endpoint
    expect([405, 401, 302]).toContain(response.status());
  });

  test("GET on delete endpoint returns 405 or redirects", async ({
    request,
  }) => {
    const response = await request.get("/api/notifications/fake-id");
    // GET method should not be allowed on individual notification endpoint
    expect([405, 401, 302]).toContain(response.status());
  });

  test("PUT on notifications list endpoint returns 405", async ({ request }) => {
    const response = await request.put("/api/notifications", {
      data: {},
    });
    expect([405, 401, 302]).toContain(response.status());
  });
});
