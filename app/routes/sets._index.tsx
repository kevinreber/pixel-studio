import React from "react";
import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, useNavigation, Form, Link } from "@remix-run/react";
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
import { getS3BucketThumbnailURL } from "~/utils/s3Utils";
import { convertUtcDateToLocalDateString } from "~/client";
import {
  Bot,
  Bot,
  Clock,
  Images,
  Loader2,
  NotepadText,
  Trash2,
} from "lucide-react";

type Set = {
  id: string;
  prompt: string;
  createdAt: string | Date;
  totalImages: number;
  images: Array<{
    id: string;
    prompt: string;
    thumbnailUrl: string;
    model: string;
  }>;
  user: { username: string };
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);

  const sets = await prisma.set.findMany({
    where: {
      userId: user.id,
    },
    include: {
      images: {
        take: 4,
        select: {
          id: true,
          prompt: true,
          model: true,
        },
      },
      _count: {
        select: {
          images: true,
        },
      },
      user: {
        select: {
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedData: Array<Set> = [];
  for (const set of sets) {
    const formattedImages = set.images.map((image) => ({
      ...image,
      model: image.model || "",
      thumbnailUrl: getS3BucketThumbnailURL(image.id),
    }));

    formattedData.push({
      ...set,
      totalImages: set._count.images,
      images: formattedImages,
    });
  }

  return json({ sets: formattedData });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);
  const formData = await request.formData();
  const setId = formData.get("setId") as string;

  if (!setId) {
    return json({ error: "Set ID is required" }, { status: 400 });
  }

  try {
    // Verify set ownership
    const set = await prisma.set.findUnique({
      where: { id: setId },
      select: { userId: true },
    });

    if (!set) {
      return json({ error: "Set not found" }, { status: 404 });
    }

    if (set.userId !== user.id) {
      Logger.warn({
        message: "Unauthorized attempt to delete set",
        metadata: { userId: user.id, setId },
      });
      return json(
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

    return json({ success: true });
  } catch (error) {
    Logger.error({
      message: "Error deleting set",
      error: error instanceof Error ? error : new Error(String(error)),
      metadata: { userId: user.id, setId },
    });
    return json({ error: "Failed to delete set" }, { status: 500 });
  }
}

const ImagePreviewGrid = ({ images }: { images: Set["images"] }) => {
  if (images.length === 0) return null;

  // Different grid layouts based on number of images
  const gridClassName =
    images.length === 1
      ? "grid-cols-1" // Single image takes full space
      : images.length <= 3
      ? "grid-rows-1 grid-cols-2" // 2 images side by side, full height
      : "grid-cols-2"; // 4 images in 2x2 grid

  // Determine how many images to show
  const imagesToShow = images.length === 1 ? 1 : images.length <= 3 ? 2 : 4;

  return (
    <div
      className={`grid ${gridClassName} gap-0.5 w-32 h-32 rounded-md overflow-hidden bg-muted`}
    >
      {images.slice(0, imagesToShow).map((image) => (
        <div
          key={image.id}
          className={`relative ${
            images.length <= 3 && images.length > 1 ? "h-32" : "aspect-square"
          } overflow-hidden bg-muted`}
        >
          <div
            className="w-full h-full bg-muted"
            style={{
              backgroundImage: `url(${image.thumbnailUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        </div>
      ))}
    </div>
  );
};

const DeleteSetDialog = ({
  setId,
  imagesCount,
}: {
  setId: string;
  imagesCount: number;
}) => {
  const [open, setOpen] = React.useState(false);

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
            delete this set and {imagesCount}{" "}
            {imagesCount === 1 ? "image" : "images"} associated with it. This
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
  return (
    <TableRow>
      <td className="p-4 w-[160px]">
        <div className="flex">
          <Link
            to={`/sets/${set.id}`}
            prefetch="intent"
            className="text-foreground hover:text-blue-500 transition-colors line-clamp-2"
          >
            <ImagePreviewGrid images={set.images} />
          </Link>
        </div>
      </td>
      <td className="p-4 max-w-52">
        <div className="flex flex-col items-start gap-1">
          <div className="text-sm flex items-center gap-1">
            <Bot className="w-4 h-4 opacity-90" />
            <span className="text-muted-foreground">{set.images[0].model}</span>
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
          <div className="flex items-center gap-1">
            <Images className="w-4 h-4 opacity-90" />
            <p className="text-sm text-muted-foreground">
              {set.totalImages} total image(s)
            </p>
          </div>
          <div className="text-sm flex items-center gap-1">
            <Clock className="w-4 h-4 opacity-90" />
            <span className="text-muted-foreground">
              {convertUtcDateToLocalDateString(set.createdAt)}
            </span>
          </div>
        </div>
      </td>
      <td className="p-4 flex items-center justify-end">
        <DeleteSetDialog setId={set.id} imagesCount={set.totalImages} />
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

const SetsTable = ({ sets }: { sets: Array<Set> }) => {
  if (sets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="p-4 text-center text-muted-foreground">
          No image sets found. Create your first image set to get started!
        </div>
        <div className="p-4 text-center text-muted-foreground">
          <Link
            to="/create"
            prefetch="intent"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
          >
            Create New Image
          </Link>
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
        {sets.map((set) => (
          <SetRow key={set.id} set={set} />
        ))}
      </TableBody>
    </Table>
  );
};

export default function Index() {
  const { sets } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state !== "idle";

  return (
    <PageContainer>
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Sets</h1>
        </div>

        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="relative min-h-[400px]">
              {isLoading ? (
                <SetsTableSkeleton />
              ) : (
                <div className="relative">
                  {isLoading && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    </div>
                  )}
                  <SetsTable sets={sets} />
                </div>
              )}
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
