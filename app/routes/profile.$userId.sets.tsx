import React from "react";
import { type LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import {
  useLoaderData,
  useNavigation,
  Link,
  Await,
  useAsyncValue,
  useSearchParams,
} from "@remix-run/react";
import {
  PageContainer,
  GeneralErrorBoundary,
  CopyToClipboardButton,
} from "~/components";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Cpu, Clock, Images, NotepadText, Video, ArrowLeft } from "lucide-react";
import { getUserSets, type Set } from "~/server/getUserSets";
import { getCachedDataWithRevalidate } from "~/utils/cache.server";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { convertUtcDateToLocalDateString } from "~/client";
import { invariantResponse } from "~/utils/invariantResponse";
import { prisma } from "~/services/prisma.server";

const MODEL_OPTIONS_SUBSTRING = [
  {
    name: "Stable Diffusion",
    value: "stable-diffusion",
  },
  {
    name: "DALL-E",
    value: "dall-e",
  },
  {
    name: "Flux",
    value: "flux",
  },
];

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const username = data?.username || "User";
  return [
    { title: `${username}'s Sets | Pixel Studio` },
    {
      name: "description",
      content: `View ${username}'s image generation sets`,
    },
  ];
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const userId = params.userId || "";
  invariantResponse(userId, "UserId does not exist");

  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, name: true },
  });

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  const url = new URL(request.url);
  const prompt = url.searchParams.get("prompt") || undefined;
  const model = url.searchParams.get("model") || undefined;

  const cacheKey = `sets:user:${userId}:${prompt}:${model}`;

  const sets = getCachedDataWithRevalidate(cacheKey, () =>
    getUserSets(userId, {
      prompt,
      model,
    })
  );

  return {
    sets,
    userId,
    username: user.username || user.name || "User",
  };
};

const MediaPreviewGrid = ({
  images,
  videos,
}: {
  images: Set["images"];
  videos: Set["videos"];
}) => {
  const allMedia = [
    ...images.map((img) => ({ ...img, type: "image" as const })),
    ...videos.map((vid) => ({ ...vid, type: "video" as const })),
  ];

  if (allMedia.length === 0) return null;

  const gridClassName =
    allMedia.length === 1
      ? "grid-cols-1"
      : allMedia.length <= 3
      ? "grid-rows-1 grid-cols-2"
      : "grid-cols-2";

  const itemsToShow = allMedia.length === 1 ? 1 : allMedia.length <= 3 ? 2 : 4;

  return (
    <div
      className={`grid ${gridClassName} gap-0.5 w-32 h-32 rounded-md overflow-hidden bg-muted`}
    >
      {allMedia.slice(0, itemsToShow).map((item) => (
        <div
          key={item.id}
          className={`relative ${
            allMedia.length <= 3 && allMedia.length > 1 ? "h-32" : "aspect-square"
          } overflow-hidden bg-muted`}
        >
          <div
            className="w-full h-full bg-muted"
            style={{
              backgroundImage: `url(${item.thumbnailUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          {item.type === "video" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Video className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const SetRow = ({ set }: { set: Set }) => {
  const model = set.images[0]?.model || set.videos[0]?.model || "Unknown";

  return (
    <TableRow data-testid="set-row">
      <td className="p-4 w-[160px]">
        <div className="flex">
          <Link
            to={`/sets/${set.id}`}
            prefetch="intent"
            className="text-foreground hover:text-blue-500 transition-colors line-clamp-2"
            data-testid="set-link"
          >
            <MediaPreviewGrid images={set.images} videos={set.videos} />
          </Link>
        </div>
      </td>
      <td className="p-4 max-w-52">
        <div className="flex flex-col items-start gap-1">
          <div className="text-sm flex items-center gap-1">
            <Cpu className="w-4 h-4 opacity-90" />
            <span className="text-muted-foreground">{model}</span>
          </div>
          <div className="w-full overflow-hidden flex items-center gap-1">
            <NotepadText className="w-4 h-4 flex-shrink-0 opacity-90" />
            <div className="flex items-center gap-2 min-w-0">
              <p
                className="truncate text-sm text-muted-foreground"
                title={set.prompt}
              >
                {set.prompt}
              </p>
              <CopyToClipboardButton stringToCopy={set.prompt} />
            </div>
          </div>
          {set.totalImages > 0 && (
            <div className="flex items-center gap-1">
              <Images className="w-4 h-4 opacity-90" />
              <p className="text-sm text-muted-foreground">
                {set.totalImages} image{set.totalImages !== 1 ? "s" : ""}
              </p>
            </div>
          )}
          {set.totalVideos > 0 && (
            <div className="flex items-center gap-1">
              <Video className="w-4 h-4 opacity-90" />
              <p className="text-sm text-muted-foreground">
                {set.totalVideos} video{set.totalVideos !== 1 ? "s" : ""}
              </p>
            </div>
          )}
          <div className="text-sm flex items-center gap-1">
            <Clock className="w-4 h-4 opacity-90" />
            <span className="text-muted-foreground">
              {convertUtcDateToLocalDateString(set.createdAt)}
            </span>
          </div>
        </div>
      </td>
    </TableRow>
  );
};

const SetsTableSkeleton = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-24 w-24 bg-gray-700/50" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 bg-gray-700/50" />
            <Skeleton className="h-4 w-1/2 bg-gray-700/50" />
          </div>
        </div>
      ))}
    </div>
  );
};

const SetsTable = ({ username }: { username: string }) => {
  const sets = useAsyncValue() as Awaited<ReturnType<typeof getUserSets>>;

  if (sets.sets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12" data-testid="empty-sets-message">
        <div className="p-4 text-center text-muted-foreground">
          {username} hasn&apos;t created any sets yet.
        </div>
      </div>
    );
  }

  return (
    <Table data-testid="sets-table">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[160px]">Preview</TableHead>
          <TableHead>Details</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sets.sets.map((set) => (
          <SetRow key={set.id} set={set} />
        ))}
      </TableBody>
    </Table>
  );
};

const SetFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isLoading = navigation.state !== "idle";

  const [formValues, setFormValues] = React.useState({
    prompt: searchParams.get("prompt") || "",
    model: searchParams.get("model") || undefined,
  });

  const handleInputChange = (
    key: keyof typeof formValues,
    value: string | undefined
  ) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSearchParams = new URLSearchParams();

    if (formValues.prompt) {
      newSearchParams.set("prompt", formValues.prompt);
    }
    if (formValues.model) {
      newSearchParams.set("model", formValues.model);
    }

    setSearchParams(newSearchParams);
  };

  const handleReset = () => {
    setFormValues({
      prompt: "",
      model: undefined,
    });
    setSearchParams(new URLSearchParams());
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-1 gap-3">
          <Input
            placeholder="Filter by prompt..."
            value={formValues.prompt}
            onChange={(e) => handleInputChange("prompt", e.target.value)}
            className="flex-1"
            disabled={isLoading}
          />

          <Select
            value={formValues.model}
            onValueChange={(value) => handleInputChange("model", value)}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Model" />
            </SelectTrigger>
            <SelectContent>
              {MODEL_OPTIONS_SUBSTRING.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isLoading}
            variant="outline"
            className="h-10 px-4 flex-1 sm:flex-none"
          >
            Apply Filters
          </Button>
          <Button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            className="h-10 px-4 flex-1 sm:flex-none"
          >
            Reset
          </Button>
        </div>
      </div>
    </form>
  );
};

export default function UserSetsPage() {
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state !== "idle";

  return (
    <PageContainer>
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12" data-testid="user-sets-page">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild data-testid="back-to-profile-button">
            <Link to={`/profile/${loaderData.userId}`} prefetch="intent">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold" data-testid="user-sets-title">{loaderData.username}&apos;s Sets</h1>
        </div>

        <SetFilters />

        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="relative min-h-[400px]">
              <React.Suspense fallback={<SetsTableSkeleton />}>
                <Await
                  resolve={loaderData.sets}
                  errorElement={
                    <div className="flex flex-col items-center justify-center">
                      <h1>Error loading sets</h1>
                    </div>
                  }
                >
                  <div className="relative">
                    {isLoading ? (
                      <SetsTableSkeleton />
                    ) : (
                      <SetsTable username={loaderData.username} />
                    )}
                  </div>
                </Await>
              </React.Suspense>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

export function ErrorBoundary() {
  return (
    <PageContainer>
      <GeneralErrorBoundary
        statusHandlers={{
          404: () => <p>User not found</p>,
        }}
      />
    </PageContainer>
  );
}
