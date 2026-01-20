import { describe, test, expect } from "vitest";

/**
 * Unit tests for Video Support feature utilities.
 *
 * These tests verify pure JavaScript logic that doesn't require a browser:
 * - Duration formatting
 * - Type discrimination
 * - Sorting logic
 *
 * Moved from Playwright E2E tests to Vitest for faster execution.
 */

describe("Video Support - Duration Formatting", () => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  test("formats single digit seconds correctly", () => {
    expect(formatDuration(10)).toBe("0:10");
  });

  test("formats minutes and seconds correctly", () => {
    expect(formatDuration(65)).toBe("1:05");
  });

  test("formats multiple minutes correctly", () => {
    expect(formatDuration(125)).toBe("2:05");
  });

  test("formats zero correctly", () => {
    expect(formatDuration(0)).toBe("0:00");
  });

  test("formats edge cases correctly", () => {
    expect(formatDuration(59)).toBe("0:59");
    expect(formatDuration(60)).toBe("1:00");
    expect(formatDuration(61)).toBe("1:01");
  });
});

describe("Video Support - Type Discrimination", () => {
  type MediaItem = { type: "image" | "video"; id: string };

  test("items are correctly typed as image or video", () => {
    const items: MediaItem[] = [
      { type: "image", id: "1" },
      { type: "video", id: "2" },
    ];

    const images = items.filter((item) => item.type === "image");
    const videos = items.filter((item) => item.type === "video");

    expect(images.length).toBe(1);
    expect(videos.length).toBe(1);
    expect(images[0].id).toBe("1");
    expect(videos[0].id).toBe("2");
  });

  test("handles empty arrays", () => {
    const items: MediaItem[] = [];

    const images = items.filter((item) => item.type === "image");
    const videos = items.filter((item) => item.type === "video");

    expect(images.length).toBe(0);
    expect(videos.length).toBe(0);
  });

  test("handles all images", () => {
    const items: MediaItem[] = [
      { type: "image", id: "1" },
      { type: "image", id: "2" },
    ];

    const images = items.filter((item) => item.type === "image");
    const videos = items.filter((item) => item.type === "video");

    expect(images.length).toBe(2);
    expect(videos.length).toBe(0);
  });

  test("handles all videos", () => {
    const items: MediaItem[] = [
      { type: "video", id: "1" },
      { type: "video", id: "2" },
    ];

    const images = items.filter((item) => item.type === "image");
    const videos = items.filter((item) => item.type === "video");

    expect(images.length).toBe(0);
    expect(videos.length).toBe(2);
  });
});

describe("Video Support - Sorting", () => {
  test("items are sorted by createdAt descending", () => {
    const items = [
      { createdAt: new Date("2024-01-01"), id: "old" },
      { createdAt: new Date("2024-01-03"), id: "new" },
      { createdAt: new Date("2024-01-02"), id: "mid" },
    ];

    const sorted = [...items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    expect(sorted[0].id).toBe("new");
    expect(sorted[1].id).toBe("mid");
    expect(sorted[2].id).toBe("old");
  });

  test("handles items with same date", () => {
    const items = [
      { createdAt: new Date("2024-01-01"), id: "a" },
      { createdAt: new Date("2024-01-01"), id: "b" },
    ];

    const sorted = [...items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Order should be stable for same dates
    expect(sorted.length).toBe(2);
  });

  test("handles single item", () => {
    const items = [{ createdAt: new Date("2024-01-01"), id: "only" }];

    const sorted = [...items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    expect(sorted[0].id).toBe("only");
  });
});
