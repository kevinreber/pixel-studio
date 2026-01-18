import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "./markNotificationRead.server";

// Mock Prisma
vi.mock("~/services/prisma.server", () => ({
  prisma: {
    notification: {
      updateMany: vi.fn(),
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

describe("markNotificationRead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should mark a specific notification as read", async () => {
    vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 1 });

    const result = await markNotificationRead({
      notificationId: "notif-1",
      userId: "user-1",
    });

    expect(result).toBe(true);
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: {
        id: "notif-1",
        recipientId: "user-1",
      },
      data: { read: true },
    });
  });

  it("should return false when notification not found", async () => {
    vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 0 });

    const result = await markNotificationRead({
      notificationId: "non-existent",
      userId: "user-1",
    });

    expect(result).toBe(false);
  });

  it("should return false when notification belongs to another user", async () => {
    vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 0 });

    const result = await markNotificationRead({
      notificationId: "notif-1",
      userId: "wrong-user",
    });

    expect(result).toBe(false);
  });
});

describe("markAllNotificationsRead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should mark all notifications as read for a user", async () => {
    vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 5 });

    const result = await markAllNotificationsRead("user-1");

    expect(result).toBe(5);
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: {
        recipientId: "user-1",
        read: false,
      },
      data: { read: true },
    });
  });

  it("should return 0 when no unread notifications exist", async () => {
    vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 0 });

    const result = await markAllNotificationsRead("user-1");

    expect(result).toBe(0);
  });
});
