import { type LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { getVideo } from "~/server";
import { invariantResponse } from "~/utils";
import ExploreVideoDetailsPage from "~/pages/ExploreVideoDetailsPage";
import { GeneralErrorBoundary, PageContainer } from "~/components";
import { requireUserLogin } from "~/services";
import { getCachedDataWithRevalidate } from "~/utils/cache.server";

export const meta: MetaFunction = () => {
  return [{ title: "Explore AI Generated Videos" }];
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const videoId = params.videoId || "";
  invariantResponse(videoId, "Video does not exist");

  // Try to get user, but don't require login
  let user: { id: string } | null = null;
  try {
    user = await requireUserLogin(request);
  } catch {
    // User is not logged in, which is fine
  }

  const videoDetailsCacheKey = `video-details:${videoId}`;
  const video = await getCachedDataWithRevalidate(videoDetailsCacheKey, () =>
    getVideo(videoId)
  );

  return {
    data: {
      ...video,
    },
    userId: user?.id || null,
  };
};

export type ExplorePageVideoLoader = typeof loader;

export default function Index() {
  const navigate = useNavigate();

  const handleCloseModal = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/explore");
    }
  };

  return <ExploreVideoDetailsPage onClose={handleCloseModal} />;
}

export const ErrorBoundary = () => {
  return (
    <PageContainer>
      <GeneralErrorBoundary
        statusHandlers={{
          403: () => <p>You do not have permission</p>,
          404: ({ params }) => (
            <p>Video with id: &quot;{params.videoId}&quot; does not exist</p>
          ),
        }}
      />
    </PageContainer>
  );
};
