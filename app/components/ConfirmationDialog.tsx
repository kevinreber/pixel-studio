import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Variant types for the confirmation dialog */
export type ConfirmationVariant = "default" | "destructive" | "warning";

/** Props for ConfirmationDialog component */
export interface ConfirmationDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the open state changes */
  onOpenChange: (open: boolean) => void;
  /** Title of the dialog */
  title: string;
  /** Description/body text of the dialog */
  description: string;
  /** Text for the confirm button */
  confirmText?: string;
  /** Text for the cancel button */
  cancelText?: string;
  /** Callback when the confirm button is clicked */
  onConfirm: () => void | Promise<void>;
  /** Callback when the cancel button is clicked */
  onCancel?: () => void;
  /** Whether the confirm action is loading */
  isLoading?: boolean;
  /** Visual variant of the dialog */
  variant?: ConfirmationVariant;
  /** Whether to close the dialog automatically after confirm */
  closeOnConfirm?: boolean;
}

const variantStyles: Record<ConfirmationVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  warning: "bg-amber-600 text-white hover:bg-amber-700",
};

/**
 * A reusable confirmation dialog component for confirming user actions.
 *
 * Usage:
 * ```tsx
 * const [showConfirm, setShowConfirm] = useState(false);
 *
 * <ConfirmationDialog
 *   open={showConfirm}
 *   onOpenChange={setShowConfirm}
 *   title="Delete Item"
 *   description="Are you sure you want to delete this item? This action cannot be undone."
 *   confirmText="Delete"
 *   variant="destructive"
 *   onConfirm={handleDelete}
 * />
 * ```
 */
export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
  variant = "default",
  closeOnConfirm = true,
}: ConfirmationDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    if (closeOnConfirm) {
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-100">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={handleCancel}
            disabled={isLoading}
            className="border-zinc-600 text-gray-300 hover:bg-zinc-800 hover:text-white"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(variantStyles[variant], "gap-2")}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Hook for managing confirmation dialog state.
 *
 * Usage:
 * ```tsx
 * const { isOpen, openConfirmation, closeConfirmation, confirm } = useConfirmation();
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm();
 *   if (confirmed) {
 *     // Perform delete
 *   }
 * };
 *
 * <ConfirmationDialog
 *   open={isOpen}
 *   onOpenChange={(open) => !open && closeConfirmation()}
 *   onConfirm={() => {
 *     closeConfirmation();
 *     resolveConfirmation(true);
 *   }}
 *   ...
 * />
 * ```
 */
export function useConfirmation() {
  const [isOpen, setIsOpen] = React.useState(false);
  const resolveRef = React.useRef<((value: boolean) => void) | null>(null);

  const openConfirmation = React.useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeConfirmation = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  const confirm = React.useCallback(() => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setIsOpen(true);
    });
  }, []);

  const resolveConfirmation = React.useCallback((value: boolean) => {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    openConfirmation,
    closeConfirmation,
    confirm,
    resolveConfirmation,
  };
}

export default ConfirmationDialog;
