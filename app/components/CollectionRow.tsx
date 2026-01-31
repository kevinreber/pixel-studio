import { Link, useFetcher } from "@remix-run/react";
import { TableCell, TableRow } from "@/components/ui/table";
import { EditCollectionDialog } from "~/components/EditCollectionDialog";
import { DeleteCollectionButton } from "~/components/DeleteCollectionButton";
import { convertNumberToLocaleString } from "~/utils/client";
import { Loader2 } from "lucide-react";

interface CollectionRowProps {
  collection: {
    id: string;
    title: string;
    description?: string | null;
    images?: { id: string }[];
    imageCount?: number;
  };
}

export function CollectionRow({ collection }: CollectionRowProps) {
  const editFetcher = useFetcher();
  const deleteFetcher = useFetcher();

  const isPending =
    editFetcher.state !== "idle" || deleteFetcher.state !== "idle";

  if (isPending) {
    return (
      <TableRow className="relative h-[64px]">
        <TableCell colSpan={4}>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className="h-[64px]">
      <TableCell>
        <Link
          to={`/collections/${collection.id}`}
          className="hover:underline font-medium"
          prefetch="intent"
        >
          {collection.title}
        </Link>
      </TableCell>
      <TableCell className="text-zinc-500">{collection.description}</TableCell>
      <TableCell className="text-right text-zinc-500">
        {convertNumberToLocaleString(collection.imageCount ?? collection.images?.length ?? 0)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-4">
          <EditCollectionDialog
            collection={collection}
            disabled={isPending}
            fetcher={editFetcher}
          />
          <DeleteCollectionButton
            collectionId={collection.id}
            disabled={isPending}
            fetcher={deleteFetcher}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
