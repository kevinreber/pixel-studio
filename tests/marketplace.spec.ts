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
  test("Search input accepts text", async ({ page }) => {
    await page.goto("/marketplace");

    // Fill search input
    const searchInput = page.getByPlaceholder(/search prompts/i);
    await searchInput.fill("landscape");

    // Verify input has the value
    await expect(searchInput).toHaveValue("landscape");
  });

  test("Search button is clickable", async ({ page }) => {
    await page.goto("/marketplace");

    // Fill search input and submit
    await page.getByPlaceholder(/search prompts/i).fill("landscape");
    const searchButton = page.getByRole("button", { name: /search/i });

    // Button should be visible and enabled
    await expect(searchButton).toBeVisible();
    await expect(searchButton).toBeEnabled();
  });

  test("Sort dropdown has options", async ({ page }) => {
    await page.goto("/marketplace");

    // Click the sort dropdown (second combobox)
    const sortCombobox = page.getByRole("combobox").nth(1);
    await sortCombobox.click();

    // Should show sort options
    await expect(page.getByRole("option", { name: /newest/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /popular/i })).toBeVisible();
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

    // Should not return 200 (success) when not authenticated
    expect(response.status()).not.toBe(200);
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

    // Should not return 200 (success) when not authenticated
    expect(response.status()).not.toBe(200);
  });
});
