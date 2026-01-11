import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil } from "lucide-react";
import { type FetcherWithComponents } from "@remix-run/react";
import { CollectionSchema } from "~/schemas/collection";
import { toast } from "sonner";

interface EditCollectionDialogProps {
  collection: {
    id: string;
    title: string;
    description?: string | null;
  };
  disabled?: boolean;
  fetcher: FetcherWithComponents<unknown>;
}

export function EditCollectionDialog({
  collection,
  disabled = false,
  fetcher,
}: EditCollectionDialogProps) {
  const [open, setOpen] = React.useState(false);
  const isPending = fetcher.state === "submitting";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
    };

    try {
      CollectionSchema.parse(data);
      fetcher.submit(formData, {
        method: "PUT",
        action: `/api/collections/${collection.id}`,
      });
      setOpen(false);
      toast.success("Collection updated successfully");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" disabled={disabled}>
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Collection</DialogTitle>
        </DialogHeader>
        <fetcher.Form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              name="title"
              defaultValue={collection.title}
              placeholder="Collection Title"
              disabled={isPending}
              required
              className="disabled:opacity-50"
            />
          </div>
          <div>
            <Textarea
              name="description"
              defaultValue={collection.description || ""}
              placeholder="Collection Description (optional)"
              disabled={isPending}
              className="disabled:opacity-50"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="min-w-[80px]">
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </fetcher.Form>
      </DialogContent>
    </Dialog>
  );
}
