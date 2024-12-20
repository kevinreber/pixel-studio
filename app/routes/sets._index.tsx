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
import { Loader2, Trash2 } from "lucide-react";

type Set = {
  id: string;
  prompt: string;
  createdAt: string | Date;
  images: Array<{
    id: string;
    prompt: string;
    thumbnailUrl: string;
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
      thumbnailUrl: getS3BucketThumbnailURL(image.id),
    }));

    formattedData.push({
      ...set,
      // createdAt: set.createdAt.toISOString(),
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

  return (
    <div className="grid grid-cols-2 gap-0.5 w-24 h-24 rounded-md overflow-hidden bg-muted">
      {images.slice(0, 4).map((image) => (
        <div
          key={image.id}
          className="relative aspect-square overflow-hidden bg-muted"
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
      <td className="p-4">
        <div className="flex items-center gap-4">
          <Link
            to={`/sets/${set.id}`}
            prefetch="intent"
            className="text-foreground hover:text-blue-500 transition-colors line-clamp-2"
          >
            <ImagePreviewGrid images={set.images} />
          </Link>
          <div className="flex flex-1 line-clamp-2">
            {set.prompt}
            <span className="ml-2">
              <CopyToClipboardButton stringToCopy={set.prompt} />
            </span>
          </div>
        </div>
      </td>
      <td className="p-4 text-right whitespace-nowrap">{set.images.length}</td>
      <td className="p-4 whitespace-nowrap">
        {convertUtcDateToLocalDateString(set.createdAt)}
      </td>
      <td className="p-4 flex items-center justify-end">
        <DeleteSetDialog setId={set.id} imagesCount={set.images.length} />
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
      <div className="p-4 text-center text-muted-foreground">
        No sets found. Create your first set to get started!
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Prompt</TableHead>
          <TableHead className="text-right">Images</TableHead>
          <TableHead>Created</TableHead>
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
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Sets</h1>
          <Link
            to="/create"
            prefetch="intent"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
          >
            Create New Set
          </Link>
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
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8 mb-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Sets</h1>
          <Link
            to="/create"
            prefetch="intent"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
          >
            Create New Set
          </Link>
        </div>
      </div>
      <GeneralErrorBoundary />
    </PageContainer>
  );
}
