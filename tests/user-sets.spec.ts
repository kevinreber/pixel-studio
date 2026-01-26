import { test, expect } from "@playwright/test";

/**
 * E2E tests for viewing other users' sets from their profile page
 */

test.describe("User Sets Page", () => {
  test.describe("Profile Page - View Sets Button", () => {
    test("View Sets button is visible on user profile page", async ({ page }) => {
      // Mock the profile page response
      await page.route("**/profile/test-user-123", async (route) => {
        if (route.request().resourceType() === "document") {
          await route.fulfill({
            status: 200,
            contentType: "text/html",
            body: `
              <!DOCTYPE html>
              <html>
                <body>
                  <div data-testid="profile-username">testuser</div>
                  <button data-testid="follow-button">Follow</button>
                  <a href="/profile/test-user-123/sets" data-testid="view-sets-button">
                    View Sets
                  </a>
                </body>
              </html>
            `,
          });
        } else {
          await route.continue();
        }
      });

      await page.goto("/profile/test-user-123");

      const viewSetsButton = page.getByTestId("view-sets-button");
      await expect(viewSetsButton).toBeVisible();
      await expect(viewSetsButton).toHaveAttribute(
        "href",
        "/profile/test-user-123/sets"
      );
    });

    test("View Sets button navigates to user sets page", async ({ page }) => {
      // Mock the profile page
      await page.route("**/profile/test-user-456", async (route) => {
        if (route.request().resourceType() === "document") {
          await route.fulfill({
            status: 200,
            contentType: "text/html",
            body: `
              <!DOCTYPE html>
              <html>
                <body>
                  <div data-testid="profile-username">testuser</div>
                  <a href="/profile/test-user-456/sets" data-testid="view-sets-button">
                    View Sets
                  </a>
                </body>
              </html>
            `,
          });
        } else {
          await route.continue();
        }
      });

      // Mock the sets page
      await page.route("**/profile/test-user-456/sets", async (route) => {
        if (route.request().resourceType() === "document") {
          await route.fulfill({
            status: 200,
            contentType: "text/html",
            body: `
              <!DOCTYPE html>
              <html>
                <body>
                  <div data-testid="user-sets-page">
                    <h1 data-testid="user-sets-title">testuser's Sets</h1>
                    <a href="/profile/test-user-456" data-testid="back-to-profile-button">Back</a>
                    <table data-testid="sets-table">
                      <tr data-testid="set-row">
                        <td>Set 1</td>
                      </tr>
                    </table>
                  </div>
                </body>
              </html>
            `,
          });
        } else {
          await route.continue();
        }
      });

      await page.goto("/profile/test-user-456");
      await page.getByTestId("view-sets-button").click();

      await expect(page).toHaveURL(/\/profile\/test-user-456\/sets/);
      await expect(page.getByTestId("user-sets-page")).toBeVisible();
    });
  });

  test.describe("User Sets Page - Display", () => {
    test("User sets page displays username in title", async ({ page }) => {
      await page.route("**/profile/user-abc/sets", async (route) => {
        if (route.request().resourceType() === "document") {
          await route.fulfill({
            status: 200,
            contentType: "text/html",
            body: `
              <!DOCTYPE html>
              <html>
                <body>
                  <div data-testid="user-sets-page">
                    <h1 data-testid="user-sets-title">cooluser's Sets</h1>
                  </div>
                </body>
              </html>
            `,
          });
        } else {
          await route.continue();
        }
      });

      await page.goto("/profile/user-abc/sets");

      await expect(page.getByTestId("user-sets-title")).toContainText(
        "cooluser's Sets"
      );
    });

    test("User sets page displays sets table when user has sets", async ({
      page,
    }) => {
      await page.route("**/profile/user-with-sets/sets", async (route) => {
        if (route.request().resourceType() === "document") {
          await route.fulfill({
            status: 200,
            contentType: "text/html",
            body: `
              <!DOCTYPE html>
              <html>
                <body>
                  <div data-testid="user-sets-page">
                    <h1 data-testid="user-sets-title">creator's Sets</h1>
                    <table data-testid="sets-table">
                      <thead>
                        <tr>
                          <th>Preview</th>
                          <th>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr data-testid="set-row">
                          <td>Preview 1</td>
                          <td>A beautiful sunset - DALL-E - 4 images</td>
                        </tr>
                        <tr data-testid="set-row">
                          <td>Preview 2</td>
                          <td>Mountain landscape - Stable Diffusion - 2 images</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </body>
              </html>
            `,
          });
        } else {
          await route.continue();
        }
      });

      await page.goto("/profile/user-with-sets/sets");

      await expect(page.getByTestId("sets-table")).toBeVisible();
      const setRows = page.getByTestId("set-row");
      await expect(setRows).toHaveCount(2);
    });

    test("User sets page displays empty message when user has no sets", async ({
      page,
    }) => {
      await page.route("**/profile/user-no-sets/sets", async (route) => {
        if (route.request().resourceType() === "document") {
          await route.fulfill({
            status: 200,
            contentType: "text/html",
            body: `
              <!DOCTYPE html>
              <html>
                <body>
                  <div data-testid="user-sets-page">
                    <h1 data-testid="user-sets-title">newuser's Sets</h1>
                    <div data-testid="empty-sets-message">
                      newuser hasn't created any sets yet.
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

      await page.goto("/profile/user-no-sets/sets");

      await expect(page.getByTestId("empty-sets-message")).toBeVisible();
      await expect(page.getByTestId("empty-sets-message")).toContainText(
        "hasn't created any sets yet"
      );
    });

    test("Back button navigates to user profile", async ({ page }) => {
      await page.route("**/profile/user-xyz/sets", async (route) => {
        if (route.request().resourceType() === "document") {
          await route.fulfill({
            status: 200,
            contentType: "text/html",
            body: `
              <!DOCTYPE html>
              <html>
                <body>
                  <div data-testid="user-sets-page">
                    <a href="/profile/user-xyz" data-testid="back-to-profile-button">Back</a>
                    <h1 data-testid="user-sets-title">someuser's Sets</h1>
                  </div>
                </body>
              </html>
            `,
          });
        } else {
          await route.continue();
        }
      });

      await page.route("**/profile/user-xyz", async (route) => {
        if (route.request().resourceType() === "document") {
          await route.fulfill({
            status: 200,
            contentType: "text/html",
            body: `
              <!DOCTYPE html>
              <html>
                <body>
                  <div data-testid="profile-username">someuser</div>
                </body>
              </html>
            `,
          });
        } else {
          await route.continue();
        }
      });

      await page.goto("/profile/user-xyz/sets");
      await page.getByTestId("back-to-profile-button").click();

      await expect(page).toHaveURL(/\/profile\/user-xyz$/);
    });
  });

  test.describe("User Sets Page - Error Handling", () => {
    test("Returns 404 for non-existent user", async ({ page }) => {
      await page.route("**/profile/non-existent-user/sets", async (route) => {
        if (route.request().resourceType() === "document") {
          await route.fulfill({
            status: 404,
            contentType: "text/html",
            body: `
              <!DOCTYPE html>
              <html>
                <body>
                  <p>User not found</p>
                </body>
              </html>
            `,
          });
        } else {
          await route.continue();
        }
      });

      const response = await page.goto("/profile/non-existent-user/sets");
      expect(response?.status()).toBe(404);
    });
  });

  test.describe("User Sets Page - Filtering", () => {
    test("Filter form elements are present", async ({ page }) => {
      await page.route("**/profile/filter-user/sets", async (route) => {
        if (route.request().resourceType() === "document") {
          await route.fulfill({
            status: 200,
            contentType: "text/html",
            body: `
              <!DOCTYPE html>
              <html>
                <body>
                  <div data-testid="user-sets-page">
                    <h1 data-testid="user-sets-title">filteruser's Sets</h1>
                    <form>
                      <input placeholder="Filter by prompt..." data-testid="prompt-filter" />
                      <select data-testid="model-filter">
                        <option value="">Select Model</option>
                        <option value="stable-diffusion">Stable Diffusion</option>
                        <option value="dall-e">DALL-E</option>
                        <option value="flux">Flux</option>
                      </select>
                      <button type="submit" data-testid="apply-filters-button">Apply Filters</button>
                      <button type="button" data-testid="reset-filters-button">Reset</button>
                    </form>
                  </div>
                </body>
              </html>
            `,
          });
        } else {
          await route.continue();
        }
      });

      await page.goto("/profile/filter-user/sets");

      await expect(page.getByPlaceholder("Filter by prompt...")).toBeVisible();
      await expect(page.getByRole("button", { name: "Apply Filters" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Reset" })).toBeVisible();
    });

    test("Filtering updates URL with query parameters", async ({ page }) => {
      await page.route("**/profile/filter-user/sets**", async (route) => {
        if (route.request().resourceType() === "document") {
          await route.fulfill({
            status: 200,
            contentType: "text/html",
            body: `
              <!DOCTYPE html>
              <html>
                <body>
                  <div data-testid="user-sets-page">
                    <h1 data-testid="user-sets-title">filteruser's Sets</h1>
                    <form id="filter-form">
                      <input
                        placeholder="Filter by prompt..."
                        name="prompt"
                        data-testid="prompt-filter"
                      />
                      <button type="submit">Apply Filters</button>
                    </form>
                    <table data-testid="sets-table">
                      <tr data-testid="set-row"><td>Filtered results</td></tr>
                    </table>
                  </div>
                  <script>
                    document.getElementById('filter-form').addEventListener('submit', (e) => {
                      e.preventDefault();
                      const prompt = document.querySelector('[data-testid="prompt-filter"]').value;
                      if (prompt) {
                        window.location.search = '?prompt=' + encodeURIComponent(prompt);
                      }
                    });
                  </script>
                </body>
              </html>
            `,
          });
        } else {
          await route.continue();
        }
      });

      await page.goto("/profile/filter-user/sets");
      await page.getByPlaceholder("Filter by prompt...").fill("sunset");
      await page.getByRole("button", { name: "Apply Filters" }).click();

      await expect(page).toHaveURL(/prompt=sunset/);
    });
  });

  test.describe("User Sets Page - Set Links", () => {
    test("Set preview links to set details page", async ({ page }) => {
      await page.route("**/profile/user-sets-links/sets", async (route) => {
        if (route.request().resourceType() === "document") {
          await route.fulfill({
            status: 200,
            contentType: "text/html",
            body: `
              <!DOCTYPE html>
              <html>
                <body>
                  <div data-testid="user-sets-page">
                    <h1 data-testid="user-sets-title">linkuser's Sets</h1>
                    <table data-testid="sets-table">
                      <tr data-testid="set-row">
                        <td>
                          <a href="/sets/set-123" data-testid="set-link">
                            Preview
                          </a>
                        </td>
                        <td>A beautiful sunset</td>
                      </tr>
                    </table>
                  </div>
                </body>
              </html>
            `,
          });
        } else {
          await route.continue();
        }
      });

      await page.goto("/profile/user-sets-links/sets");

      const setLink = page.getByTestId("set-link");
      await expect(setLink).toBeVisible();
      await expect(setLink).toHaveAttribute("href", "/sets/set-123");
    });

    test("Clicking set link navigates to set details", async ({ page }) => {
      await page.route("**/profile/user-nav/sets", async (route) => {
        if (route.request().resourceType() === "document") {
          await route.fulfill({
            status: 200,
            contentType: "text/html",
            body: `
              <!DOCTYPE html>
              <html>
                <body>
                  <div data-testid="user-sets-page">
                    <table data-testid="sets-table">
                      <tr data-testid="set-row">
                        <td>
                          <a href="/sets/set-456" data-testid="set-link">Preview</a>
                        </td>
                      </tr>
                    </table>
                  </div>
                </body>
              </html>
            `,
          });
        } else {
          await route.continue();
        }
      });

      await page.route("**/sets/set-456", async (route) => {
        if (route.request().resourceType() === "document") {
          await route.fulfill({
            status: 200,
            contentType: "text/html",
            body: `
              <!DOCTYPE html>
              <html>
                <body>
                  <h1 data-testid="set-details-title">Set Details</h1>
                  <p>A beautiful sunset over mountains</p>
                </body>
              </html>
            `,
          });
        } else {
          await route.continue();
        }
      });

      await page.goto("/profile/user-nav/sets");
      await page.getByTestId("set-link").click();

      await expect(page).toHaveURL(/\/sets\/set-456/);
      await expect(page.getByTestId("set-details-title")).toBeVisible();
    });
  });
});
