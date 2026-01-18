import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNotification } from "./createNotification.server";

// Mock Prisma
vi.mock("~/services/prisma.server", () => ({
  prisma: {
    notification: {
      create: vi.fn(),
    },
  },
}));

// Mock Logger
vi.mock("~/utils/logger.server", () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { prisma } from "~/services/prisma.server";

describe("createNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a NEW_FOLLOWER notification", async () => {
    const mockNotification = {
      id: "notification-1",
      type: "NEW_FOLLOWER",
      recipientId: "user-2",
      actorId: "user-1",
      read: false,
      createdAt: new Date(),
      actor: { id: "user-1", username: "testuser", image: null },
      image: null,
      comment: null,
    };

    vi.mocked(prisma.notification.create).mockResolvedValue(
      mockNotification as never
    );

    const result = await createNotification({
      type: "NEW_FOLLOWER",
      recipientId: "user-2",
      actorId: "user-1",
    });

    expect(result).toEqual(mockNotification);
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          type: "NEW_FOLLOWER",
          recipientId: "user-2",
          actorId: "user-1",
          imageId: undefined,
          commentId: undefined,
        },
      })
    );
  });

  it("should create an IMAGE_LIKED notification", async () => {
    const mockNotification = {
      id: "notification-2",
      type: "IMAGE_LIKED",
      recipientId: "user-2",
      actorId: "user-1",
      imageId: "image-1",
      read: false,
      createdAt: new Date(),
      actor: { id: "user-1", username: "testuser", image: null },
      image: { id: "image-1", title: "Test", prompt: "A test" },
      comment: null,
    };

    vi.mocked(prisma.notification.create).mockResolvedValue(
      mockNotification as never
    );

    const result = await createNotification({
      type: "IMAGE_LIKED",
      recipientId: "user-2",
      actorId: "user-1",
      imageId: "image-1",
    });

    expect(result).toEqual(mockNotification);
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          type: "IMAGE_LIKED",
          recipientId: "user-2",
          actorId: "user-1",
          imageId: "image-1",
          commentId: undefined,
        },
      })
    );
  });

  it("should create an IMAGE_COMMENT notification with comment reference", async () => {
    const mockNotification = {
      id: "notification-3",
      type: "IMAGE_COMMENT",
      recipientId: "user-2",
      actorId: "user-1",
      imageId: "image-1",
      commentId: "comment-1",
      read: false,
      createdAt: new Date(),
      actor: { id: "user-1", username: "testuser", image: null },
      image: { id: "image-1", title: "Test", prompt: "A test" },
      comment: { id: "comment-1", message: "Nice!" },
    };

    vi.mocked(prisma.notification.create).mockResolvedValue(
      mockNotification as never
    );

    const result = await createNotification({
      type: "IMAGE_COMMENT",
      recipientId: "user-2",
      actorId: "user-1",
      imageId: "image-1",
      commentId: "comment-1",
    });

    expect(result).toEqual(mockNotification);
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          type: "IMAGE_COMMENT",
          recipientId: "user-2",
          actorId: "user-1",
          imageId: "image-1",
          commentId: "comment-1",
        },
      })
    );
  });

  it("should create an IMAGE_COMPLETED notification without actor", async () => {
    const mockNotification = {
      id: "notification-4",
      type: "IMAGE_COMPLETED",
      recipientId: "user-1",
      imageId: "image-1",
      read: false,
      createdAt: new Date(),
      actor: null,
      image: { id: "image-1", title: "Generated", prompt: "A test" },
      comment: null,
    };

    vi.mocked(prisma.notification.create).mockResolvedValue(
      mockNotification as never
    );

    const result = await createNotification({
      type: "IMAGE_COMPLETED",
      recipientId: "user-1",
      imageId: "image-1",
    });

    expect(result).toEqual(mockNotification);
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          type: "IMAGE_COMPLETED",
          recipientId: "user-1",
          actorId: undefined,
          imageId: "image-1",
          commentId: undefined,
        },
      })
    );
  });

  it("should skip notification when actor and recipient are the same", async () => {
    const result = await createNotification({
      type: "IMAGE_LIKED",
      recipientId: "user-1",
      actorId: "user-1",
      imageId: "image-1",
    });

    expect(result).toBeNull();
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });
});
