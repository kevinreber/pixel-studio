import { prisma } from "~/services/prisma.server";

export interface SearchUserResult {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  _count: {
    images: number;
    followedBy: number;
  };
}

export interface SearchUsersResponse {
  users: SearchUserResult[];
  pagination: {
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    pageSize: number;
  };
}

const DEFAULT_PAGE_SIZE = 20;

/**
 * Search for users by username or name
 * @param searchTerm - The search term to match against username or name
 * @param page - Current page number (1-indexed)
 * @param pageSize - Number of results per page
 * @returns Paginated list of matching users
 */
export const searchUsers = async (
  searchTerm: string = "",
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<SearchUsersResponse> => {
  const skip = (page - 1) * pageSize;

  // Build the where clause for searching
  const whereClause = searchTerm
    ? {
        OR: [
          { username: { contains: searchTerm, mode: "insensitive" as const } },
          { name: { contains: searchTerm, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
        _count: {
          select: {
            images: true,
            followedBy: true,
          },
        },
      },
      orderBy: [
        // Prioritize users with more followers
        { followedBy: { _count: "desc" } },
        // Then by creation date
        { createdAt: "desc" },
      ],
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    users,
    pagination: {
      totalCount,
      currentPage: page,
      totalPages,
      hasNextPage: skip + users.length < totalCount,
      hasPrevPage: page > 1,
      pageSize,
    },
  };
};
