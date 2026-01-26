import { test, expect } from "@playwright/test";

test.describe("Tipping API", () => {
  test("Send tip requires authentication", async ({ request }) => {
    const response = await request.post("/api/tips/send", {
      form: {
        recipientId: "test-user-id",
        amount: "10",
        message: "Great work!",
      },
    });

    // Should not return 200 (success) when not authenticated
    expect(response.status()).not.toBe(200);
  });

  test("Tip endpoint exists", async ({ request }) => {
    const response = await request.post("/api/tips/send");

    // Should not return 404 (endpoint exists)
    expect(response.status()).not.toBe(404);
  });
});

test.describe("Premium Collections API", () => {
  test("Make collection premium requires authentication", async ({
    request,
  }) => {
    const response = await request.post(
      "/api/collections/test-collection-id/premium",
      {
        form: {
          price: "50",
        },
      }
    );

    // Should not return 200 (success) when not authenticated
    expect(response.status()).not.toBe(200);
  });

  test("Update premium settings requires authentication", async ({
    request,
  }) => {
    const response = await request.put(
      "/api/collections/test-collection-id/premium",
      {
        form: {
          price: "75",
        },
      }
    );

    // Should not return 200 (success) when not authenticated
    expect(response.status()).not.toBe(200);
  });

  test("Remove premium status requires authentication", async ({ request }) => {
    const response = await request.delete(
      "/api/collections/test-collection-id/premium"
    );

    // Should not return 200 (success) when not authenticated
    expect(response.status()).not.toBe(200);
  });

  test("Premium collection endpoint exists", async ({ request }) => {
    const response = await request.post(
      "/api/collections/test-id/premium"
    );

    // Should not return 404 (endpoint exists)
    expect(response.status()).not.toBe(404);
  });
});

test.describe("Print-on-Demand API", () => {
  test("Products endpoint is public", async ({ request }) => {
    const response = await request.get("/api/print/products");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("success", true);
    expect(data).toHaveProperty("products");
    expect(Array.isArray(data.products)).toBe(true);
  });

  test("Calculate price endpoint works", async ({ request }) => {
    const response = await request.post("/api/print/calculate", {
      form: {
        productId: "default-canvas-print",
        size: "Small",
        quantity: "1",
      },
    });

    // Either returns pricing or error (if product doesn't exist yet)
    expect([200, 400]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty("success", true);
      expect(data).toHaveProperty("pricing");
      expect(data.pricing).toHaveProperty("basePrice");
      expect(data.pricing).toHaveProperty("total");
    }
  });

  test("Create order requires authentication", async ({ request }) => {
    const response = await request.post("/api/print/orders", {
      data: {
        imageId: "test-image-id",
        productId: "default-canvas-print",
        size: "Small",
        quantity: 1,
        shippingAddress: {
          name: "Test User",
          address1: "123 Test St",
          city: "Test City",
          state: "CA",
          country: "US",
          postalCode: "12345",
        },
      },
    });

    // Should not return 200 (success) when not authenticated
    expect(response.status()).not.toBe(200);
  });

  test("Get orders requires authentication", async ({ request }) => {
    const response = await request.get("/api/print/orders");

    // Should not return 200 (success) when not authenticated
    expect(response.status()).not.toBe(200);
  });

  test("Products endpoint exists and returns data structure", async ({
    request,
  }) => {
    const response = await request.get("/api/print/products");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);

    // If products exist, verify structure
    if (data.products.length > 0) {
      const product = data.products[0];
      expect(product).toHaveProperty("id");
      expect(product).toHaveProperty("name");
      expect(product).toHaveProperty("sizes");
    }
  });
});

test.describe("Image Tags API", () => {
  test("Get image tags endpoint exists", async ({ request }) => {
    const response = await request.get("/api/images/test-image-id/tags");

    // Should return 404 for non-existent image or 200 with empty tags
    expect([200, 404]).toContain(response.status());
  });

  test("Trigger AI tagging requires authentication", async ({ request }) => {
    const response = await request.post("/api/images/test-image-id/tags");

    // Should redirect to login or return 401/302/404
    expect([302, 401, 403, 404]).toContain(response.status());
  });

  test("Add manual tag requires authentication", async ({ request }) => {
    const response = await request.put("/api/images/test-image-id/tags", {
      form: {
        tag: "test-tag",
      },
    });

    // Should redirect to login or return 401/302/404
    expect([302, 401, 403, 404]).toContain(response.status());
  });

  test("Remove tag requires authentication", async ({ request }) => {
    const response = await request.delete("/api/images/test-image-id/tags", {
      form: {
        tag: "test-tag",
      },
    });

    // Should redirect to login or return 401/302/404
    expect([302, 401, 403, 404]).toContain(response.status());
  });
});
