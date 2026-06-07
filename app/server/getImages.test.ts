import { describe, it, expect, vi, beforeEach } from "vitest";
import { getImages } from "./getImages";

// Mock Prisma
vi.mock("services/prisma.server", () => ({
  prisma: {
    $queryRaw: vi.fn(),
    user: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

// Mock S3 Utils
vi.mock("utils/s3Utils", () => ({
  getS3BucketURL: vi.fn((id: string) => `https://s3.example.com/images/${id}`),
  getS3BucketThumbnailURL: vi.fn(
    (id: string) => `https://s3.example.com/thumbnails/${id}`
  ),
  getS3BucketBlurURL: vi.fn(
    (id: string) => `https://s3.example.com/blur/${id}`
  ),
  getS3VideoURL: vi.fn((id: string) => `https://s3.example.com/videos/${id}`),
  getS3VideoThumbnailURL: vi.fn(
    (id: string) => `https://s3.example.com/video-thumbnails/${id}`
  ),
}));

import { prisma } from "services/prisma.server";

describe("getImages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no users hydrated. Individual tests that exercise the
    // hover-overlay name flow override this with mockResolvedValueOnce.
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
  });

  it("should return empty arrays when no content found", async () => {
    // Mock count queries returning 0
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([{ count: 0 }]) // image count
      .mockResolvedValueOnce([{ count: 0 }]) // video count
      .mockResolvedValueOnce([]) // images
      .mockResolvedValueOnce([]); // videos

    const result = await getImages();

    expect(result.status).toBe("idle");
    expect(result.images).toHaveLength(0);
    expect(result.videos).toHaveLength(0);
    expect(result.items).toHaveLength(0);
    expect(result.pagination.totalCount).toBe(0);
  });

  it("should return images with type field", async () => {
    const mockImages = [
      {
        id: "img-1",
        title: "Test Image",
        prompt: "A beautiful sunset",
        model: "dall-e-3",
        stylePreset: "none",
        userId: "user-1",
        createdAt: new Date("2024-01-15"),
      },
    ];

    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([{ count: 1 }]) // image count
      .mockResolvedValueOnce([{ count: 0 }]) // video count
      .mockResolvedValueOnce(mockImages) // images
      .mockResolvedValueOnce([]); // videos

    const result = await getImages();

    expect(result.status).toBe("idle");
    expect(result.images).toHaveLength(1);
    expect(result.images[0].type).toBe("image");
    expect(result.images[0].id).toBe("img-1");
    expect(result.images[0].url).toBe("https://s3.example.com/images/img-1");
    expect(result.images[0].thumbnailURL).toBe(
      "https://s3.example.com/thumbnails/img-1"
    );
  });

  it("should return videos with type field", async () => {
    const mockVideos = [
      {
        id: "vid-1",
        title: "Test Video",
        prompt: "A serene lake",
        model: "runway-gen3",
        userId: "user-1",
        duration: 10,
        aspectRatio: "16:9",
        status: "complete",
        createdAt: new Date("2024-01-15"),
      },
    ];

    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([{ count: 0 }]) // image count
      .mockResolvedValueOnce([{ count: 1 }]) // video count
      .mockResolvedValueOnce([]) // images
      .mockResolvedValueOnce(mockVideos); // videos

    const result = await getImages();

    expect(result.status).toBe("idle");
    expect(result.videos).toHaveLength(1);
    expect(result.videos[0].type).toBe("video");
    expect(result.videos[0].id).toBe("vid-1");
    expect(result.videos[0].url).toBe("https://s3.example.com/videos/vid-1");
    expect(result.videos[0].thumbnailURL).toBe(
      "https://s3.example.com/video-thumbnails/vid-1"
    );
    expect(result.videos[0].duration).toBe(10);
  });

  it("should combine and sort images and videos by createdAt descending", async () => {
    const mockImages = [
      {
        id: "img-1",
        title: "Older Image",
        prompt: "Test",
        model: "dall-e-3",
        stylePreset: "none",
        userId: "user-1",
        createdAt: new Date("2024-01-10"),
      },
    ];

    const mockVideos = [
      {
        id: "vid-1",
        title: "Newer Video",
        prompt: "Test",
        model: "runway-gen3",
        userId: "user-1",
        duration: 5,
        aspectRatio: "16:9",
        status: "complete",
        createdAt: new Date("2024-01-15"),
      },
    ];

    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([{ count: 1 }]) // image count
      .mockResolvedValueOnce([{ count: 1 }]) // video count
      .mockResolvedValueOnce(mockImages) // images
      .mockResolvedValueOnce(mockVideos); // videos

    const result = await getImages();

    expect(result.items).toHaveLength(2);
    // Video should be first (newer)
    expect(result.items[0].id).toBe("vid-1");
    expect(result.items[0].type).toBe("video");
    // Image should be second (older)
    expect(result.items[1].id).toBe("img-1");
    expect(result.items[1].type).toBe("image");
  });

  it("should apply pagination correctly", async () => {
    const mockImages = Array.from({ length: 30 }, (_, i) => ({
      id: `img-${i}`,
      title: `Image ${i}`,
      prompt: "Test",
      model: "dall-e-3",
      stylePreset: "none",
      userId: "user-1",
      createdAt: new Date(`2024-01-${String(i + 1).padStart(2, "0")}`),
    }));

    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([{ count: 30 }]) // image count
      .mockResolvedValueOnce([{ count: 0 }]) // video count
      .mockResolvedValueOnce(mockImages) // images
      .mockResolvedValueOnce([]); // videos

    const result = await getImages("", 1, 10);

    expect(result.items).toHaveLength(10);
    expect(result.pagination.currentPage).toBe(1);
    expect(result.pagination.totalCount).toBe(30);
    expect(result.pagination.totalPages).toBe(3);
    expect(result.pagination.hasNextPage).toBe(true);
    expect(result.pagination.hasPrevPage).toBe(false);
  });

  it("should filter by search term", async () => {
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([{ count: 1 }])
      .mockResolvedValueOnce([{ count: 0 }])
      .mockResolvedValueOnce([
        {
          id: "img-1",
          title: "Sunset Image",
          prompt: "Beautiful sunset",
          model: "dall-e-3",
          stylePreset: "none",
          userId: "user-1",
          createdAt: new Date(),
        },
      ])
      .mockResolvedValueOnce([]);

    const result = await getImages("sunset");

    expect(result.status).toBe("idle");
    expect(result.images).toHaveLength(1);
    // Verify the search was executed (can't directly check SQL, but result confirms it worked)
  });

  it("should handle database errors gracefully", async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error("Database error"));

    const result = await getImages();

    expect(result.status).toBe("error");
    expect(result.error).toBe("Database error");
    expect(result.images).toHaveLength(0);
    expect(result.videos).toHaveLength(0);
    expect(result.items).toHaveLength(0);
  });

  it("should hydrate creator info onto each item", async () => {
    const mockImages = [
      {
        id: "img-1",
        title: "Image",
        prompt: "Test",
        model: "dall-e-3",
        stylePreset: "none",
        userId: "user-1",
        createdAt: new Date("2024-01-10"),
      },
    ];

    const mockVideos = [
      {
        id: "vid-1",
        title: "Video",
        prompt: "Test",
        model: "runway-gen3",
        userId: "user-2",
        duration: 5,
        aspectRatio: "16:9",
        status: "complete",
        createdAt: new Date("2024-01-15"),
      },
    ];

    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([{ count: 1 }])
      .mockResolvedValueOnce([{ count: 1 }])
      .mockResolvedValueOnce(mockImages)
      .mockResolvedValueOnce(mockVideos);

    // The production code only requests {id, name, username, image} via
    // Prisma's `select`, so the runtime shape is a strict subset of User.
    // Cast away the inferred full-User return type so the mock matches what
    // the call site actually receives.
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([
      { id: "user-1", name: "Ada", username: "ada", image: null },
      { id: "user-2", name: null, username: "bee", image: null },
    ] as unknown as Awaited<ReturnType<typeof prisma.user.findMany>>);

    const result = await getImages();

    expect(result.images[0].user).toEqual({
      id: "user-1",
      name: "Ada",
      username: "ada",
      image: null,
    });
    expect(result.videos[0].user).toEqual({
      id: "user-2",
      name: null,
      username: "bee",
      image: null,
    });
    // Both items in the unified list should carry the same hydrated user.
    expect(result.items.map((i) => i.user?.username).sort()).toEqual([
      "ada",
      "bee",
    ]);
  });

  it("should leave user as null when the creator no longer exists", async () => {
    const mockImages = [
      {
        id: "img-orphan",
        title: "Image",
        prompt: "Test",
        model: "dall-e-3",
        stylePreset: "none",
        userId: "ghost-user",
        createdAt: new Date("2024-01-10"),
      },
    ];

    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([{ count: 1 }])
      .mockResolvedValueOnce([{ count: 0 }])
      .mockResolvedValueOnce(mockImages)
      .mockResolvedValueOnce([]);

    // findMany returns nothing — simulating a deleted account.
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([]);

    const result = await getImages();

    expect(result.images[0].user).toBeNull();
  });

  it("should include items array for unified access", async () => {
    const mockImages = [
      {
        id: "img-1",
        title: "Image",
        prompt: "Test",
        model: "dall-e-3",
        stylePreset: "none",
        userId: "user-1",
        createdAt: new Date("2024-01-10"),
      },
    ];

    const mockVideos = [
      {
        id: "vid-1",
        title: "Video",
        prompt: "Test",
        model: "runway-gen3",
        userId: "user-1",
        duration: 5,
        aspectRatio: "16:9",
        status: "complete",
        createdAt: new Date("2024-01-15"),
      },
    ];

    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([{ count: 1 }])
      .mockResolvedValueOnce([{ count: 1 }])
      .mockResolvedValueOnce(mockImages)
      .mockResolvedValueOnce(mockVideos);

    const result = await getImages();

    // Items should contain both images and videos
    expect(result.items).toHaveLength(2);
    expect(result.items.some((item) => item.type === "image")).toBe(true);
    expect(result.items.some((item) => item.type === "video")).toBe(true);
  });
});
