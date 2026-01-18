import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteNotification } from "./deleteNotification.server";

// Mock Prisma
vi.mock("~/services/prisma.server", () => ({
  prisma: {
    notification: {
      deleteMany: vi.fn(),
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

describe("deleteNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete a notification successfully", async () => {
    vi.mocked(prisma.notification.deleteMany).mockResolvedValue({ count: 1 });

    const result = await deleteNotification({
      notificationId: "notif-1",
      userId: "user-1",
    });

    expect(result).toBe(true);
    expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
      where: {
        id: "notif-1",
        recipientId: "user-1",
      },
    });
  });

  it("should return false when notification not found", async () => {
    vi.mocked(prisma.notification.deleteMany).mockResolvedValue({ count: 0 });

    const result = await deleteNotification({
      notificationId: "non-existent",
      userId: "user-1",
    });

    expect(result).toBe(false);
  });

  it("should return false when trying to delete another users notification", async () => {
    vi.mocked(prisma.notification.deleteMany).mockResolvedValue({ count: 0 });

    const result = await deleteNotification({
      notificationId: "notif-1",
      userId: "wrong-user",
    });

    expect(result).toBe(false);
  });
});
