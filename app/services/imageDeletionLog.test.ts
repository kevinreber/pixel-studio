import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma before importing the module
vi.mock("~/services/prisma.server", () => ({
  prisma: {
    image: {
      findUnique: vi.fn(),
    },
    imageDeletionLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

// Mock deleteImage functions
vi.mock("~/server/deleteImage", () => ({
  deleteImageFromDB: vi.fn(),
  deleteImageFromS3Bucket: vi.fn(),
}));

import { prisma } from "~/services/prisma.server";
import { deleteImageFromDB, deleteImageFromS3Bucket } from "~/server/deleteImage";
import {
  deleteImageWithAudit,
  getImageDeletionLogs,
  getImageDeletionLogById,
  findDeletionLogByImageId,
  getImageDeletionStats,
} from "./imageDeletionLog.server";

describe("deleteImageWithAudit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockImage = {
    id: "image-123",
    title: "Test Image",
    prompt: "A beautiful sunset",
    model: "dall-e-3",
    userId: "user-456",
    createdAt: new Date("2024-01-15"),
    width: 1024,
    height: 1024,
    quality: "hd",
    generationStyle: "vivid",
    negativePrompt: null,
    seed: null,
    cfgScale: null,
    steps: null,
    promptUpsampling: false,
    stylePreset: "vivid",
    private: false,
    setId: null,
    user: {
      id: "user-456",
      username: "testuser",
      email: "test@example.com",
    },
  };

  const mockDeletionLog = {
    id: "deletion-log-789",
    imageId: "image-123",
    imageTitle: "Test Image",
    imagePrompt: "A beautiful sunset",
    imageModel: "dall-e-3",
    imageUserId: "user-456",
    imageCreatedAt: new Date("2024-01-15"),
    deletedBy: "admin-111",
    reason: "Inappropriate content",
    deletedAt: new Date(),
    metadata: {},
  };

  it("successfully deletes an image and creates audit log", async () => {
    vi.mocked(prisma.image.findUnique).mockResolvedValue(mockImage as never);
    vi.mocked(prisma.imageDeletionLog.create).mockResolvedValue(mockDeletionLog as never);
    vi.mocked(deleteImageFromDB).mockResolvedValue({ id: "image-123" } as never);
    vi.mocked(deleteImageFromS3Bucket).mockResolvedValue({ success: true } as never);

    const result = await deleteImageWithAudit({
      imageId: "image-123",
      deletedBy: "admin-111",
      reason: "Inappropriate content",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("deleted successfully");
    expect(result.deletionLogId).toBe("deletion-log-789");

    // Verify audit log was created with correct data
    expect(prisma.imageDeletionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        imageId: "image-123",
        imageTitle: "Test Image",
        imagePrompt: "A beautiful sunset",
        imageModel: "dall-e-3",
        imageUserId: "user-456",
        deletedBy: "admin-111",
        reason: "Inappropriate content",
      }),
    });

    // Verify deletion was called
    expect(deleteImageFromDB).toHaveBeenCalledWith("image-123");
    expect(deleteImageFromS3Bucket).toHaveBeenCalledWith("image-123");
  });

  it("returns error when image is not found", async () => {
    vi.mocked(prisma.image.findUnique).mockResolvedValue(null);

    const result = await deleteImageWithAudit({
      imageId: "nonexistent-image",
      deletedBy: "admin-111",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("not found");

    // Verify no deletion was attempted
    expect(prisma.imageDeletionLog.create).not.toHaveBeenCalled();
    expect(deleteImageFromDB).not.toHaveBeenCalled();
    expect(deleteImageFromS3Bucket).not.toHaveBeenCalled();
  });

  it("handles deletion without reason", async () => {
    vi.mocked(prisma.image.findUnique).mockResolvedValue(mockImage as never);
    vi.mocked(prisma.imageDeletionLog.create).mockResolvedValue({
      ...mockDeletionLog,
      reason: null,
    } as never);
    vi.mocked(deleteImageFromDB).mockResolvedValue({ id: "image-123" } as never);
    vi.mocked(deleteImageFromS3Bucket).mockResolvedValue({ success: true } as never);

    const result = await deleteImageWithAudit({
      imageId: "image-123",
      deletedBy: "admin-111",
      // No reason provided
    });

    expect(result.success).toBe(true);
    expect(prisma.imageDeletionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        reason: undefined,
      }),
    });
  });

  it("preserves image metadata in audit log", async () => {
    vi.mocked(prisma.image.findUnique).mockResolvedValue(mockImage as never);
    vi.mocked(prisma.imageDeletionLog.create).mockResolvedValue(mockDeletionLog as never);
    vi.mocked(deleteImageFromDB).mockResolvedValue({ id: "image-123" } as never);
    vi.mocked(deleteImageFromS3Bucket).mockResolvedValue({ success: true } as never);

    await deleteImageWithAudit({
      imageId: "image-123",
      deletedBy: "admin-111",
    });

    expect(prisma.imageDeletionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metadata: expect.objectContaining({
          width: 1024,
          height: 1024,
          quality: "hd",
          generationStyle: "vivid",
          ownerUsername: "testuser",
          ownerEmail: "test@example.com",
        }),
      }),
    });
  });

  it("handles database error gracefully", async () => {
    vi.mocked(prisma.image.findUnique).mockRejectedValue(new Error("Database connection failed"));

    const result = await deleteImageWithAudit({
      imageId: "image-123",
      deletedBy: "admin-111",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("Failed to delete");
    expect(result.error).toBeDefined();
  });
});

describe("getImageDeletionLogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockLogs = [
    {
      id: "log-1",
      imageId: "image-1",
      deletedBy: "admin-1",
      deletedAt: new Date(),
      deletedByUser: { id: "admin-1", username: "admin", email: "admin@example.com" },
    },
    {
      id: "log-2",
      imageId: "image-2",
      deletedBy: "admin-1",
      deletedAt: new Date(),
      deletedByUser: { id: "admin-1", username: "admin", email: "admin@example.com" },
    },
  ];

  it("returns deletion logs with default pagination", async () => {
    vi.mocked(prisma.imageDeletionLog.findMany).mockResolvedValue(mockLogs as never);

    const result = await getImageDeletionLogs();

    expect(result).toEqual(mockLogs);
    expect(prisma.imageDeletionLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 50,
        skip: 0,
        orderBy: { deletedAt: "desc" },
      })
    );
  });

  it("respects custom pagination options", async () => {
    vi.mocked(prisma.imageDeletionLog.findMany).mockResolvedValue([mockLogs[0]] as never);

    await getImageDeletionLogs({ limit: 10, offset: 20 });

    expect(prisma.imageDeletionLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        skip: 20,
      })
    );
  });

  it("filters by deletedBy when provided", async () => {
    vi.mocked(prisma.imageDeletionLog.findMany).mockResolvedValue(mockLogs as never);

    await getImageDeletionLogs({ deletedBy: "admin-1" });

    expect(prisma.imageDeletionLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedBy: "admin-1",
        }),
      })
    );
  });

  it("filters by imageUserId when provided", async () => {
    vi.mocked(prisma.imageDeletionLog.findMany).mockResolvedValue(mockLogs as never);

    await getImageDeletionLogs({ imageUserId: "user-123" });

    expect(prisma.imageDeletionLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          imageUserId: "user-123",
        }),
      })
    );
  });

  it("returns empty array on error", async () => {
    vi.mocked(prisma.imageDeletionLog.findMany).mockRejectedValue(new Error("Database error"));

    const result = await getImageDeletionLogs();

    expect(result).toEqual([]);
  });
});

describe("getImageDeletionLogById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns deletion log when found", async () => {
    const mockLog = {
      id: "log-123",
      imageId: "image-456",
      deletedByUser: { id: "admin-1", username: "admin", email: "admin@example.com" },
    };

    vi.mocked(prisma.imageDeletionLog.findUnique).mockResolvedValue(mockLog as never);

    const result = await getImageDeletionLogById("log-123");

    expect(result).toEqual(mockLog);
    expect(prisma.imageDeletionLog.findUnique).toHaveBeenCalledWith({
      where: { id: "log-123" },
      include: expect.any(Object),
    });
  });

  it("returns null when not found", async () => {
    vi.mocked(prisma.imageDeletionLog.findUnique).mockResolvedValue(null);

    const result = await getImageDeletionLogById("nonexistent");

    expect(result).toBeNull();
  });

  it("returns null on error", async () => {
    vi.mocked(prisma.imageDeletionLog.findUnique).mockRejectedValue(new Error("Database error"));

    const result = await getImageDeletionLogById("log-123");

    expect(result).toBeNull();
  });
});

describe("findDeletionLogByImageId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns deletion log when image was deleted", async () => {
    const mockLog = {
      id: "log-123",
      imageId: "image-456",
      deletedByUser: { id: "admin-1", username: "admin", email: "admin@example.com" },
    };

    vi.mocked(prisma.imageDeletionLog.findFirst).mockResolvedValue(mockLog as never);

    const result = await findDeletionLogByImageId("image-456");

    expect(result).toEqual(mockLog);
    expect(prisma.imageDeletionLog.findFirst).toHaveBeenCalledWith({
      where: { imageId: "image-456" },
      include: expect.any(Object),
    });
  });

  it("returns null when image was not deleted", async () => {
    vi.mocked(prisma.imageDeletionLog.findFirst).mockResolvedValue(null);

    const result = await findDeletionLogByImageId("image-not-deleted");

    expect(result).toBeNull();
  });
});

describe("getImageDeletionStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns deletion statistics", async () => {
    vi.mocked(prisma.imageDeletionLog.count).mockResolvedValue(100);
    vi.mocked(prisma.imageDeletionLog.groupBy).mockResolvedValue([
      { deletedBy: "admin-1", _count: { id: 60 } },
      { deletedBy: "admin-2", _count: { id: 40 } },
    ] as never);

    const result = await getImageDeletionStats();

    expect(result.totalDeletions).toBe(100);
    expect(result.deletionsByAdmin).toHaveLength(2);
  });

  it("returns zero stats on error", async () => {
    vi.mocked(prisma.imageDeletionLog.count).mockRejectedValue(new Error("Database error"));

    const result = await getImageDeletionStats();

    expect(result.totalDeletions).toBe(0);
    expect(result.deletionsByAdmin).toEqual([]);
  });
});
