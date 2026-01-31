import { type LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { ShouldRevalidateFunctionArgs } from "@remix-run/react";
import UserProfilePage from "~/pages/UserProfilePage";
import { getUserDataByUserId, getUserFollowStats, isFollowing } from "~/server";
import { loader as UserLoaderData } from "../root";
import { invariantResponse } from "~/utils/invariantResponse";
import { PageContainer, GeneralErrorBoundary } from "~/components";
import { getCachedDataWithRevalidate } from "~/utils/cache.server";
import { getGoogleSessionAuth } from "~/services";

// Prevent revalidation after fetcher actions (like follow/unfollow)
// The UI handles optimistic updates, so we don't need to refetch all data
export const shouldRevalidate = ({
  formAction,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) => {
  // Don't revalidate after follow/unfollow actions - UI handles optimistic updates
  if (formAction?.includes("/follow")) {
    return false;
  }
  return defaultShouldRevalidate;
};

export const meta: MetaFunction<
  typeof loader,
  { root: typeof UserLoaderData }
> = ({ params, matches }) => {
  // TODO: Use user's username instead of userId so we can dynamically store it in our meta tag
  const userId = params.userId;

  // Incase our Profile loader ever fails, we can get logged in user data from root
  const userMatch = matches.find((match) => match.id === "root");
  // Root loader returns { userData, ENV, csrfToken, honeyProps }
  const rootData = userMatch?.data as { userData?: { username?: string; name?: string | null } } | undefined;
  const username =
    rootData?.userData?.username || rootData?.userData?.name || userId;

  return [
    { title: `${username} | Profile` },
    {
      name: "description",
      content: `Checkout ${username}'s AI generated images`,
    },
  ];
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const userId = params.userId || "";
  invariantResponse(userId, "UserId does not exist");

  const searchParams = new URL(request.url).searchParams;
  const currentPage = Math.max(Number(searchParams.get("page") || 1), 1);
  // Get most recent 250 images
  const pageSize = Number(searchParams.get("page_size")) || 250;

  // Get current logged-in user (if any)
  const sessionAuth = await getGoogleSessionAuth(request);
  const currentUserId = sessionAuth?.id || null;

  const cacheKey = `user-profile:${userId}:${currentPage}:${pageSize}`;
  const userDataPromise = getCachedDataWithRevalidate(cacheKey, () =>
    getUserDataByUserId(userId, currentPage, pageSize)
  );

  // Get follow stats
  const followStatsCacheKey = `user-follow-stats:${userId}`;
  const followStatsPromise = getCachedDataWithRevalidate(followStatsCacheKey, () =>
    getUserFollowStats(userId)
  );

  // Check if current user is following this profile
  const isFollowingPromise = currentUserId && currentUserId !== userId
    ? isFollowing({ followerId: currentUserId, followingId: userId })
    : Promise.resolve(false);

  return {
    userData: userDataPromise,
    followStats: followStatsPromise,
    isFollowing: isFollowingPromise,
    profileUserId: userId,
  };
};

export type UserProfilePageLoader = typeof loader;

export default function Index() {
  return <UserProfilePage />;
}

export const ErrorBoundary = () => {
  return (
    <PageContainer>
      <GeneralErrorBoundary
        statusHandlers={{
          403: () => <p>You do not have permission</p>,
          404: ({ params }) => (
            <p>User with id: &quot;{params.userId}&quot; does not exist</p>
          ),
        }}
      />
    </PageContainer>
  );
};
