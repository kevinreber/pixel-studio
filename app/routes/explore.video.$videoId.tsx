import { type LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useNavigate, useLoaderData } from "@remix-run/react";
import { getVideo } from "~/server";
import { invariantResponse } from "~/utils";
import ExploreVideoDetailsPage from "~/pages/ExploreVideoDetailsPage";
import { GeneralErrorBoundary, PageContainer } from "~/components";
import { requireUserLogin } from "~/services";
import { getCachedDataWithRevalidate } from "~/utils/cache.server";
import {
  generateVideoMetaTags,
  generateVideoSchema,
  generateBreadcrumbSchema,
  serializeSchema,
  SITE_CONFIG,
} from "~/utils/seo";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.data) {
    return [{ title: "Video Not Found | Pixel Studio AI" }];
  }

  const video = data.data;
  return generateVideoMetaTags({
    id: video.id ?? "",
    prompt: video.prompt ?? "",
    title: video.title,
    model: video.model,
    user: video.user,
    sourceImageUrl: video.sourceImageUrl,
  });
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
  const { data } = useLoaderData<typeof loader>();

  const handleCloseModal = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/explore");
    }
  };

  // Generate structured data for SEO
  const videoSchema = generateVideoSchema({
    id: data.id ?? "",
    prompt: data.prompt ?? "",
    title: data.title,
    createdAt: data.createdAt ?? new Date().toISOString(),
    sourceImageUrl: data.sourceImageUrl,
    user: data.user,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: SITE_CONFIG.url },
    { name: "Explore", url: `${SITE_CONFIG.url}/explore` },
    { name: data.title || "Video", url: `${SITE_CONFIG.url}/explore/video/${data.id ?? ""}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeSchema([videoSchema, breadcrumbSchema]),
        }}
      />
      <ExploreVideoDetailsPage onClose={handleCloseModal} />
    </>
  );
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
