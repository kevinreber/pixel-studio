import React from "react";
import {
  Form,
  useLoaderData,
  useSearchParams,
  Await,
  useNavigation,
  useAsyncValue,
  useNavigate,
} from "@remix-run/react";
import {
  type ExplorePageLoader,
  MEDIA_TYPE_OPTIONS,
  MODEL_FILTER_OPTIONS,
} from "../routes/explore._index";
import { Loader2, Search as MagnifyingGlassIcon, Image, Video, X } from "lucide-react";
import {
  PageContainer,
  ImageCard,
  VideoCard,
  ErrorList,
  ImageGridSkeleton,
  PaginationControls,
} from "~/components";
import { type GetImagesResponse } from "~/server/getImages";
import type { ImageDetail } from "~/server/getImage";
import { cn } from "@/lib/utils";

// Filter chip component
const FilterChip = ({
  label,
  isActive,
  onClick,
  icon,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
      "border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
      isActive
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground hover:border-accent"
    )}
  >
    {icon}
    {label}
  </button>
);

// Active filter badge with remove button
const ActiveFilterBadge = ({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) => (
  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
    {label}
    <button
      type="button"
      onClick={onRemove}
      className="hover:bg-primary/20 rounded p-0.5 transition-colors"
    >
      <X className="w-3 h-3" />
    </button>
  </span>
);

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

const MediaGrid = ({
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
        <p className="text-red-500 mb-2">Error loading content</p>
        {imagesData.error && (
          <p className="text-sm text-gray-400">{imagesData.error}</p>
        )}
      </div>
    );
  }

  if (!imagesData.items || imagesData.items.length === 0) {
    return (
      <p className="text-center w-full block italic font-light">
        No images or videos found
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-4 lg:gap-6">
      {imagesData.items.map((item) =>
        item.type === "image" ? (
          <li key={item.id} className="hover:!opacity-60">
            <ImageCard
              imageData={
                {
                  ...item,
                  createdAt: item.createdAt,
                  private: null,
                  user: { id: item.userId, username: "", image: null },
                  comments: [],
                  likes: [],
                  setId: null,
                  // Keep blurURL from item spread - don't override with empty string
                } as ImageDetail
              }
            />
          </li>
        ) : (
          <li key={item.id} className="hover:!opacity-60">
            <VideoCard videoData={item} />
          </li>
        )
      )}
    </ul>
  );
};

const ExplorePageContent = () => {
  const imagesData = useAsyncValue() as GetImagesResponse | undefined;
  const navigation = useNavigation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearchTerm = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = React.useState(initialSearchTerm);
  const isLoading = navigation.state !== "idle";

  // Get current filter values
  const currentMediaType = searchParams.get("type") || "all";
  const currentModel = searchParams.get("model") || "";

  // Helper to update filters while preserving other params
  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "" || value === "all") {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    // Reset to page 1 when filters change
    newParams.delete("page");
    navigate(`/explore?${newParams.toString()}`);
  };

  // Get active filter labels for display
  const activeModelLabel = MODEL_FILTER_OPTIONS.find(
    (m) => m.value === currentModel
  )?.label;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Fixed Search Bar */}
      <div className="flex-shrink-0 w-full space-y-4">
        <Form action="/explore" method="GET">
          {/* Preserve current filters in the form */}
          {currentMediaType !== "all" && (
            <input type="hidden" name="type" value={currentMediaType} />
          )}
          {currentModel && (
            <input type="hidden" name="model" value={currentModel} />
          )}
          <div className="mt-2 flex rounded-md shadow-sm">
            <div className="relative flex flex-grow items-stretch focus-within:z-10">
              <input
                type="text"
                name="q"
                id="q"
                className="bg-inherit block w-full rounded-l-md border-0 py-1.5 px-3 text-white ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                placeholder="Search images and videos"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-600 hover:bg-gray-800 disabled:opacity-50 transition-colors"
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

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Media Type Filters */}
          <div className="flex items-center gap-1.5">
            {MEDIA_TYPE_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                label={option.label}
                isActive={currentMediaType === option.value}
                onClick={() => updateFilter("type", option.value)}
                icon={
                  option.value === "images" ? (
                    <Image className="w-3.5 h-3.5" />
                  ) : option.value === "videos" ? (
                    <Video className="w-3.5 h-3.5" />
                  ) : undefined
                }
              />
            ))}
          </div>

          {/* Separator */}
          <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

          {/* Model Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {MODEL_FILTER_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                label={option.label}
                isActive={currentModel === option.value}
                onClick={() => updateFilter("model", option.value)}
              />
            ))}
          </div>
        </div>

        {/* Active Filters Summary & Results Info */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Show active non-default filters */}
            {(currentMediaType !== "all" || currentModel) && (
              <>
                <span className="text-xs text-muted-foreground">
                  Active filters:
                </span>
                {currentMediaType !== "all" && (
                  <ActiveFilterBadge
                    label={
                      MEDIA_TYPE_OPTIONS.find((m) => m.value === currentMediaType)
                        ?.label || currentMediaType
                    }
                    onRemove={() => updateFilter("type", "all")}
                  />
                )}
                {activeModelLabel && currentModel && (
                  <ActiveFilterBadge
                    label={activeModelLabel}
                    onRemove={() => updateFilter("model", "")}
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    const newParams = new URLSearchParams();
                    if (initialSearchTerm) {
                      newParams.set("q", initialSearchTerm);
                    }
                    navigate(`/explore?${newParams.toString()}`);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear all
                </button>
              </>
            )}
          </div>

          {/* Results count */}
          {!isLoading && imagesData?.pagination && (
            <div className="text-sm text-muted-foreground">
              {imagesData.pagination.totalCount > 0 ? (
                <>
                  {imagesData.pagination.totalCount.toLocaleString()} items
                  {initialSearchTerm && (
                    <span className="ml-1">
                      for &ldquo;
                      <span className="text-foreground">{initialSearchTerm}</span>
                      &rdquo;
                    </span>
                  )}
                </>
              ) : (
                <>No content found</>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Content Container */}
      <div className="flex-1 overflow-y-auto min-h-0 px-2 scroll-smooth">
        <div className="max-w-5xl mx-auto pb-4">
          {isLoading ? (
            <ImageGridSkeleton />
          ) : (
            <MediaGrid imagesData={imagesData} />
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
              <ExplorePageContent />
            </div>
          </Await>
        </React.Suspense>
      </div>
    </PageContainer>
  );
};

export default ExplorePage;
