import { type LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import UserProfilePage from "~/pages/UserProfilePage";
import { getUserDataByUserId } from "~/server";
import { loader as UserLoaderData } from "../root";
import { invariantResponse } from "~/utils/invariantResponse";
import { PageContainer, GeneralErrorBoundary } from "~/components";
import { getCachedDataWithRevalidate } from "~/utils/cache.server";
export const meta: MetaFunction<
  typeof loader,
  { root: typeof UserLoaderData }
> = ({ params, matches }) => {
  // TODO: Use user's username instead of userId so we can dynamically store it in our meta tag
  const userId = params.userId;

  // Incase our Profile loader ever fails, we can get logged in user data from root
  const userMatch = matches.find((match) => match.id === "root");
  const username =
    userMatch?.data.data?.username || userMatch?.data.data?.name || userId;

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

  const cacheKey = `user-profile:${userId}:${currentPage}:${pageSize}`;
  const userDataPromise = getCachedDataWithRevalidate(cacheKey, () =>
    getUserDataByUserId(userId, currentPage, pageSize)
  );

  return {
    userData: userDataPromise,
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
