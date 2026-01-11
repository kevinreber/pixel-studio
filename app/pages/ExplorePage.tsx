import React from "react";
import {
  Form,
  useLoaderData,
  useSearchParams,
  Await,
  useNavigation,
  useAsyncValue,
} from "@remix-run/react";
import { type ExplorePageLoader } from "../routes/explore._index";
import { Loader2, Search as MagnifyingGlassIcon } from "lucide-react";
import {
  PageContainer,
  ImageCard,
  ErrorList,
  ImageGridSkeleton,
  PaginationControls,
} from "~/components";
import { type GetImagesResponse } from "~/server/getImages";
import type { ImageDetail } from "~/server/getImage";

const LoadingSkeleton = () => {
  return (
    <div className="flex flex-col h-full space-y-6 animate-pulse">
      {/* Search bar skeleton */}
      <div className="flex-shrink-0">
        <div className="flex rounded-md shadow-sm">
          <div className="w-full h-10 bg-gray-700/50 rounded-l-md" />
          <div className="w-12 h-10 bg-gray-700/50 rounded-r-md" />
        </div>
      </div>

      {/* Scrollable content skeleton */}
      <div className="flex-1 overflow-hidden">
        <ImageGridSkeleton />
      </div>
    </div>
  );
};

const ImageGrid = ({
  imagesData,
}: {
  imagesData: GetImagesResponse | undefined;
}) => {
  if (!imagesData) {
    return <ImageGridSkeleton />;
  }

  if (imagesData.status === "error") {
    return (
      <div className="text-center w-full block">
        <p className="text-red-500 mb-2">Error loading images</p>
        {imagesData.error && (
          <p className="text-sm text-gray-400">{imagesData.error}</p>
        )}
      </div>
    );
  }

  if (!imagesData.images || imagesData.images.length === 0) {
    return (
      <p className="text-center w-full block italic font-light">
        No images found
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-4 lg:gap-6">
      {imagesData.images.map(
        (image) =>
          image && (
            <li key={image.id} className="hover:!opacity-60">
              <ImageCard
                imageData={
                  {
                    ...image,
                    createdAt: image.createdAt,
                    private: null,
                    user: { id: image.userId, username: "", image: null },
                    comments: [],
                    likes: [],
                    setId: null,
                    blurURL: "",
                  } as ImageDetail
                }
              />
            </li>
          )
      )}
    </ul>
  );
};

const ExplorePageAccessor = () => {
  const imagesData = useAsyncValue() as GetImagesResponse | undefined;
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const initialSearchTerm = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = React.useState(initialSearchTerm);
  const isLoading = navigation.state !== "idle";

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Fixed Search Bar */}
      <div className="flex-shrink-0 w-full">
        <Form action="/explore" method="GET">
          <div className="mt-2 flex rounded-md shadow-sm">
            <div className="relative flex flex-grow items-stretch focus-within:z-10">
              <input
                type="text"
                name="q"
                id="q"
                className="bg-inherit block w-full rounded-l-md border-0 py-1.5 px-2 text-white ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-600 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              ) : (
                <MagnifyingGlassIcon
                  className="-ml-0.5 h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              )}
            </button>
          </div>
        </Form>

        {/* Results info */}
        {!isLoading && imagesData?.pagination && (
          <div className="flex justify-between items-center mt-4 mb-2">
            <div className="text-sm text-gray-400">
              {imagesData.pagination.totalCount > 0 ? (
                <>
                  Showing{" "}
                  {(imagesData.pagination.currentPage - 1) *
                    imagesData.pagination.pageSize +
                    1}{" "}
                  to{" "}
                  {Math.min(
                    imagesData.pagination.currentPage *
                      imagesData.pagination.pageSize,
                    imagesData.pagination.totalCount
                  )}{" "}
                  of {imagesData.pagination.totalCount.toLocaleString()} images
                  {initialSearchTerm && (
                    <span className="ml-2">
                      for &ldquo;
                      <span className="text-white">{initialSearchTerm}</span>
                      &rdquo;
                    </span>
                  )}
                </>
              ) : (
                <>No images found</>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Images Container */}
      <div className="flex-1 overflow-y-auto min-h-0 px-2 scroll-smooth">
        <div className="max-w-5xl mx-auto pb-4">
          {isLoading ? (
            <ImageGridSkeleton />
          ) : (
            <ImageGrid imagesData={imagesData} />
          )}
        </div>
      </div>

      {/* Fixed Pagination at Bottom */}
      {!isLoading && imagesData?.pagination && (
        <div className="flex-shrink-0 border-t border-border/20">
          <PaginationControls
            currentPage={imagesData.pagination.currentPage}
            totalPages={imagesData.pagination.totalPages}
            hasNextPage={imagesData.pagination.hasNextPage}
            hasPrevPage={imagesData.pagination.hasPrevPage}
            basePath="/explore"
            searchTerm={initialSearchTerm}
          />
        </div>
      )}
    </div>
  );
};

const ExplorePage = () => {
  const loaderData = useLoaderData<ExplorePageLoader>();
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";

  return (
    <PageContainer>
      <div className="flex flex-col h-[calc(100vh-6rem)] w-full max-w-5xl m-auto">
        {/* Fixed Header */}
        <div className="flex-shrink-0 pb-4">
          <h1 className="text-2xl font-semibold mb-2">Explore</h1>
        </div>

        <React.Suspense fallback={<LoadingSkeleton />}>
          <Await
            resolve={loaderData.imagesData}
            errorElement={
              <ErrorList errors={["There was an error loading images"]} />
            }
          >
            <div className="relative flex flex-col flex-1 min-h-0">
              {isNavigating && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                </div>
              )}
              <ExplorePageAccessor />
            </div>
          </Await>
        </React.Suspense>
      </div>
    </PageContainer>
  );
};

export default ExplorePage;
