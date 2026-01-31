import { describe, it, expect, vi } from "vitest";

// Mock the services module to avoid environment variable dependencies
vi.mock("~/services", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Import after mocking
import { isAdmin, hasPermission, canDeleteAnyImage } from "./isAdmin.server";

describe("isAdmin", () => {
  it("returns false for null user", () => {
    expect(isAdmin(null)).toBe(false);
  });

  it("returns false for undefined user", () => {
    expect(isAdmin(undefined)).toBe(false);
  });

  it("returns false for user with no roles", () => {
    const user = { id: "user-1", roles: [] };
    expect(isAdmin(user)).toBe(false);
  });

  it("returns false for user with undefined roles", () => {
    const user = { id: "user-1" } as { id: string; roles?: Array<{ name: string }> };
    expect(isAdmin(user)).toBe(false);
  });

  it("returns false for user without admin role", () => {
    const user = {
      id: "user-1",
      roles: [{ name: "user" }, { name: "moderator" }],
    };
    expect(isAdmin(user)).toBe(false);
  });

  it("returns true for user with admin role", () => {
    const user = {
      id: "user-1",
      roles: [{ name: "admin" }],
    };
    expect(isAdmin(user)).toBe(true);
  });

  it("returns true for user with Admin role (case insensitive)", () => {
    const user = {
      id: "user-1",
      roles: [{ name: "Admin" }],
    };
    expect(isAdmin(user)).toBe(true);
  });

  it("returns true for user with ADMIN role (uppercase)", () => {
    const user = {
      id: "user-1",
      roles: [{ name: "ADMIN" }],
    };
    expect(isAdmin(user)).toBe(true);
  });

  it("returns true for user with admin among other roles", () => {
    const user = {
      id: "user-1",
      roles: [{ name: "user" }, { name: "admin" }, { name: "moderator" }],
    };
    expect(isAdmin(user)).toBe(true);
  });
});

describe("hasPermission", () => {
  it("returns false for null user", () => {
    expect(hasPermission(null, "delete", "image", "any")).toBe(false);
  });

  it("returns false for undefined user", () => {
    expect(hasPermission(undefined, "delete", "image", "any")).toBe(false);
  });

  it("returns false for user with no roles", () => {
    const user = { id: "user-1", roles: [] };
    expect(hasPermission(user, "delete", "image", "any")).toBe(false);
  });

  it("returns false for user without the specific permission", () => {
    const user = {
      id: "user-1",
      roles: [
        {
          name: "user",
          permissions: [{ action: "read", entity: "image", access: "own" }],
        },
      ],
    };
    expect(hasPermission(user, "delete", "image", "any")).toBe(false);
  });

  it("returns true for user with the exact permission", () => {
    const user = {
      id: "user-1",
      roles: [
        {
          name: "moderator",
          permissions: [{ action: "delete", entity: "image", access: "any" }],
        },
      ],
    };
    expect(hasPermission(user, "delete", "image", "any")).toBe(true);
  });

  it("returns false when action matches but entity does not", () => {
    const user = {
      id: "user-1",
      roles: [
        {
          name: "moderator",
          permissions: [{ action: "delete", entity: "comment", access: "any" }],
        },
      ],
    };
    expect(hasPermission(user, "delete", "image", "any")).toBe(false);
  });

  it("returns false when action and entity match but access does not", () => {
    const user = {
      id: "user-1",
      roles: [
        {
          name: "user",
          permissions: [{ action: "delete", entity: "image", access: "own" }],
        },
      ],
    };
    expect(hasPermission(user, "delete", "image", "any")).toBe(false);
  });

  it("returns true when permission exists in one of multiple roles", () => {
    const user = {
      id: "user-1",
      roles: [
        {
          name: "user",
          permissions: [{ action: "read", entity: "image", access: "any" }],
        },
        {
          name: "moderator",
          permissions: [{ action: "delete", entity: "image", access: "any" }],
        },
      ],
    };
    expect(hasPermission(user, "delete", "image", "any")).toBe(true);
  });

  it("handles roles with undefined permissions", () => {
    const user = {
      id: "user-1",
      roles: [{ name: "user" }],
    } as {
      id: string;
      roles: Array<{
        name: string;
        permissions?: Array<{ action: string; entity: string; access: string }>;
      }>;
    };
    expect(hasPermission(user, "delete", "image", "any")).toBe(false);
  });
});

describe("canDeleteAnyImage", () => {
  it("returns false for null user", () => {
    expect(canDeleteAnyImage(null)).toBe(false);
  });

  it("returns false for undefined user", () => {
    expect(canDeleteAnyImage(undefined)).toBe(false);
  });

  it("returns false for user with no roles", () => {
    const user = { id: "user-1", roles: [] };
    expect(canDeleteAnyImage(user)).toBe(false);
  });

  it("returns true for admin user (implicit permission)", () => {
    const user = {
      id: "user-1",
      roles: [{ name: "admin" }],
    };
    expect(canDeleteAnyImage(user)).toBe(true);
  });

  it("returns true for user with explicit delete:image:any permission", () => {
    const user = {
      id: "user-1",
      roles: [
        {
          name: "moderator",
          permissions: [{ action: "delete", entity: "image", access: "any" }],
        },
      ],
    };
    expect(canDeleteAnyImage(user)).toBe(true);
  });

  it("returns false for user with only delete:image:own permission", () => {
    const user = {
      id: "user-1",
      roles: [
        {
          name: "user",
          permissions: [{ action: "delete", entity: "image", access: "own" }],
        },
      ],
    };
    expect(canDeleteAnyImage(user)).toBe(false);
  });

  it("returns true for admin even without explicit permissions array", () => {
    const user = {
      id: "user-1",
      roles: [{ name: "admin" }],
    };
    expect(canDeleteAnyImage(user)).toBe(true);
  });

  it("returns false for regular user without any delete permissions", () => {
    const user = {
      id: "user-1",
      roles: [
        {
          name: "user",
          permissions: [
            { action: "create", entity: "image", access: "own" },
            { action: "read", entity: "image", access: "any" },
          ],
        },
      ],
    };
    expect(canDeleteAnyImage(user)).toBe(false);
  });
});
