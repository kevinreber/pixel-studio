import React from "react";
import { Await, useLoaderData, useAsyncValue } from "@remix-run/react";
import { PageContainer, ErrorList, ImageCard } from "~/components";
import { SetPageLoader } from "~/routes/sets.$setId";
import { Skeleton } from "@/components/ui/skeleton";
import { convertUtcDateToLocalDateString } from "~/client";

const SetDetailsAccessor = () => {
  const asyncValue = useAsyncValue() as Awaited<SetPageLoader["data"]>;

  const setData = asyncValue ?? {
    images: [],
    prompt: "",
    createdAt: "",
    user: {},
  };

  const {
    images: setImages,
    prompt: setPrompt,
    createdAt: setCreatedAt,
    user: setUser,
  } = setData;

  return (
    <div className="flex flex-col justify-between w-full max-w-5xl m-auto">
      <h1 className="text-2xl font-semibold mb-4">Set Details</h1>
      <div className="w-full flex flex-col gap-4">
        <div>
          <div className="font-semibold">Prompt</div>
          <div className="text-sm italic text-zinc-300">{setPrompt}</div>
        </div>
        <div>
          <div className="font-semibold">Created At</div>
          <div className="text-sm text-zinc-300">
            {convertUtcDateToLocalDateString(setCreatedAt)} by{" "}
            <a
              className="font-semibold text-blue-500"
              href={`/profile/${setUser.username}`}
            >
              {setUser.username}
            </a>
          </div>
        </div>
        <div>
          <div className="font-semibold mb-2">Images</div>
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-4 lg:gap-6">
            {setImages.map((image) => (
              <li key={image.id} className="hover:!opacity-60">
                <ImageCard imageData={image} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const SetDetailsPage = () => {
  const loaderData = useLoaderData<SetPageLoader>();

  return (
    <PageContainer>
      <React.Suspense
        fallback={
          <div className="flex flex-col justify-between w-full max-w-5xl m-auto">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="w-full flex flex-col gap-4">
              <div>
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div>
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
              <div>
                <Skeleton className="h-6 w-24 mb-2" />
                <div className="grid grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square w-full" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        }
      >
        <Await
          resolve={loaderData.data}
          errorElement={
            <ErrorList
              errors={["There was an error loading the set details"]}
            />
          }
        >
          <SetDetailsAccessor />
        </Await>
      </React.Suspense>
    </PageContainer>
  );
};

export default SetDetailsPage;
