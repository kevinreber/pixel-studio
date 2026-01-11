import React from "react";
import {
  Await,
  useLoaderData,
  useAsyncValue,
  Link,
  useNavigation,
} from "@remix-run/react";
import { PageContainer, ErrorList, ImageCard, ModelBadge } from "~/components";
import { SetPageLoader } from "~/routes/sets.$setId";
import { Skeleton } from "@/components/ui/skeleton";
import { convertUtcDateToLocalDateString } from "~/client";
import {
  Loader2,
  Cpu,
  Palette,
  Images,
  NotepadText,
  Clock,
  Coins,
} from "lucide-react";
import { getModelCreditCost } from "~/config/pricing";

interface SetImage {
  id: string;
  model: string | null;
  stylePreset: string | null;
  prompt: string;
  title: string | null;
  private: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  setId: string | null;
  url: string;
  thumbnailURL: string;
}

interface SetData {
  images: SetImage[];
  prompt: string;
  createdAt: Date | string;
  user: {
    id: string;
    username: string;
  };
}

const SetDetailsAccessor = () => {
  const asyncValue = useAsyncValue() as SetData | never[];
  const isError = Array.isArray(asyncValue);

  const setData = isError
    ? { images: [], prompt: "", createdAt: "", user: { id: "", username: "" } }
    : asyncValue;

  const {
    images: setImages,
    prompt: setPrompt,
    createdAt: setCreatedAt,
    user: setUser,
  } = setData;
  const model = setImages?.[0]?.model || "";
  const style = setImages?.[0]?.stylePreset || "";
  const imageCount = setImages?.length || 0;
  const creditCostPerImage = model ? getModelCreditCost(model) : 0;
  const totalCost = creditCostPerImage * imageCount;
  const [formattedDate, setFormattedDate] = React.useState(
    typeof setCreatedAt === "string"
      ? setCreatedAt
      : convertUtcDateToLocalDateString(setCreatedAt)
  );

  React.useEffect(() => {
    if (setCreatedAt) {
      setFormattedDate(convertUtcDateToLocalDateString(setCreatedAt));
    }
  }, [setCreatedAt]);

  if (isError) {
    return <ErrorList errors={["Set not found"]} />;
  }

  return (
    <div className="flex flex-col justify-between w-full max-w-5xl m-auto">
      <h1 className="text-2xl font-semibold mb-4">Set Details</h1>
      <div className="w-full flex flex-col gap-4">
        <div>
          <div className="text-xl flex items-center gap-2">
            <NotepadText className="w-4 h-4" />
            Prompt
          </div>
          <div className="text-sm italic text-zinc-300">{setPrompt}</div>
        </div>
        <div>
          <div className="text-xl flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            Model
          </div>
          <div className="mt-1">
            <ModelBadge model={model} size="md" />
          </div>
        </div>
        {style && (
          <div>
            <div className="text-xl flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Style
            </div>
            <div className="text-sm text-zinc-300">{style}</div>
          </div>
        )}
        <div>
          <div className="text-xl flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Created On
          </div>
          <div className="text-sm text-zinc-300">
            {formattedDate} by{" "}
            <Link
              to={`/profile/${setUser.id}`}
              className="font-semibold text-blue-500"
              prefetch="intent"
            >
              {setUser.username}
            </Link>
          </div>
        </div>
        <div>
          <div className="text-xl flex items-center gap-2">
            <Coins className="w-4 h-4" />
            Cost
          </div>
          <div className="text-sm text-zinc-300 flex items-center gap-2">
            <span className="text-amber-400 font-medium">
              {totalCost} credit{totalCost !== 1 ? "s" : ""}
            </span>
            <span className="text-zinc-500">
              ({creditCostPerImage} per image × {imageCount} image
              {imageCount !== 1 ? "s" : ""})
            </span>
          </div>
        </div>
        <div>
          <div className="text-xl mb-2 flex items-center gap-2">
            <Images className="w-4 h-4" />
            Images
          </div>
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-4 lg:gap-6">
            {setImages.map((image) => (
              <li key={image.id} className="hover:!opacity-60">
                <ImageCard
                  imageData={{
                    ...image,
                    blurURL: "",
                    user: setUser as { id: string; username: string; image: string | null },
                    comments: [],
                    likes: [],
                  }}
                />
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
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";

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
          <div className="relative">
            {isNavigating && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              </div>
            )}
            <SetDetailsAccessor />
          </div>
        </Await>
      </React.Suspense>
    </PageContainer>
  );
};

export default SetDetailsPage;
