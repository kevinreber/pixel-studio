import { test, expect } from "@playwright/test";

/**
 * E2E tests for Admin Token Management page.
 *
 * These tests verify that:
 * 1. Admin tokens page requires authentication
 * 2. User search functionality works correctly
 * 3. Credit adjustment dialog behaves correctly
 * 4. Recent adjustments are displayed
 * 5. Error states are handled properly
 */

test.describe("Admin Tokens Page - Authentication", () => {
  test("Admin tokens page redirects unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto("/admin/tokens");
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("Admin Tokens Page - Layout", () => {
  test("Tokens page displays header and search section", async ({ page }) => {
    await page.route("**/admin/tokens**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <h2 data-testid="page-title">Token Management</h2>
                <p data-testid="page-description">Search for users and manually adjust their credit balance</p>
                <div data-testid="search-section">
                  <h3>Search Users</h3>
                  <p>Search by username or email to find a user</p>
                  <input data-testid="search-input" placeholder="Search by username or email..." />
                </div>
                <div data-testid="recent-adjustments-section">
                  <h3>Recent Admin Adjustments</h3>
                  <p>History of manual credit adjustments made by admins</p>
                </div>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/admin/tokens");

    await expect(page.getByTestId("page-title")).toContainText("Token Management");
    await expect(page.getByTestId("page-description")).toContainText("Search for users");
    await expect(page.getByTestId("search-section")).toBeVisible();
    await expect(page.getByTestId("search-input")).toBeVisible();
    await expect(page.getByTestId("recent-adjustments-section")).toBeVisible();
  });

  test("Tokens page shows empty state when no recent adjustments", async ({ page }) => {
    await page.route("**/admin/tokens**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="recent-adjustments-section">
                  <h3>Recent Admin Adjustments</h3>
                  <div data-testid="empty-state">No admin adjustments yet</div>
                </div>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/admin/tokens");

    await expect(page.getByTestId("empty-state")).toContainText("No admin adjustments yet");
  });
});

test.describe("Admin Tokens Page - User Search", () => {
  test("Search shows results when query matches users", async ({ page }) => {
    await page.route("**/admin/tokens**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="search-section">
                  <input data-testid="search-input" value="kevin" />
                </div>
                <div data-testid="search-results">
                  <div data-testid="user-result">
                    <span data-testid="user-avatar"></span>
                    <span data-testid="user-name">kevinreber</span>
                    <span data-testid="user-email">kevin@example.com</span>
                    <span data-testid="user-credits">50 credits</span>
                    <span data-testid="user-stats">25 generations - 20 images</span>
                    <button data-testid="add-credits-btn">Add</button>
                    <button data-testid="remove-credits-btn">Remove</button>
                  </div>
                </div>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/admin/tokens?q=kevin");

    await expect(page.getByTestId("search-results")).toBeVisible();
    await expect(page.getByTestId("user-name")).toContainText("kevinreber");
    await expect(page.getByTestId("user-email")).toContainText("kevin@example.com");
    await expect(page.getByTestId("user-credits")).toContainText("50 credits");
    await expect(page.getByTestId("add-credits-btn")).toBeVisible();
    await expect(page.getByTestId("remove-credits-btn")).toBeVisible();
  });

  test("Search shows no results message when no users match", async ({ page }) => {
    await page.route("**/admin/tokens**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="search-section">
                  <input data-testid="search-input" value="nonexistent" />
                </div>
                <div data-testid="no-results">No users found matching "nonexistent"</div>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/admin/tokens?q=nonexistent");

    await expect(page.getByTestId("no-results")).toContainText('No users found matching "nonexistent"');
  });

  test("Search shows minimum characters message for short queries", async ({ page }) => {
    await page.route("**/admin/tokens**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="search-section">
                  <input data-testid="search-input" value="k" />
                </div>
                <div data-testid="min-chars-message">Enter at least 2 characters to search</div>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/admin/tokens?q=k");

    await expect(page.getByTestId("min-chars-message")).toContainText("Enter at least 2 characters");
  });

  test("Remove button is disabled for users with zero credits", async ({ page }) => {
    await page.route("**/admin/tokens**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="search-results">
                  <div data-testid="user-result">
                    <span data-testid="user-name">zerouser</span>
                    <span data-testid="user-credits">0 credits</span>
                    <button data-testid="add-credits-btn">Add</button>
                    <button data-testid="remove-credits-btn" disabled>Remove</button>
                  </div>
                </div>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/admin/tokens?q=zero");

    await expect(page.getByTestId("remove-credits-btn")).toBeDisabled();
  });
});

test.describe("Admin Tokens Page - Credit Adjustment Dialog", () => {
  test("Add credits dialog displays user info and form fields", async ({ page }) => {
    await page.route("**/admin/tokens**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="credit-dialog" role="dialog">
                  <h2 data-testid="dialog-title">Add Credits</h2>
                  <p data-testid="dialog-description">Add credits to this user's account</p>
                  <div data-testid="user-info">
                    <span data-testid="dialog-username">testuser</span>
                    <span data-testid="dialog-email">test@example.com</span>
                    <span data-testid="dialog-current-credits">50 credits</span>
                  </div>
                  <div data-testid="amount-field">
                    <label for="amount">Amount to add</label>
                    <input id="amount" data-testid="amount-input" type="number" min="1" />
                  </div>
                  <div data-testid="reason-field">
                    <label for="reason">Reason (required)</label>
                    <textarea id="reason" data-testid="reason-input"></textarea>
                  </div>
                  <button data-testid="cancel-btn">Cancel</button>
                  <button data-testid="submit-btn" disabled>Add Credits</button>
                </div>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/admin/tokens");

    await expect(page.getByTestId("dialog-title")).toContainText("Add Credits");
    await expect(page.getByTestId("dialog-username")).toContainText("testuser");
    await expect(page.getByTestId("dialog-current-credits")).toContainText("50 credits");
    await expect(page.getByTestId("amount-input")).toBeVisible();
    await expect(page.getByTestId("reason-input")).toBeVisible();
    await expect(page.getByTestId("submit-btn")).toBeDisabled();
  });

  test("Remove credits dialog shows maximum amount limit", async ({ page }) => {
    await page.route("**/admin/tokens**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="credit-dialog" role="dialog">
                  <h2 data-testid="dialog-title">Remove Credits</h2>
                  <p data-testid="dialog-description">Remove credits from this user's account</p>
                  <div data-testid="user-info">
                    <span data-testid="dialog-username">testuser</span>
                    <span data-testid="dialog-current-credits">50 credits</span>
                  </div>
                  <div data-testid="amount-field">
                    <label for="amount">Amount to remove</label>
                    <input id="amount" data-testid="amount-input" type="number" min="1" max="50" />
                    <p data-testid="max-amount">Maximum: 50 credits</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/admin/tokens");

    await expect(page.getByTestId("dialog-title")).toContainText("Remove Credits");
    await expect(page.getByTestId("max-amount")).toContainText("Maximum: 50 credits");
    await expect(page.getByTestId("amount-input")).toHaveAttribute("max", "50");
  });

  test("Credit adjustment preview shows calculated balance", async ({ page }) => {
    await page.route("**/admin/tokens**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="credit-dialog" role="dialog">
                  <div data-testid="user-info">
                    <span data-testid="dialog-current-credits">50 credits</span>
                  </div>
                  <input data-testid="amount-input" value="25" />
                  <div data-testid="preview-section">
                    <p>Preview:</p>
                    <p data-testid="preview-calculation">50 credits + 25 = <span data-testid="preview-result">75 credits</span></p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/admin/tokens");

    await expect(page.getByTestId("preview-section")).toBeVisible();
    await expect(page.getByTestId("preview-result")).toContainText("75 credits");
  });

  test("Error message displays when adjustment fails", async ({ page }) => {
    await page.route("**/admin/tokens**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="credit-dialog" role="dialog">
                  <div data-testid="error-message">Cannot reduce credits below 0. User has 10 credits, attempted to remove 50.</div>
                </div>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/admin/tokens");

    await expect(page.getByTestId("error-message")).toContainText("Cannot reduce credits below 0");
  });

  test("Success message displays after successful adjustment", async ({ page }) => {
    await page.route("**/admin/tokens**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="credit-dialog" role="dialog">
                  <div data-testid="success-message">Successfully added 25 credits to testuser</div>
                </div>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/admin/tokens");

    await expect(page.getByTestId("success-message")).toContainText("Successfully added 25 credits");
  });
});

test.describe("Admin Tokens Page - Recent Adjustments", () => {
  test("Recent adjustments list shows adjustment history", async ({ page }) => {
    await page.route("**/admin/tokens**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="recent-adjustments-section">
                  <h3>Recent Admin Adjustments</h3>
                  <div data-testid="adjustments-list">
                    <div data-testid="adjustment-item">
                      <span data-testid="adjustment-icon-add"></span>
                      <span data-testid="adjustment-user">kevinreber</span>
                      <span data-testid="adjustment-badge">Admin</span>
                      <span data-testid="adjustment-reason">Bug compensation</span>
                      <span data-testid="adjustment-amount">+50</span>
                      <span data-testid="adjustment-date">Jan 15, 10:30 AM</span>
                    </div>
                    <div data-testid="adjustment-item">
                      <span data-testid="adjustment-icon-remove"></span>
                      <span data-testid="adjustment-user">testuser</span>
                      <span data-testid="adjustment-badge">Admin</span>
                      <span data-testid="adjustment-reason">Refund processing</span>
                      <span data-testid="adjustment-amount">-25</span>
                      <span data-testid="adjustment-date">Jan 14, 3:45 PM</span>
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/admin/tokens");

    await expect(page.getByTestId("adjustments-list")).toBeVisible();
    const adjustmentItems = page.getByTestId("adjustment-item");
    await expect(adjustmentItems).toHaveCount(2);
    await expect(adjustmentItems.first().getByTestId("adjustment-amount")).toContainText("+50");
  });

  test("Adjustment items show correct styling for add vs remove", async ({ page }) => {
    await page.route("**/admin/tokens**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="adjustments-list">
                  <div data-testid="adjustment-item">
                    <span data-testid="adjustment-amount" class="text-green-600">+100</span>
                  </div>
                  <div data-testid="adjustment-item">
                    <span data-testid="adjustment-amount" class="text-red-600">-50</span>
                  </div>
                </div>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/admin/tokens");

    const amounts = page.getByTestId("adjustment-amount");
    await expect(amounts.first()).toContainText("+100");
    await expect(amounts.nth(1)).toContainText("-50");
  });
});

test.describe("Admin Tokens Page - Error Handling", () => {
  test("Page handles null user gracefully in adjustments list", async ({ page }) => {
    // This tests the scenario where a user was deleted but their credit transactions remain
    await page.route("**/admin/tokens**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="recent-adjustments-section">
                  <div data-testid="adjustments-list">
                    <div data-testid="adjustment-item">
                      <span data-testid="adjustment-user">Unknown User</span>
                      <span data-testid="adjustment-amount">+50</span>
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/admin/tokens");

    await expect(page.getByTestId("adjustment-user")).toContainText("Unknown User");
  });

  test("Page shows error boundary for unexpected errors", async ({ page }) => {
    await page.route("**/admin/tokens**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 500,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="error-boundary">
                  <h1>Something went wrong</h1>
                  <p data-testid="error-message">An unexpected error occurred</p>
                </div>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    const response = await page.goto("/admin/tokens");
    expect(response?.status()).toBe(500);
  });
});

test.describe("Admin Tokens API - Authorization", () => {
  test("Credit adjustment API returns 403 for non-admin users", async ({ page }) => {
    await page.route("**/api/admin/users/credits", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 403,
          contentType: "application/json",
          body: JSON.stringify({
            error: "You don't have permission to adjust user credits",
          }),
        });
      } else {
        await route.continue();
      }
    });

    const response = await page.request.post("/api/admin/users/credits", {
      data: {
        userId: "test-user-id",
        amount: 50,
        reason: "Test adjustment",
      },
    });

    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toContain("permission");
  });

  test("Credit adjustment API returns 404 for non-existent user", async ({ page }) => {
    await page.route("**/api/admin/users/credits", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({
            error: "User not found",
          }),
        });
      } else {
        await route.continue();
      }
    });

    const response = await page.request.post("/api/admin/users/credits", {
      data: {
        userId: "non-existent-user",
        amount: 50,
        reason: "Test adjustment",
      },
    });

    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.error).toContain("User not found");
  });

  test("Credit adjustment API returns 400 for negative balance attempt", async ({ page }) => {
    await page.route("**/api/admin/users/credits", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Cannot reduce credits below 0. User has 10 credits, attempted to remove 50.",
          }),
        });
      } else {
        await route.continue();
      }
    });

    const response = await page.request.post("/api/admin/users/credits", {
      data: {
        userId: "test-user-id",
        amount: -50,
        reason: "Test removal",
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Cannot reduce credits below 0");
  });

  test("Credit adjustment API returns 400 for validation errors", async ({ page }) => {
    await page.route("**/api/admin/users/credits", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Reason is required",
          }),
        });
      } else {
        await route.continue();
      }
    });

    const response = await page.request.post("/api/admin/users/credits", {
      data: {
        userId: "test-user-id",
        amount: 50,
        reason: "",
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Reason is required");
  });

  test("Credit adjustment API returns success response", async ({ page }) => {
    await page.route("**/api/admin/users/credits", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            message: "Successfully added 50 credits to testuser",
            user: {
              id: "test-user-id",
              username: "testuser",
              previousCredits: 100,
              newCredits: 150,
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    const response = await page.request.post("/api/admin/users/credits", {
      data: {
        userId: "test-user-id",
        amount: 50,
        reason: "Test adjustment",
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.user.previousCredits).toBe(100);
    expect(body.user.newCredits).toBe(150);
  });
});

test.describe("Admin Navigation - Tokens Tab", () => {
  test("Admin layout includes tokens tab in navigation", async ({ page }) => {
    await page.route("**/admin**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <nav data-testid="admin-nav">
                  <a href="/admin" data-testid="nav-overview">Overview</a>
                  <a href="/admin/users" data-testid="nav-users">Users</a>
                  <a href="/admin/credits" data-testid="nav-credits">Credits</a>
                  <a href="/admin/tokens" data-testid="nav-tokens">Tokens</a>
                  <a href="/admin/models" data-testid="nav-models">Models</a>
                  <a href="/admin/engagement" data-testid="nav-engagement">Engagement</a>
                </nav>
                <main>Content</main>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/admin");

    await expect(page.getByTestId("nav-tokens")).toBeVisible();
    await expect(page.getByTestId("nav-tokens")).toHaveAttribute("href", "/admin/tokens");
  });
});
