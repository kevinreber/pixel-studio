import React from "react";
import { Form, useLoaderData, useSearchParams } from "@remix-run/react";
import { ErrorList } from "components/ErrorList";
import ImageV2 from "components/ImageV2";
import { type ExplorePageLoader } from "../routes/explore";
import { Search as MagnifyingGlassIcon } from "lucide-react";
import { PageContainer } from "~/components";

/**
 *
 * TODO: Try to get endless scroll working on this page. Use this blog for reference: https://dev.to/vetswhocode/infinite-scroll-with-remix-run-1g7
 */

const ExplorePage = () => {
  const loaderData = useLoaderData<ExplorePageLoader>();
  const images = loaderData.data.images || [];
  const [searchParams] = useSearchParams();
  const initialSearchTerm = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = React.useState(initialSearchTerm);

  return (
    <PageContainer>
      <div className="flex flex-col justify-between w-full max-w-5xl m-auto">
        <h1 className="text-2xl font-semibold">Explore</h1>
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
                className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-600"
              >
                <MagnifyingGlassIcon
                  className="-ml-0.5 h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </button>
            </div>
          </Form>
        </div>
      </div>
      <div className="container pt-8 max-w-5xl">
        {/* highlight on hover reference: https://www.hyperui.dev/blog/highlight-hover-effect-with-tailwindcss */}
        {images.length > 0 ? (
          <ul className="grid grid-cols-3 gap-1 lg:gap-4">
            {images.map(
              (image) =>
                // This removes Typescript error: "image is possibly 'null'."
                image && (
                  <li key={image.id} className="hover:!opacity-60">
                    <ImageV2 imageData={image} />
                  </li>
                )
            )}
          </ul>
        ) : (
          <p className="text-center w-full block italic font-light">
            No images found
          </p>
        )}

        {loaderData.data.status === "error" && (
          <ErrorList errors={["There was an error parsing the results"]} />
        )}
      </div>
    </PageContainer>
  );
};

export default ExplorePage;
