import React from "react";
import { Await, useLoaderData, useAsyncValue } from "@remix-run/react";
import { PageContainer, ErrorList } from "~/components";
import { SetPageLoader } from "~/routes/set.$setId";
import { Skeleton } from "@/components/ui/skeleton";

const Image = ({
  src,
  alt,
  size = 24,
}: {
  src: string;
  alt: string;
  size?: number;
}) => {
  return (
    <div
      className="relative overflow-hidden m-auto w-full h-full"
      style={{ maxWidth: size, maxHeight: size }}
    >
      <img
        className="inset-0 object-cover cursor-pointer w-full h-full"
        src={src}
        alt={alt}
        loading="lazy"
      />
    </div>
  );
};

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
            {setCreatedAt} by{" "}
            <a className="font-semibold text-blue-500" href="/">
              {setUser.username}
            </a>
          </div>
        </div>
        <div>
          <div className="font-semibold mb-2">Images</div>
          <div className="flex flex-wrap gap-4">
            {setImages.map((image) => (
              <div key={image.id}>
                <Image src={image.url} alt={image.title} size={200} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SetDetailsPage = () => {
  const loaderData = useLoaderData<SetPageLoader>();
  console.log("loaderData", loaderData);
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
