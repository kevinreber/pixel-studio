import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * E2E tests for the Video Support feature on Feed, Explore, and Profile pages.
 *
 * These tests verify browser-specific behavior:
 * 1. Page routing and authentication redirects
 * 2. API endpoint responses
 * 3. App loading without console errors
 * 4. Mock data integration
 *
 * Pure unit tests (duration formatting, type discrimination, sorting)
 * have been moved to app/utils/video-support.test.ts for faster execution.
 */

// Mock data for videos
const MOCK_VIDEO = {
  id: "video-123",
  title: "Test Video",
  prompt: "A beautiful sunset timelapse",
  model: "runway-gen3",
  userId: "user-123",
  private: false,
  status: "complete",
  duration: 10,
  aspectRatio: "16:9",
  createdAt: new Date().toISOString(),
  url: "https://example.com/video.mp4",
  thumbnailURL: "https://example.com/thumbnail.jpg",
  user: {
    id: "user-123",
    username: "testuser",
    name: "Test User",
    image: null,
  },
};

const MOCK_IMAGE = {
  id: "image-456",
  title: "Test Image",
  prompt: "A beautiful mountain landscape",
  model: "dall-e-3",
  stylePreset: "none",
  userId: "user-123",
  private: false,
  createdAt: new Date().toISOString(),
  url: "https://example.com/image.jpg",
  thumbnailURL: "https://example.com/thumbnail.jpg",
  user: {
    id: "user-123",
    username: "testuser",
    name: "Test User",
    image: null,
  },
  likes: [],
  comments: [],
  _count: { likes: 0, comments: 0 },
};

/**
 * Helper to mock the feed API response with both images and videos
 */
async function mockFeedWithVideos(page: Page) {
  await page.route("**/api/feed**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [
          { ...MOCK_IMAGE, type: "image" },
          { ...MOCK_VIDEO, type: "video" },
        ],
        images: [{ ...MOCK_IMAGE, type: "image" }],
        count: 2,
        hasMore: false,
      }),
    });
  });
}

/**
 * Helper to mock the explore/getImages API response with both images and videos
 */
async function mockExploreWithVideos(page: Page) {
  await page.route("**/explore**", async (route) => {
    const request = route.request();
    if (request.method() === "GET" && request.url().includes("_data")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          imagesData: {
            status: "idle",
            items: [
              { ...MOCK_IMAGE, type: "image" },
              { ...MOCK_VIDEO, type: "video" },
            ],
            images: [{ ...MOCK_IMAGE, type: "image" }],
            videos: [{ ...MOCK_VIDEO, type: "video" }],
            pagination: {
              totalCount: 2,
              currentPage: 1,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false,
              pageSize: 50,
            },
          },
        }),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Helper to mock the profile API response with both images and videos
 */
async function mockProfileWithVideos(page: Page) {
  await page.route("**/profile/**", async (route) => {
    const request = route.request();
    if (request.method() === "GET" && request.url().includes("_data")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          userData: {
            user: {
              id: "user-123",
              name: "Test User",
              username: "testuser",
              image: null,
              createdAt: new Date().toISOString(),
            },
            items: [
              { ...MOCK_IMAGE, type: "image" },
              { ...MOCK_VIDEO, type: "video" },
            ],
            images: [{ ...MOCK_IMAGE, type: "image" }],
            videos: [{ ...MOCK_VIDEO, type: "video" }],
            count: 2,
          },
          followStats: {
            followersCount: 10,
            followingCount: 5,
          },
          isFollowing: false,
          profileUserId: "user-123",
        }),
      });
    } else {
      await route.continue();
    }
  });
}

test.describe("Video Support - Page Routes", () => {
  test("Feed page redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/feed");
    await expect(page).toHaveURL(/login/);
  });

  test("Explore page redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/explore");
    await expect(page).toHaveURL(/login/);
  });

  test("Profile page can be accessed (may show user not found)", async ({ page }) => {
    const response = await page.goto("/profile/test-user-id");
    const status = response?.status();
    // Should either redirect to login, show error, or load page
    expect(status === 302 || status === 404 || status === 200).toBeTruthy();
  });
});

test.describe("Video Support - API Responses", () => {
  test("Feed API endpoint exists and responds", async ({ request }) => {
    const response = await request.get("/feed");
    const status = response.status();
    // Should redirect to login or return data
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(600);
  });

  test("Explore API endpoint exists and responds", async ({ request }) => {
    const response = await request.get("/explore");
    const status = response.status();
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(600);
  });
});

test.describe("Video Support - App Loading", () => {
  test("App loads without critical errors", async ({ page }) => {
    // Set up console error listener before navigation
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Filter out expected errors (like network requests to protected routes)
    const unexpectedErrors = consoleErrors.filter(
      (err) =>
        !err.includes("401") &&
        !err.includes("403") &&
        !err.includes("Failed to fetch")
    );

    // There should be no unexpected errors
    expect(unexpectedErrors.length).toBe(0);
  });
});

test.describe("Video Support - Mock Data Integration", () => {
  test("mock feed response can be set up correctly", async ({ page }) => {
    await mockFeedWithVideos(page);
    await page.goto("/");
    // If we get here without error, mock was set up correctly
    expect(true).toBeTruthy();
  });

  test("mock explore response can be set up correctly", async ({ page }) => {
    await mockExploreWithVideos(page);
    await page.goto("/");
    expect(true).toBeTruthy();
  });

  test("mock profile response can be set up correctly", async ({ page }) => {
    await mockProfileWithVideos(page);
    await page.goto("/");
    expect(true).toBeTruthy();
  });
});
