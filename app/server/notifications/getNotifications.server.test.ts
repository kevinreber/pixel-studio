import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getNotifications,
  getUnreadNotificationCount,
} from "./getNotifications.server";

// Mock Prisma
vi.mock("~/services/prisma.server", () => ({
  prisma: {
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
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

describe("getNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch notifications for a user with default pagination", async () => {
    const mockNotifications = [
      {
        id: "notif-1",
        type: "NEW_FOLLOWER",
        read: false,
        createdAt: new Date(),
        actor: { id: "user-1", username: "testuser", image: null },
        image: null,
        comment: null,
      },
      {
        id: "notif-2",
        type: "IMAGE_LIKED",
        read: true,
        createdAt: new Date(),
        actor: { id: "user-2", username: "anotheruser", image: null },
        image: { id: "img-1", title: "Test Image", prompt: "A test" },
        comment: null,
      },
    ];

    vi.mocked(prisma.notification.findMany).mockResolvedValue(
      mockNotifications as never
    );

    const result = await getNotifications({ userId: "recipient-user" });

    expect(result.notifications).toHaveLength(2);
    expect(result.nextCursor).toBeNull();
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { recipientId: "recipient-user" },
        take: 21, // default limit + 1 for cursor
        orderBy: { createdAt: "desc" },
      })
    );
  });

  it("should support pagination with cursor", async () => {
    const mockNotifications = [
      {
        id: "notif-3",
        type: "IMAGE_COMMENT",
        read: false,
        createdAt: new Date(),
        actor: { id: "user-3", username: "commenter", image: null },
        image: { id: "img-2", title: "Another Image", prompt: "Test" },
        comment: { id: "comment-1", message: "Nice!" },
      },
    ];

    vi.mocked(prisma.notification.findMany).mockResolvedValue(
      mockNotifications as never
    );

    const result = await getNotifications({
      userId: "recipient-user",
      cursor: "notif-2",
      limit: 10,
    });

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: { id: "notif-2" },
        skip: 1,
        take: 11, // limit + 1
      })
    );
    expect(result.notifications).toHaveLength(1);
  });

  it("should return next cursor when there are more results", async () => {
    // Create 21 notifications (limit + 1 to trigger pagination)
    const mockNotifications = Array.from({ length: 21 }, (_, i) => ({
      id: `notif-${i}`,
      type: "NEW_FOLLOWER",
      read: false,
      createdAt: new Date(),
      actor: { id: `user-${i}`, username: `user${i}`, image: null },
      image: null,
      comment: null,
    }));

    vi.mocked(prisma.notification.findMany).mockResolvedValue(
      mockNotifications as never
    );

    const result = await getNotifications({
      userId: "recipient-user",
      limit: 20,
    });

    // After pop(), we should have 20 notifications
    expect(result.notifications).toHaveLength(20);
    // The popped item (notif-20) becomes the nextCursor
    expect(result.nextCursor).toBe("notif-20");
  });

  it("should return null nextCursor when no more results", async () => {
    const mockNotifications = [
      {
        id: "notif-1",
        type: "IMAGE_COMPLETED",
        read: false,
        createdAt: new Date(),
        actor: null,
        image: { id: "img-1", title: "Generated", prompt: "A test" },
        comment: null,
      },
    ];

    vi.mocked(prisma.notification.findMany).mockResolvedValue(
      mockNotifications as never
    );

    const result = await getNotifications({
      userId: "recipient-user",
      limit: 20,
    });

    expect(result.nextCursor).toBeNull();
  });
});

describe("getUnreadNotificationCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return count of unread notifications", async () => {
    vi.mocked(prisma.notification.count).mockResolvedValue(5);

    const count = await getUnreadNotificationCount("test-user");

    expect(count).toBe(5);
    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: {
        recipientId: "test-user",
        read: false,
      },
    });
  });

  it("should return 0 when no unread notifications", async () => {
    vi.mocked(prisma.notification.count).mockResolvedValue(0);

    const count = await getUnreadNotificationCount("test-user");

    expect(count).toBe(0);
  });
});
