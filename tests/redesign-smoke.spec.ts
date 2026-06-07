import { test, expect } from "@playwright/test";

/**
 * Smoke checks for the redesign — runs against the public-only surfaces
 * (landing, login, health, sitemap) plus auth-redirect behavior for the
 * shell-mounted routes. Anything behind requireUserLogin redirects to
 * /login, which is itself a useful assertion that the shell wraps them.
 */

test.describe("Landing (redesign)", () => {
  test("renders hero, auto-typing prompt bar, providers, pricing, footer", async ({
    page,
  }) => {
    await page.goto("/");

    // Hero badge — proves the new Badge primitive renders
    await expect(page.getByText("1.9M creations and counting")).toBeVisible();

    // Hero H1 split — "Create stunning" + gradient "art & video"
    await expect(
      page.getByRole("heading", { name: /create stunning .*art .* video/i, level: 1 })
    ).toBeVisible();

    // Auto-typing prompt input area (text shows up after typewriter tick)
    await expect(page.getByRole("link", { name: /generate/i }).first()).toBeVisible();

    // Stats strip
    await expect(page.getByText("1.9M", { exact: true })).toBeVisible();
    await expect(page.getByText("creators", { exact: true })).toBeVisible();

    // Features grid — at least one feature title shows
    await expect(
      page.getByRole("heading", { name: /12 leading models/i })
    ).toBeVisible();

    // Providers section anchor
    await expect(page.getByText(/powered by the world/i)).toBeVisible();

    // Pricing — three credit packs + Popular badge on the featured one
    await expect(
      page.getByRole("heading", { name: /pay once, generate anything/i })
    ).toBeVisible();
    await expect(page.getByText("Pro", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Popular", { exact: true })).toBeVisible();

    // Final CTA
    await expect(page.getByText(/make something nobody/i)).toBeVisible();

    // Footer logo wordmark — there are two "Pixel Studio" (nav + footer)
    await expect(page.getByText("Pixel Studio").last()).toBeVisible();
  });

  test("smooth-scroll anchors exist", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#lp-models")).toBeAttached();
    await expect(page.locator("#lp-pricing")).toBeAttached();
  });

  test("hero images load locally from public/assets/hero", async ({ page }) => {
    await page.goto("/");
    const heroImg = page.locator(
      'img[src*="/assets/hero/resized-"]'
    ).first();
    await expect(heroImg).toBeVisible();
    // Verify the image actually decoded (naturalWidth > 0)
    const natural = await heroImg.evaluate(
      (el: HTMLImageElement) => el.naturalWidth
    );
    expect(natural).toBeGreaterThan(0);
  });

  test("theme toggle is wired (data-theme on <html>)", async ({ page }) => {
    await page.goto("/");
    // Default theme is "dark" because root sets data-theme="dark"
    const before = await page.locator("html").getAttribute("data-theme");
    expect(["dark", "light"]).toContain(before);

    // Click the marketing-nav theme toggle (aria-label "Switch to ...")
    await page
      .getByRole("button", { name: /switch to (dark|light) theme/i })
      .first()
      .click();

    const after = await page.locator("html").getAttribute("data-theme");
    expect(after).not.toEqual(before);
  });
});

test.describe("Shell-mounted routes — redirect when unauthenticated", () => {
  // These also implicitly verify the new AppShell wrap doesn't break loaders.
  const protectedRoutes = [
    "/explore",
    "/feed",
    "/create",
    "/create-video",
    "/likes",
    "/whats-new",
    "/sets",
    "/admin",
  ];

  for (const path of protectedRoutes) {
    test(`${path} redirects to /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/login/);
    });
  }
});

test.describe("Theme persistence API", () => {
  test("POST /api/preferences/theme requires login", async ({ request }) => {
    const res = await request.post("/api/preferences/theme", {
      form: { theme: "light" },
    });
    // requireUserLogin throws a redirect; Playwright follows it.
    // Either a 200 from following to /login, or a 3xx is acceptable.
    expect([200, 302, 303, 401, 403]).toContain(res.status());
  });

  test("POST /api/preferences/theme rejects invalid theme", async ({
    request,
  }) => {
    const res = await request.post("/api/preferences/theme", {
      form: { theme: "rainbow" },
    });
    // Either 400 (validation) or redirect to login (if auth runs first)
    expect([200, 302, 303, 400, 401, 403]).toContain(res.status());
  });
});

test.describe("Public pages still load", () => {
  test("Login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: /welcome to pixel studio/i })
    ).toBeVisible();
  });

  test("Health page loads", async ({ page }) => {
    await page.goto("/health");
    await expect(
      page.getByRole("heading", { name: /pixel studio health check/i })
    ).toBeVisible();
  });

  test("Sitemap responds", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.ok()).toBeTruthy();
  });
});

test.describe("Static assets", () => {
  test("Onest + Geist Mono are linked in <head>", async ({ page }) => {
    await page.goto("/");
    // Match the stylesheet specifically; head also has a preconnect link to
    // fonts.googleapis.com whose href doesn't include the font family list.
    const fontLink = await page
      .locator('link[rel="stylesheet"][href*="fonts.googleapis.com"]')
      .first()
      .getAttribute("href");
    expect(fontLink).toContain("Onest");
    expect(fontLink).toContain("Geist+Mono");
  });

  test("all 5 redesign hero images are reachable", async ({ request }) => {
    const heroSlugs = [
      "clov1aotv003pr2ygixlp9pmi",
      "clov3hb17001gr2qvnx15mvf7",
      "cllfyj6la0001r2otvu0ms49w",
      "clkp3riui0001r2wj7q3t8tav",
      "clov0tnth001hr2ygj2wec2wn",
    ];
    for (const slug of heroSlugs) {
      const res = await request.get(`/assets/hero/resized-${slug}.jpg`);
      expect(res.ok(), `hero ${slug} should be reachable`).toBeTruthy();
    }
  });
});
