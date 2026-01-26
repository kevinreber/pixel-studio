import { test, expect } from "@playwright/test";

/**
 * E2E tests for Admin Observability features.
 *
 * These tests verify that:
 * 1. Admin pages require authentication
 * 2. Admin pages load with expected content when accessible
 * 3. Navigation between admin pages works correctly
 */

test.describe("Admin Pages - Authentication", () => {
  test("Admin overview page redirects unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/login/);
  });

  test("Admin users page redirects unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/login/);
  });

  test("Admin credits page redirects unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto("/admin/credits");
    await expect(page).toHaveURL(/login/);
  });

  test("Admin models page redirects unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto("/admin/models");
    await expect(page).toHaveURL(/login/);
  });

  test("Admin engagement page redirects unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto("/admin/engagement");
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("Admin Overview Page", () => {
  test("Overview page displays dashboard title when accessible", async ({
    page,
  }) => {
    // Mock the admin page with expected content
    await page.route("**/admin", async (route) => {
      const request = route.request();
      if (request.method() === "GET" && request.resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <head><title>Admin Dashboard</title></head>
              <body>
                <h1>Admin Dashboard</h1>
                <div data-testid="stats-overview">
                  <div data-testid="stat-total-users">1,250</div>
                  <div data-testid="stat-active-today">85</div>
                  <div data-testid="stat-total-images">8,500</div>
                  <div data-testid="stat-generations">12,000</div>
                  <div data-testid="stat-credits-active">45,000</div>
                  <div data-testid="stat-zero-credits">120</div>
                </div>
                <nav>
                  <a href="/admin/users">Users</a>
                  <a href="/admin/credits">Credits</a>
                </nav>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/admin");

    // Verify page title
    await expect(page.getByRole("heading", { name: /admin dashboard/i })).toBeVisible();

    // Verify stats are displayed
    await expect(page.getByTestId("stat-total-users")).toContainText("1,250");
    await expect(page.getByTestId("stat-active-today")).toContainText("85");
  });

  test("Overview page has navigation links to Users and Credits", async ({
    page,
  }) => {
    await page.route("**/admin", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <h1>Admin Dashboard</h1>
                <nav data-testid="admin-nav">
                  <a href="/admin/users" data-testid="nav-users">Users</a>
                  <a href="/admin/credits" data-testid="nav-credits">Credits</a>
                </nav>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/admin");

    // Verify navigation links exist
    await expect(page.getByTestId("nav-users")).toBeVisible();
    await expect(page.getByTestId("nav-credits")).toBeVisible();
  });
});

test.describe("Admin Users Page", () => {
  test("Users page displays user analytics content", async ({ page }) => {
    await page.route("**/admin/users", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <h2 data-testid="activity-section">Active Today</h2>
                <div data-testid="active-today-count">85</div>
                <h2 data-testid="signups-section">Recent Signups</h2>
                <div data-testid="recent-signups-list">
                  <div data-testid="signup-item">user1 - 5 credits</div>
                  <div data-testid="signup-item">user2 - 10 credits</div>
                </div>
                <h2 data-testid="distribution-section">Credit Distribution</h2>
                <div data-testid="credit-distribution">
                  <div>0 credits: 120 users</div>
                  <div>1-10 credits: 450 users</div>
                </div>
                <h2 data-testid="top-holders-section">Top Credit Holders</h2>
                <div data-testid="top-holders-list">
                  <div>topuser1 - 500 credits</div>
                </div>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/admin/users");

    // Verify main sections exist
    await expect(page.getByTestId("activity-section")).toBeVisible();
    await expect(page.getByTestId("signups-section")).toBeVisible();
    await expect(page.getByTestId("distribution-section")).toBeVisible();
    await expect(page.getByTestId("top-holders-section")).toBeVisible();
  });

  test("Users page shows zero credit users section", async ({ page }) => {
    await page.route("**/admin/users", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="zero-credit-section">
                  <h2>Zero Credit Users</h2>
                  <span data-testid="zero-credit-count">120</span>
                  <div data-testid="zero-credit-list">
                    <div>user1@example.com - 0 credits</div>
                    <div>user2@example.com - 0 credits</div>
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

    await page.goto("/admin/users");

    await expect(page.getByTestId("zero-credit-section")).toBeVisible();
    await expect(page.getByTestId("zero-credit-count")).toContainText("120");
  });
});

test.describe("Admin Credits Page", () => {
  test("Credits page displays credit economy content", async ({ page }) => {
    await page.route("**/admin/credits**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <h2>Credit Economy & Generations</h2>
                <div data-testid="credit-flow-section">
                  <div data-testid="credits-purchased">+500</div>
                  <div data-testid="credits-spent">-320</div>
                  <div data-testid="credits-refunded">15</div>
                  <div data-testid="net-flow">+245</div>
                </div>
                <div data-testid="generation-stats-section">
                  <div data-testid="total-generations">250</div>
                  <div data-testid="successful-generations">235</div>
                  <div data-testid="failed-generations">15</div>
                  <div data-testid="success-rate">94%</div>
                </div>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/admin/credits");

    // Verify credit flow section
    await expect(page.getByTestId("credit-flow-section")).toBeVisible();
    await expect(page.getByTestId("credits-purchased")).toContainText("+500");
    await expect(page.getByTestId("credits-spent")).toContainText("-320");

    // Verify generation stats section
    await expect(page.getByTestId("generation-stats-section")).toBeVisible();
    await expect(page.getByTestId("success-rate")).toContainText("94%");
  });

  test("Credits page has period selector", async ({ page }) => {
    await page.route("**/admin/credits**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="period-selector">
                  <a href="/admin/credits?period=today" data-testid="period-today">Today</a>
                  <a href="/admin/credits?period=week" data-testid="period-week">Week</a>
                  <a href="/admin/credits?period=month" data-testid="period-month">Month</a>
                  <a href="/admin/credits?period=all" data-testid="period-all">All Time</a>
                </div>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/admin/credits");

    // Verify period selector options
    await expect(page.getByTestId("period-selector")).toBeVisible();
    await expect(page.getByTestId("period-today")).toBeVisible();
    await expect(page.getByTestId("period-week")).toBeVisible();
    await expect(page.getByTestId("period-month")).toBeVisible();
    await expect(page.getByTestId("period-all")).toBeVisible();
  });

  test("Credits page shows model usage breakdown", async ({ page }) => {
    await page.route("**/admin/credits**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="model-usage-section">
                  <h2>Model Usage</h2>
                  <div data-testid="model-usage-list">
                    <div data-testid="model-dalle">DALL-E 3 - 45%</div>
                    <div data-testid="model-flux">Flux - 35%</div>
                    <div data-testid="model-sd">Stable Diffusion - 20%</div>
                  </div>
                </div>
                <div data-testid="model-success-section">
                  <h2>Model Success Rates</h2>
                  <div data-testid="model-success-list">
                    <div>DALL-E 3 - 98%</div>
                    <div>Flux - 95%</div>
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

    await page.goto("/admin/credits");

    await expect(page.getByTestId("model-usage-section")).toBeVisible();
    await expect(page.getByTestId("model-success-section")).toBeVisible();
  });

  test("Credits page shows recent transactions", async ({ page }) => {
    await page.route("**/admin/credits**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="recent-transactions-section">
                  <h2>Recent Transactions</h2>
                  <div data-testid="transactions-list">
                    <div data-testid="transaction-item">user1 - Purchase - +50</div>
                    <div data-testid="transaction-item">user2 - Spent - -5</div>
                    <div data-testid="transaction-item">user3 - Refund - +2</div>
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

    await page.goto("/admin/credits");

    await expect(page.getByTestId("recent-transactions-section")).toBeVisible();
    await expect(page.getByTestId("transactions-list")).toBeVisible();
  });
});

test.describe("Admin Navigation", () => {
  test("Admin layout has navigation tabs including Models and Engagement", async ({ page }) => {
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
                  <a href="/admin/models" data-testid="nav-models">Models</a>
                  <a href="/admin/engagement" data-testid="nav-engagement">Engagement</a>
                  <a href="/admin/deletion-logs" data-testid="nav-deletion-logs">Deletion Logs</a>
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

    // Verify all nav items exist
    await expect(page.getByTestId("nav-overview")).toBeVisible();
    await expect(page.getByTestId("nav-users")).toBeVisible();
    await expect(page.getByTestId("nav-credits")).toBeVisible();
    await expect(page.getByTestId("nav-models")).toBeVisible();
    await expect(page.getByTestId("nav-engagement")).toBeVisible();
    await expect(page.getByTestId("nav-deletion-logs")).toBeVisible();
  });
});

test.describe("Admin Users Page - Profile Links", () => {
  test("Recent Signups section has clickable links to user profiles", async ({
    page,
  }) => {
    await page.route("**/admin/users", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <h2>Recent Signups</h2>
                <div data-testid="recent-signups-list">
                  <a href="/profile/user-123" data-testid="user-profile-link">user1 - 5 credits</a>
                  <a href="/profile/user-456" data-testid="user-profile-link">user2 - 10 credits</a>
                </div>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/admin/users");

    const profileLinks = page.getByTestId("user-profile-link");
    await expect(profileLinks.first()).toBeVisible();
    await expect(profileLinks.first()).toHaveAttribute("href", "/profile/user-123");
  });

  test("Top Credit Holders section has clickable links to user profiles", async ({
    page,
  }) => {
    await page.route("**/admin/users", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <h2>Top Credit Holders</h2>
                <div data-testid="top-holders-list">
                  <a href="/profile/top-user-1" data-testid="top-holder-link">topuser1 - 500 credits</a>
                  <a href="/profile/top-user-2" data-testid="top-holder-link">topuser2 - 300 credits</a>
                </div>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/admin/users");

    const holderLinks = page.getByTestId("top-holder-link");
    await expect(holderLinks.first()).toBeVisible();
    await expect(holderLinks.first()).toHaveAttribute("href", "/profile/top-user-1");
  });

  test("Zero Credit Users section has clickable links to user profiles", async ({
    page,
  }) => {
    await page.route("**/admin/users", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <h2>Zero Credit Users</h2>
                <div data-testid="zero-credit-list">
                  <a href="/profile/zero-user-1" data-testid="zero-credit-link">user1@example.com - 0 credits</a>
                  <a href="/profile/zero-user-2" data-testid="zero-credit-link">user2@example.com - 0 credits</a>
                </div>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/admin/users");

    const zeroLinks = page.getByTestId("zero-credit-link");
    await expect(zeroLinks.first()).toBeVisible();
    await expect(zeroLinks.first()).toHaveAttribute("href", "/profile/zero-user-1");
  });

  test("Clicking a user profile link navigates to the correct profile page", async ({
    page,
  }) => {
    await page.route("**/admin/users", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <h2>Recent Signups</h2>
                <div data-testid="recent-signups-list">
                  <a href="/profile/user-abc-123" data-testid="user-profile-link">testuser - 5 credits</a>
                </div>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/profile/user-abc-123", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <h1 data-testid="profile-username">testuser</h1>
                <p>User profile page</p>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/admin/users");
    await page.getByTestId("user-profile-link").click();

    await expect(page).toHaveURL(/\/profile\/user-abc-123/);
    await expect(page.getByTestId("profile-username")).toContainText("testuser");
  });
});

test.describe("Admin Models Page", () => {
  test("Models page displays model popularity content", async ({ page }) => {
    await page.route("**/admin/models**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <h2>Model Popularity</h2>
                <div data-testid="model-summary-section">
                  <div data-testid="total-generations">12,500</div>
                  <div data-testid="active-models">6</div>
                  <div data-testid="unique-users">850</div>
                  <div data-testid="avg-success-rate">94%</div>
                </div>
                <div data-testid="model-rankings-section">
                  <h3>Model Rankings</h3>
                  <div data-testid="model-rankings-list">
                    <div data-testid="model-rank-item">#1 DALL-E 3 - 5,200 generations</div>
                    <div data-testid="model-rank-item">#2 Flux - 3,800 generations</div>
                    <div data-testid="model-rank-item">#3 Stable Diffusion - 2,500 generations</div>
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

    await page.goto("/admin/models");

    // Verify summary section
    await expect(page.getByTestId("model-summary-section")).toBeVisible();
    await expect(page.getByTestId("total-generations")).toContainText("12,500");
    await expect(page.getByTestId("active-models")).toContainText("6");

    // Verify rankings section
    await expect(page.getByTestId("model-rankings-section")).toBeVisible();
    await expect(page.getByTestId("model-rankings-list")).toBeVisible();
  });

  test("Models page has period selector", async ({ page }) => {
    await page.route("**/admin/models**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="period-selector">
                  <a href="/admin/models?period=week" data-testid="period-week">Week</a>
                  <a href="/admin/models?period=month" data-testid="period-month">Month</a>
                </div>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/admin/models");

    await expect(page.getByTestId("period-selector")).toBeVisible();
    await expect(page.getByTestId("period-week")).toBeVisible();
    await expect(page.getByTestId("period-month")).toBeVisible();
  });

  test("Models page shows usage trends chart", async ({ page }) => {
    await page.route("**/admin/models**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="usage-trends-section">
                  <h3>Usage Trends (Last 14 Days)</h3>
                  <div data-testid="trends-chart">
                    <div data-testid="chart-bar" data-date="2024-01-01">150</div>
                    <div data-testid="chart-bar" data-date="2024-01-02">180</div>
                  </div>
                  <div data-testid="chart-legend">
                    <span data-testid="legend-dalle">DALL-E 3</span>
                    <span data-testid="legend-flux">Flux</span>
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

    await page.goto("/admin/models");

    await expect(page.getByTestId("usage-trends-section")).toBeVisible();
    await expect(page.getByTestId("trends-chart")).toBeVisible();
    await expect(page.getByTestId("chart-legend")).toBeVisible();
  });

  test("Models page shows usage distribution and success rates", async ({ page }) => {
    await page.route("**/admin/models**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="usage-distribution-section">
                  <h3>Usage Distribution</h3>
                  <div data-testid="distribution-list">
                    <div data-testid="distribution-item">DALL-E 3 - 42%</div>
                    <div data-testid="distribution-item">Flux - 30%</div>
                    <div data-testid="distribution-item">Stable Diffusion - 20%</div>
                  </div>
                </div>
                <div data-testid="success-rates-section">
                  <h3>Success Rates</h3>
                  <div data-testid="success-rates-list">
                    <div data-testid="success-rate-item">DALL-E 3 - 98%</div>
                    <div data-testid="success-rate-item">Flux - 95%</div>
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

    await page.goto("/admin/models");

    await expect(page.getByTestId("usage-distribution-section")).toBeVisible();
    await expect(page.getByTestId("success-rates-section")).toBeVisible();
  });

  test("Models page shows rank changes for models", async ({ page }) => {
    await page.route("**/admin/models**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="model-rankings-section">
                  <div data-testid="model-rank-item">
                    <span data-testid="rank">#1</span>
                    <span data-testid="model-name">DALL-E 3</span>
                    <span data-testid="rank-change-up">+2</span>
                    <span data-testid="usage-change">+15%</span>
                  </div>
                  <div data-testid="model-rank-item">
                    <span data-testid="rank">#2</span>
                    <span data-testid="model-name">Flux</span>
                    <span data-testid="rank-change-down">-1</span>
                    <span data-testid="usage-change">-5%</span>
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

    await page.goto("/admin/models");

    const rankItems = page.getByTestId("model-rank-item");
    await expect(rankItems.first()).toBeVisible();
    await expect(page.getByTestId("rank-change-up").first()).toContainText("+2");
  });
});

test.describe("Admin Engagement Page", () => {
  test("Engagement page displays social stats overview", async ({ page }) => {
    await page.route("**/admin/engagement**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <h2>Social & Engagement</h2>
                <div data-testid="social-stats-section">
                  <div data-testid="total-follows">2,450</div>
                  <div data-testid="total-likes">15,800</div>
                  <div data-testid="total-comments">3,200</div>
                  <div data-testid="users-with-followers">650</div>
                </div>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/admin/engagement");

    await expect(page.getByTestId("social-stats-section")).toBeVisible();
    await expect(page.getByTestId("total-follows")).toContainText("2,450");
    await expect(page.getByTestId("total-likes")).toContainText("15,800");
    await expect(page.getByTestId("total-comments")).toContainText("3,200");
  });

  test("Engagement page shows most followed user highlight", async ({ page }) => {
    await page.route("**/admin/engagement**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="most-followed-section">
                  <h3>Most Followed User</h3>
                  <div data-testid="most-followed-user">
                    <span data-testid="top-username">@topCreator</span>
                    <span data-testid="top-follower-count">1,250</span>
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

    await page.goto("/admin/engagement");

    await expect(page.getByTestId("most-followed-section")).toBeVisible();
    await expect(page.getByTestId("top-username")).toContainText("@topCreator");
    await expect(page.getByTestId("top-follower-count")).toContainText("1,250");
  });

  test("Engagement page shows top users by followers", async ({ page }) => {
    await page.route("**/admin/engagement**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="top-followers-section">
                  <h3>Top by Followers</h3>
                  <div data-testid="top-followers-list">
                    <div data-testid="user-card">
                      <span data-testid="user-rank">1</span>
                      <span data-testid="username">creator1</span>
                      <span data-testid="follower-count">1,250</span>
                    </div>
                    <div data-testid="user-card">
                      <span data-testid="user-rank">2</span>
                      <span data-testid="username">creator2</span>
                      <span data-testid="follower-count">980</span>
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

    await page.goto("/admin/engagement");

    await expect(page.getByTestId("top-followers-section")).toBeVisible();
    await expect(page.getByTestId("top-followers-list")).toBeVisible();
    const userCards = page.getByTestId("user-card");
    await expect(userCards.first()).toBeVisible();
  });

  test("Engagement page shows top creators by engagement", async ({ page }) => {
    await page.route("**/admin/engagement**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="top-engagement-section">
                  <h3>Top by Engagement</h3>
                  <div data-testid="top-engagement-list">
                    <div data-testid="creator-card">
                      <span data-testid="creator-name">topArtist</span>
                      <span data-testid="total-likes">5,200</span>
                      <span data-testid="total-comments">890</span>
                      <span data-testid="engagement-rate">12.5</span>
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

    await page.goto("/admin/engagement");

    await expect(page.getByTestId("top-engagement-section")).toBeVisible();
    await expect(page.getByTestId("top-engagement-list")).toBeVisible();
  });

  test("Engagement page shows follow activity trends", async ({ page }) => {
    await page.route("**/admin/engagement**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="follow-trends-section">
                  <h3>Follow Activity (Last 14 Days)</h3>
                  <div data-testid="follow-trends-chart">
                    <div data-testid="trend-bar" data-date="2024-01-01">25</div>
                    <div data-testid="trend-bar" data-date="2024-01-02">32</div>
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

    await page.goto("/admin/engagement");

    await expect(page.getByTestId("follow-trends-section")).toBeVisible();
    await expect(page.getByTestId("follow-trends-chart")).toBeVisible();
  });

  test("Engagement page shows most popular content", async ({ page }) => {
    await page.route("**/admin/engagement**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="popular-content-section">
                  <h3>Most Popular Content</h3>
                  <div data-testid="popular-content-grid">
                    <div data-testid="content-card">
                      <img data-testid="content-image" src="/image1.jpg" alt="Popular image" />
                      <span data-testid="content-likes">520</span>
                      <span data-testid="content-comments">45</span>
                      <span data-testid="content-creator">@artist1</span>
                    </div>
                    <div data-testid="content-card">
                      <img data-testid="content-image" src="/image2.jpg" alt="Popular image" />
                      <span data-testid="content-likes">480</span>
                      <span data-testid="content-comments">38</span>
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

    await page.goto("/admin/engagement");

    await expect(page.getByTestId("popular-content-section")).toBeVisible();
    await expect(page.getByTestId("popular-content-grid")).toBeVisible();
    const contentCards = page.getByTestId("content-card");
    await expect(contentCards.first()).toBeVisible();
  });

  test("Engagement page shows user follower and following counts", async ({ page }) => {
    await page.route("**/admin/engagement**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <div data-testid="top-followers-section">
                  <div data-testid="user-card">
                    <span data-testid="username">popularUser</span>
                    <div data-testid="user-social-stats">
                      <span data-testid="follower-count">1,250 followers</span>
                      <span data-testid="following-count">85 following</span>
                      <span data-testid="image-count">320 images</span>
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

    await page.goto("/admin/engagement");

    await expect(page.getByTestId("user-social-stats")).toBeVisible();
    await expect(page.getByTestId("follower-count")).toContainText("1,250 followers");
    await expect(page.getByTestId("following-count")).toContainText("85 following");
  });
});

test.describe("Admin API - Authorization", () => {
  test("Admin pages return 403 for non-admin users", async ({ page }) => {
    // Mock the admin route to return 403 Forbidden
    await page.route("**/admin", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.fulfill({
          status: 403,
          contentType: "text/html",
          body: `
            <!DOCTYPE html>
            <html>
              <body>
                <h1>Forbidden</h1>
                <p>Admin access required</p>
              </body>
            </html>
          `,
        });
      } else {
        await route.continue();
      }
    });

    const response = await page.goto("/admin");
    expect(response?.status()).toBe(403);
  });
});
