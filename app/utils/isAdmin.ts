/**
 * Client-side admin check utilities
 *
 * These functions work with user data from loaders/hooks without
 * requiring server-side imports. Use these in React components.
 *
 * For server-side admin checks with database access, use:
 * import { isAdmin, canDeleteAnyImage } from "~/server/isAdmin.server";
 */

/**
 * User shape that includes roles
 */
export interface UserWithRoles {
  roles?: Array<{ name: string }>;
}

/**
 * Check if a user has admin role (client-side)
 * @param user - User object with roles array from loader data
 * @returns True if user has admin role
 */
export function isUserAdmin(user: UserWithRoles | null | undefined): boolean {
  if (!user?.roles) {
    return false;
  }
  return user.roles.some((role) => role.name.toLowerCase() === "admin");
}
