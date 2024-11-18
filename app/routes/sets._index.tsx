import React from "react";
import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, useNavigation, Form } from "@remix-run/react";
import { PageContainer, GeneralErrorBoundary } from "~/components";
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
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Set = {
  id: string;
  prompt: string;
  createdAt: string;
  images: Array<{ id: string }>;
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
        select: {
          id: true,
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

  return json({ sets });
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

const SetsTableSkeleton = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-6 w-48 bg-gray-700/50" />
          <Skeleton className="h-6 flex-1 bg-gray-700/50" />
          <Skeleton className="h-6 w-16 bg-gray-700/50" />
          <Skeleton className="h-8 w-20 bg-gray-700/50" />
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
        <a
          href={`/set/${set.id}`}
          className="text-foreground hover:text-blue-500 transition-colors"
        >
          {set.prompt}
        </a>
      </td>
      <td className="p-4 text-right">{set.images.length}</td>
      <td className="p-4">
        {new Date(set.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </td>
      <td className="p-4 flex items-center justify-end">
        <DeleteSetDialog setId={set.id} imagesCount={set.images.length} />
      </td>
    </TableRow>
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

export default function SetsPage() {
  const { sets } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state !== "idle";

  return (
    <PageContainer>
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Sets</h1>
          <a
            href="/create"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
          >
            Create New Set
          </a>
        </div>

        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="relative min-h-[400px]">
              {isLoading ? <SetsTableSkeleton /> : <SetsTable sets={sets} />}
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
          <a
            href="/create"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
          >
            Create New Set
          </a>
        </div>
      </div>
      <GeneralErrorBoundary />
    </PageContainer>
  );
}
