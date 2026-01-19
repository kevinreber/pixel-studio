import { test, expect } from "@playwright/test";

test.describe("Marketplace - Public Access", () => {
  test("Marketplace page loads", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(
      page.getByRole("heading", { name: /prompt marketplace/i })
    ).toBeVisible();
  });

  test("Marketplace displays search input", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page.getByPlaceholder(/search prompts/i)).toBeVisible();
  });

  test("Marketplace displays category filter", async ({ page }) => {
    await page.goto("/marketplace");
    // Category select should be visible
    await expect(page.getByRole("combobox").first()).toBeVisible();
  });

  test("Marketplace displays sort options", async ({ page }) => {
    await page.goto("/marketplace");
    // Should have multiple comboboxes (category and sort)
    const comboboxes = page.getByRole("combobox");
    await expect(comboboxes).toHaveCount(2);
  });
});

test.describe("Marketplace - Search and Filter", () => {
  test("Search updates URL params", async ({ page }) => {
    await page.goto("/marketplace");

    // Fill search input and submit
    await page.getByPlaceholder(/search prompts/i).fill("landscape");
    await page.getByRole("button", { name: /search/i }).click();

    // URL should contain query param
    await expect(page).toHaveURL(/query=landscape/);
  });

  test("Sort selection updates URL", async ({ page }) => {
    await page.goto("/marketplace");

    // Click the sort dropdown (second combobox)
    const sortCombobox = page.getByRole("combobox").nth(1);
    await sortCombobox.click();

    // Select "Newest" option
    await page.getByRole("option", { name: /newest/i }).click();

    // URL should update
    await expect(page).toHaveURL(/sortBy=newest/);
  });
});

test.describe("Marketplace API", () => {
  test("Marketplace prompts API returns data", async ({ request }) => {
    const response = await request.get("/api/marketplace/prompts");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("success", true);
    expect(data).toHaveProperty("prompts");
    expect(data).toHaveProperty("total");
    expect(Array.isArray(data.prompts)).toBe(true);
  });

  test("Marketplace API supports search query", async ({ request }) => {
    const response = await request.get("/api/marketplace/prompts?query=test");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("success", true);
    expect(data).toHaveProperty("prompts");
  });

  test("Marketplace API supports category filter", async ({ request }) => {
    const response = await request.get(
      "/api/marketplace/prompts?category=landscape"
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("success", true);
  });

  test("Marketplace API supports sorting", async ({ request }) => {
    const response = await request.get(
      "/api/marketplace/prompts?sortBy=newest"
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("success", true);
  });

  test("Marketplace API supports pagination", async ({ request }) => {
    const response = await request.get(
      "/api/marketplace/prompts?limit=5&offset=0"
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("success", true);
    expect(data.prompts.length).toBeLessThanOrEqual(5);
  });
});

test.describe("Marketplace - Protected Actions", () => {
  test("Purchase prompt requires authentication", async ({ request }) => {
    const response = await request.post(
      "/api/marketplace/prompts/test-id/purchase"
    );

    // Should redirect to login or return 401/302
    expect([302, 401, 403]).toContain(response.status());
  });

  test("Publish prompt requires authentication", async ({ request }) => {
    const response = await request.post("/api/marketplace/prompts", {
      form: {
        title: "Test Prompt",
        prompt: "A test prompt",
        category: "test",
        tags: "test",
        price: "10",
      },
    });

    // Should redirect to login or return 401/302
    expect([302, 401, 403]).toContain(response.status());
  });
});
