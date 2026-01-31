import { prisma } from "~/services";

/**
 * User with roles data shape from getLoggedInUserData
 */
interface UserWithRoles {
  id: string;
  roles: Array<{
    name: string;
    permissions?: Array<{
      action: string;
      entity: string;
      access: string;
    }>;
  }>;
  featureFlags?: string[];
}

/**
 * Check if a user has admin role
 * @param user - User object with roles array
 * @returns True if user has admin role
 */
export function isAdmin(user: UserWithRoles | null | undefined): boolean {
  if (!user?.roles) {
    return false;
  }
  return user.roles.some(
    (role) => role.name.toLowerCase() === "admin"
  );
}

/**
 * Check if a user has a specific permission
 * @param user - User object with roles and permissions
 * @param action - The action to check (e.g., "delete")
 * @param entity - The entity to check (e.g., "image")
 * @param access - The access level to check (e.g., "any" for any image, "own" for own images only)
 * @returns True if user has the permission
 */
export function hasPermission(
  user: UserWithRoles | null | undefined,
  action: string,
  entity: string,
  access: string
): boolean {
  if (!user?.roles) {
    return false;
  }

  return user.roles.some((role) =>
    role.permissions?.some(
      (permission) =>
        permission.action === action &&
        permission.entity === entity &&
        permission.access === access
    )
  );
}

/**
 * Check if a user can delete any image (admin permission)
 * This checks for the "delete" action on "image" entity with "any" access
 * @param user - User object with roles and permissions
 * @returns True if user can delete any image
 */
export function canDeleteAnyImage(user: UserWithRoles | null | undefined): boolean {
  // Admin role always has this permission
  if (isAdmin(user)) {
    return true;
  }
  // Or check explicit permission
  return hasPermission(user, "delete", "image", "any");
}

/**
 * Fetch user with roles from database by ID
 * Useful when you only have a user ID and need to check permissions
 * @param userId - The user ID to look up
 * @returns User with roles or null if not found
 */
export async function getUserWithRoles(
  userId: string
): Promise<UserWithRoles | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      roles: {
        select: {
          name: true,
          permissions: {
            select: {
              action: true,
              entity: true,
              access: true,
            },
          },
        },
      },
    },
  });

  return user;
}

/**
 * Check if a user has a specific feature flag enabled
 * @param user - User object with featureFlags array
 * @param flag - The feature flag key to check (e.g., "new_ui", "video_beta")
 * @returns True if user has the feature flag
 *
 * @example
 * // In a loader or component:
 * if (hasFeatureFlag(user, "new_generation_ui")) {
 *   // Show new UI
 * }
 *
 * // To enable a flag for a user, update via Prisma:
 * await prisma.user.update({
 *   where: { id: userId },
 *   data: { featureFlags: { push: "new_generation_ui" } }
 * });
 */
export function hasFeatureFlag(
  user: UserWithRoles | null | undefined,
  flag: string
): boolean {
  if (!user?.featureFlags) {
    return false;
  }
  return user.featureFlags.includes(flag);
}
