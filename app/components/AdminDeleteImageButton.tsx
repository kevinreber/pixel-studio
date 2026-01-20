import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, ShieldAlert, Loader2 } from "lucide-react";
import { useFetcher } from "@remix-run/react";
import { toast } from "sonner";

interface AdminDeleteImageButtonProps {
  imageId: string;
  imageTitle?: string | null;
  disabled?: boolean;
  onDeleted?: () => void;
}

// Discriminated union for type-safe response handling
type DeleteResponse =
  | { success: true; message: string; deletionLogId: string }
  | { success: false; error: string }
  | { error: string }; // For non-success responses without success field

export function AdminDeleteImageButton({
  imageId,
  imageTitle,
  disabled = false,
  onDeleted,
}: AdminDeleteImageButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const fetcher = useFetcher<DeleteResponse>();
  const isDeleting = fetcher.state !== "idle";

  React.useEffect(() => {
    if (!fetcher.data) return;

    if ("success" in fetcher.data && fetcher.data.success === true) {
      toast.success("Image deleted successfully");
      setOpen(false);
      setReason("");
      onDeleted?.();
    } else if ("error" in fetcher.data) {
      toast.error(fetcher.data.error);
    }
  }, [fetcher.data, onDeleted]);

  const handleDelete = () => {
    fetcher.submit(
      { reason },
      {
        method: "DELETE",
        action: `/api/admin/images/${imageId}`,
        encType: "application/x-www-form-urlencoded",
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Admin Delete</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="z-[200]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            Delete Image (Admin)
          </DialogTitle>
          <DialogDescription>
            You are about to permanently delete this image
            {imageTitle && <strong> &quot;{imageTitle}&quot;</strong>}. This action cannot
            be undone. The image will be removed from storage and all associated
            data will be deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for deletion (optional)</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Violates community guidelines, Copyright infringement, Inappropriate content..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isDeleting}
              rows={3}
            />
            <p className="text-xs text-zinc-500">
              This will be recorded in the audit log for future reference.
            </p>
          </div>
        </div>

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
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Image
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
