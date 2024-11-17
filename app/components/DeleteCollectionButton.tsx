import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { FetcherWithComponents, useFetcher } from "@remix-run/react";
import { toast } from "sonner";

interface DeleteCollectionButtonProps {
  collectionId: string;
  disabled?: boolean;
  fetcher: FetcherWithComponents<any>;
}

export function DeleteCollectionButton({
  collectionId,
  disabled = false,
  fetcher,
}: DeleteCollectionButtonProps) {
  const [open, setOpen] = React.useState(false);
  const isDeleting = fetcher.state !== "idle";

  const handleDelete = () => {
    fetcher.submit(
      {},
      {
        method: "DELETE",
        action: `/api/collections/${collectionId}`,
      }
    );
    setOpen(false);
    toast.success("Collection deleted successfully");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <DialogContent hideClose>
        <DialogHeader>
          <DialogTitle>Delete Collection</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this collection? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
