import React from "react";
import {
  data,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import {
  useLoaderData,
  useNavigation,
  Form,
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
import { requireUserLogin } from "~/services/auth.server";
import { prisma } from "~/services/prisma.server";
import { Button } from "@/components/ui/button";
import { Logger } from "~/utils/logger.server";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { convertUtcDateToLocalDateString } from "~/client";
import { Cpu, Clock, Images, NotepadText, Trash2, Video } from "lucide-react";
import { getUserSets, type Set } from "~/server/getUserSets";
import { getCachedDataWithRevalidate, cacheDeletePattern } from "~/utils/cache.server";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { MODEL_OPTIONS } from "./create";

// We have some older models so making the model options a bit more flexible
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

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);
  const url = new URL(request.url);

  // Get filter params
  const prompt = url.searchParams.get("prompt") || undefined;
  const model = url.searchParams.get("model") || undefined;

  const cacheKey = `sets:user:${user.id}:${prompt}:${model}`;

  // Allow cache bypass with ?refresh=1 query param
  if (url.searchParams.get("refresh") === "1") {
    await cacheDeletePattern(`sets:user:${user.id}:*`);
  }

  const sets = getCachedDataWithRevalidate(cacheKey, () =>
    getUserSets(user.id, {
      prompt,
      model,
    })
  );

  return { sets };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);
  const formData = await request.formData();
  const setId = formData.get("setId") as string;

  if (!setId) {
    return data({ error: "Set ID is required" }, { status: 400 });
  }

  try {
    // Verify set ownership
    const set = await prisma.set.findUnique({
      where: { id: setId },
      select: { userId: true },
    });

    if (!set) {
      return data({ error: "Set not found" }, { status: 404 });
    }

    if (set.userId !== user.id) {
      Logger.warn({
        message: "Unauthorized attempt to delete set",
        metadata: { userId: user.id, setId },
      });
      return data(
        { error: "You don't have permission to delete this set" },
        { status: 403 }
      );
    }

    // Delete the set and its associated images
    await prisma.set.delete({
      where: { id: setId },
    });

    Logger.info({
      message: "Set deleted successfully",
      metadata: { userId: user.id, setId },
    });

    return data({ success: true });
  } catch (error) {
    Logger.error({
      message: "Error deleting set",
      error: error instanceof Error ? error : new Error(String(error)),
      metadata: { userId: user.id, setId },
    });
    return data({ error: "Failed to delete set" }, { status: 500 });
  }
}

const MediaPreviewGrid = ({
  images,
  videos,
}: {
  images: Set["images"];
  videos: Set["videos"];
}) => {
  // Combine images and videos for preview, prioritizing images
  const allMedia = [
    ...images.map((img) => ({ ...img, type: "image" as const })),
    ...videos.map((vid) => ({ ...vid, type: "video" as const })),
  ];

  if (allMedia.length === 0) return null;

  // Different grid layouts based on number of items
  const gridClassName =
    allMedia.length === 1
      ? "grid-cols-1" // Single item takes full space
      : allMedia.length <= 3
      ? "grid-rows-1 grid-cols-2" // 2 items side by side, full height
      : "grid-cols-2"; // 4 items in 2x2 grid

  // Determine how many items to show
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

const DeleteSetDialog = ({
  setId,
  imagesCount,
  videosCount,
}: {
  setId: string;
  imagesCount: number;
  videosCount: number;
}) => {
  const [open, setOpen] = React.useState(false);

  // Build description text
  const itemsDescription: string[] = [];
  if (imagesCount > 0) {
    itemsDescription.push(`${imagesCount} ${imagesCount === 1 ? "image" : "images"}`);
  }
  if (videosCount > 0) {
    itemsDescription.push(`${videosCount} ${videosCount === 1 ? "video" : "videos"}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Set</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this set? This will permanently
            delete this set and {itemsDescription.join(" and ")} associated with it. This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Form method="post" className="inline">
            <input type="hidden" name="setId" value={setId} />
            <Button type="submit" variant="destructive">
              Delete Set
            </Button>
          </Form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const SetRow = ({ set }: { set: Set }) => {
  // Get model from images first, then videos
  const model = set.images[0]?.model || set.videos[0]?.model || "Unknown";

  return (
    <TableRow>
      <td className="p-4 w-[160px]">
        <div className="flex">
          <Link
            to={`/sets/${set.id}`}
            prefetch="intent"
            className="text-foreground hover:text-blue-500 transition-colors line-clamp-2"
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
      <td className="p-4 flex items-center justify-end">
        <DeleteSetDialog
          setId={set.id}
          imagesCount={set.totalImages}
          videosCount={set.totalVideos}
        />
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
          <Skeleton className="h-8 w-20 bg-gray-700/50" />
        </div>
      ))}
    </div>
  );
};

const SetsTable = () => {
  const sets = useAsyncValue() as Awaited<ReturnType<typeof getUserSets>>;

  if (sets.sets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="p-4 text-center text-muted-foreground">
          No image sets found. Create your first image set to get started!
        </div>
        <div className="p-4 text-center text-muted-foreground">
          <Button
            className="mt-4 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            asChild
          >
            <Link to="/create" prefetch="intent">
              Create Your First Image
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[160px]">Preview</TableHead>
          <TableHead>Details</TableHead>
          <TableHead className="w-[100px] text-right">Actions</TableHead>
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

  // Local state for form values
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
              {/* <SelectItem value="dall-e">DALL-E</SelectItem> */}
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

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state !== "idle";

  return (
    <PageContainer>
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Sets</h1>
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
                    {isLoading ? <SetsTableSkeleton /> : <SetsTable />}
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
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 mb-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Sets</h1>
        </div>
      </div>
      <GeneralErrorBoundary />
    </PageContainer>
  );
}
