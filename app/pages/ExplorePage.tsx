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
} from "~/components";
import { ImageTagType } from "~/server/getImages";

const LoadingSkeleton = () => {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Search bar skeleton */}
      <div className="flex rounded-md shadow-sm">
        <div className="w-full h-10 bg-gray-700/50 rounded-l-md" />
        <div className="w-12 h-10 bg-gray-700/50 rounded-r-md" />
      </div>

      {/* Content skeleton */}
      <ImageGridSkeleton />
    </div>
  );
};

const ImageGrid = ({ images }: { images: ImageTagType[] }) => {
  if (!images || images.length === 0) {
    return (
      <p className="text-center w-full block italic font-light">
        No images found
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-4 lg:gap-6">
      {images.map(
        (image) =>
          image && (
            <li key={image.id} className="hover:!opacity-60">
              <ImageCard imageData={image} />
            </li>
          )
      )}
    </ul>
  );
};

const ExplorePageAccessor = () => {
  const asyncData = useAsyncValue() as ExplorePageLoader;
  const images = asyncData.images as unknown as ImageTagType[];
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const initialSearchTerm = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = React.useState(initialSearchTerm);
  const isLoading = navigation.state !== "idle";

  return (
    <div>
      <div className="w-full">
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
      </div>

      <div className="container pt-8 max-w-5xl">
        {isLoading ? <ImageGridSkeleton /> : <ImageGrid images={images} />}
      </div>
    </div>
  );
};

type ExplorePageLoaderData = Awaited<ExplorePageLoader>;

const ExplorePage = () => {
  const loaderData = useLoaderData() as ExplorePageLoaderData;

  return (
    <PageContainer>
      <div className="flex flex-col justify-between w-full max-w-5xl m-auto">
        <h1 className="text-2xl font-semibold mb-2">Explore</h1>
        <React.Suspense fallback={<LoadingSkeleton />}>
          <Await
            resolve={loaderData.images}
            errorElement={
              <ErrorList errors={["There was an error loading images"]} />
            }
          >
            <ExplorePageAccessor />
          </Await>
        </React.Suspense>
      </div>
    </PageContainer>
  );
};

export default ExplorePage;
