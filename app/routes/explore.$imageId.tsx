import {
  type LoaderFunctionArgs,
  defer,
  type SerializeFrom,
  MetaFunction,
} from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { getImage } from "~/server";
import { invariantResponse } from "~/utils";
import ExploreImageDetailsPage from "~/pages/ExploreImageDetailsPage";
import { GeneralErrorBoundary, PageContainer } from "~/components";
import { prisma } from "~/services/prisma.server";
import { requireUserLogin } from "~/services";

export const meta: MetaFunction = () => {
  return [{ title: "Explore AI Generated Images" }];
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const imageId = params.imageId || "";
  invariantResponse(imageId, "Image does not exist");

  // Try to get user, but don't require login
  let user: any = null;
  try {
    user = await requireUserLogin(request);
  } catch {
    // User is not logged in, which is fine
  }

  // Get image data and collection info in parallel
  const [image, collections] = await Promise.all([
    getImage(imageId),
    user && user.id
      ? prisma.collection.findMany({
          where: {
            userId: user.id,
          },
          select: {
            id: true,
            title: true,
            _count: {
              select: {
                images: true,
              },
            },
            images: {
              where: {
                imageId: imageId,
              },
              select: {
                id: true,
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  // Transform the data to include collection info
  const collectionsWithSaveStatus = collections.map((collection) => ({
    id: collection.id,
    title: collection.title,
    imageCount: collection._count.images,
    hasImage: collection.images.length > 0,
  }));

  return defer({
    data: {
      ...image,
      collections: collectionsWithSaveStatus,
      savedToCollection: collectionsWithSaveStatus.some((c) => c.hasImage),
    },
  });
};

export type ExplorePageImageLoader = SerializeFrom<typeof loader>;

export default function Index() {
  const navigate = useNavigate();

  const handleCloseModal = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/explore");
    }
  };

  return <ExploreImageDetailsPage onClose={handleCloseModal} />;
}

export const ErrorBoundary = () => {
  return (
    <PageContainer>
      <GeneralErrorBoundary
        statusHandlers={{
          403: () => <p>You do not have permission</p>,
          404: ({ params }) => (
            <p>Image with id: &quot;{params.imageId}&quot; does not exist</p>
          ),
        }}
      />
    </PageContainer>
  );
};
