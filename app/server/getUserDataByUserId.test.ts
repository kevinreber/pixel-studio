import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserDataByUserId } from "./getUserDataByUserId";

// Mock Prisma
vi.mock("~/services/prisma.server", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
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

import { prisma } from "~/services/prisma.server";

describe("getUserDataByUserId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return user data with images and videos", async () => {
    const mockUser = {
      id: "user-1",
      name: "Test User",
      username: "testuser",
      image: "https://example.com/avatar.jpg",
      createdAt: new Date(),
      _count: { images: 1, videos: 1 },
      images: [
        {
          id: "img-1",
          title: "Test Image",
          prompt: "A beautiful sunset",
          model: "dall-e-3",
          stylePreset: "none",
          private: false,
          createdAt: new Date("2024-01-10"),
          user: {
            id: "user-1",
            username: "testuser",
            image: null,
          },
          comments: [],
          likes: [],
        },
      ],
      videos: [
        {
          id: "vid-1",
          title: "Test Video",
          prompt: "A serene lake",
          model: "runway-gen3",
          private: false,
          duration: 10,
          aspectRatio: "16:9",
          status: "complete",
          createdAt: new Date("2024-01-15"),
          user: {
            id: "user-1",
            username: "testuser",
            image: null,
          },
        },
      ],
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);

    const result = await getUserDataByUserId("user-1");

    expect(result.user).toBeDefined();
    expect(result.user?.username).toBe("testuser");
    expect(result.images).toHaveLength(1);
    expect(result.videos).toHaveLength(1);
    expect(result.items).toHaveLength(2);
    expect(result.count).toBe(2);
  });

  it("should return items with correct type field", async () => {
    const mockUser = {
      id: "user-1",
      name: "Test User",
      username: "testuser",
      image: null,
      createdAt: new Date(),
      _count: { images: 1, videos: 1 },
      images: [
        {
          id: "img-1",
          title: "Image",
          prompt: "Test",
          model: "dall-e-3",
          stylePreset: "none",
          private: false,
          createdAt: new Date("2024-01-10"),
          user: { id: "user-1", username: "testuser", image: null },
          comments: [],
          likes: [],
        },
      ],
      videos: [
        {
          id: "vid-1",
          title: "Video",
          prompt: "Test",
          model: "runway-gen3",
          private: false,
          duration: 5,
          aspectRatio: "16:9",
          status: "complete",
          createdAt: new Date("2024-01-15"),
          user: { id: "user-1", username: "testuser", image: null },
        },
      ],
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);

    const result = await getUserDataByUserId("user-1");

    expect(result.images[0].type).toBe("image");
    expect(result.videos[0].type).toBe("video");
  });

  it("should sort items by createdAt descending", async () => {
    const mockUser = {
      id: "user-1",
      name: "Test User",
      username: "testuser",
      image: null,
      createdAt: new Date(),
      _count: { images: 1, videos: 1 },
      images: [
        {
          id: "img-old",
          title: "Old Image",
          prompt: "Test",
          model: "dall-e-3",
          stylePreset: "none",
          private: false,
          createdAt: new Date("2024-01-01"),
          user: { id: "user-1", username: "testuser", image: null },
          comments: [],
          likes: [],
        },
      ],
      videos: [
        {
          id: "vid-new",
          title: "New Video",
          prompt: "Test",
          model: "runway-gen3",
          private: false,
          duration: 5,
          aspectRatio: "16:9",
          status: "complete",
          createdAt: new Date("2024-01-15"),
          user: { id: "user-1", username: "testuser", image: null },
        },
      ],
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);

    const result = await getUserDataByUserId("user-1");

    // Video should be first (newer)
    expect(result.items[0].id).toBe("vid-new");
    expect(result.items[0].type).toBe("video");
    // Image should be second (older)
    expect(result.items[1].id).toBe("img-old");
    expect(result.items[1].type).toBe("image");
  });

  it("should include correct URLs for images and videos", async () => {
    const mockUser = {
      id: "user-1",
      name: "Test User",
      username: "testuser",
      image: null,
      createdAt: new Date(),
      _count: { images: 1, videos: 1 },
      images: [
        {
          id: "img-1",
          title: "Image",
          prompt: "Test",
          model: "dall-e-3",
          stylePreset: "none",
          private: false,
          createdAt: new Date(),
          user: { id: "user-1", username: "testuser", image: null },
          comments: [],
          likes: [],
        },
      ],
      videos: [
        {
          id: "vid-1",
          title: "Video",
          prompt: "Test",
          model: "runway-gen3",
          private: false,
          duration: 5,
          aspectRatio: "16:9",
          status: "complete",
          createdAt: new Date(),
          user: { id: "user-1", username: "testuser", image: null },
        },
      ],
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);

    const result = await getUserDataByUserId("user-1");

    expect(result.images[0].url).toBe("https://s3.example.com/images/img-1");
    expect(result.images[0].thumbnailURL).toBe(
      "https://s3.example.com/thumbnails/img-1"
    );
    expect(result.videos[0].url).toBe("https://s3.example.com/videos/vid-1");
    expect(result.videos[0].thumbnailURL).toBe(
      "https://s3.example.com/video-thumbnails/vid-1"
    );
  });

  it("should return null user when user not found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const result = await getUserDataByUserId("non-existent-user");

    expect(result.user).toBeNull();
    expect(result.images).toHaveLength(0);
    expect(result.videos).toHaveLength(0);
    expect(result.items).toHaveLength(0);
  });

  it("should handle user with only images", async () => {
    const mockUser = {
      id: "user-1",
      name: "Test User",
      username: "testuser",
      image: null,
      createdAt: new Date(),
      _count: { images: 1, videos: 0 },
      images: [
        {
          id: "img-1",
          title: "Image",
          prompt: "Test",
          model: "dall-e-3",
          stylePreset: "none",
          private: false,
          createdAt: new Date(),
          user: { id: "user-1", username: "testuser", image: null },
          comments: [],
          likes: [],
        },
      ],
      videos: [],
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);

    const result = await getUserDataByUserId("user-1");

    expect(result.images).toHaveLength(1);
    expect(result.videos).toHaveLength(0);
    expect(result.items).toHaveLength(1);
    expect(result.count).toBe(1);
  });

  it("should handle user with only videos", async () => {
    const mockUser = {
      id: "user-1",
      name: "Test User",
      username: "testuser",
      image: null,
      createdAt: new Date(),
      _count: { images: 0, videos: 1 },
      images: [],
      videos: [
        {
          id: "vid-1",
          title: "Video",
          prompt: "Test",
          model: "runway-gen3",
          private: false,
          duration: 5,
          aspectRatio: "16:9",
          status: "complete",
          createdAt: new Date(),
          user: { id: "user-1", username: "testuser", image: null },
        },
      ],
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);

    const result = await getUserDataByUserId("user-1");

    expect(result.images).toHaveLength(0);
    expect(result.videos).toHaveLength(1);
    expect(result.items).toHaveLength(1);
    expect(result.count).toBe(1);
  });

  it("should apply pagination correctly to items", async () => {
    const mockUser = {
      id: "user-1",
      name: "Test User",
      username: "testuser",
      image: null,
      createdAt: new Date(),
      _count: { images: 30, videos: 0 },
      images: Array.from({ length: 30 }, (_, i) => ({
        id: `img-${i}`,
        title: `Image ${i}`,
        prompt: "Test",
        model: "dall-e-3",
        stylePreset: "none",
        private: false,
        createdAt: new Date(`2024-01-${String(i + 1).padStart(2, "0")}`),
        user: { id: "user-1", username: "testuser", image: null },
        comments: [],
        likes: [],
      })),
      videos: [],
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);

    const result = await getUserDataByUserId("user-1", 1, 10);

    expect(result.items).toHaveLength(10);
    expect(result.count).toBe(30);
  });

  it("should include video metadata (duration, aspectRatio)", async () => {
    const mockUser = {
      id: "user-1",
      name: "Test User",
      username: "testuser",
      image: null,
      createdAt: new Date(),
      _count: { images: 0, videos: 1 },
      images: [],
      videos: [
        {
          id: "vid-1",
          title: "Video",
          prompt: "Test",
          model: "runway-gen3",
          private: false,
          duration: 15,
          aspectRatio: "9:16",
          status: "complete",
          createdAt: new Date(),
          user: { id: "user-1", username: "testuser", image: null },
        },
      ],
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);

    const result = await getUserDataByUserId("user-1");

    expect(result.videos[0].duration).toBe(15);
    expect(result.videos[0].aspectRatio).toBe("9:16");
  });
});
