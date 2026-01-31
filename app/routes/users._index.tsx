import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { searchUsers, type SearchUsersResponse } from "~/server/searchUsers.server";
import { getFollowingSet } from "~/server/getUserFollowData.server";
import { getGoogleSessionAuth } from "~/services";
import UsersPage from "~/pages/UsersPage";

export interface UsersPageLoader {
  usersData: SearchUsersResponse & {
    users: Array<
      SearchUsersResponse["users"][number] & {
        isFollowedByCurrentUser: boolean;
      }
    >;
  };
  searchTerm: string;
  currentUserId: string | null;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const searchTerm = url.searchParams.get("q") || "";
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const pageSize = Math.max(
    Math.min(Number(url.searchParams.get("pageSize")) || 20, 50),
    10
  );

  // Get search results
  const usersData = await searchUsers(searchTerm, page, pageSize);

  // Get current user session
  const session = await getGoogleSessionAuth(request);
  const currentUserId = session?.id || null;

  // Check follow status for all users
  const userIds = usersData.users.map((u) => u.id);
  const followingSet = currentUserId
    ? await getFollowingSet(currentUserId, userIds)
    : new Set<string>();

  // Add follow status to users
  const usersWithFollowStatus = usersData.users.map((user) => ({
    ...user,
    isFollowedByCurrentUser: followingSet.has(user.id),
  }));

  return json<UsersPageLoader>({
    usersData: {
      ...usersData,
      users: usersWithFollowStatus,
    },
    searchTerm,
    currentUserId,
  });
};

export default UsersPage;
