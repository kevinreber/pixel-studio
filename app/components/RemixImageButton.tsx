import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Coins } from "lucide-react";
import { useLoggedInUser } from "~/hooks";
import { useFetcher } from "@remix-run/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MODEL_OPTIONS } from "~/routes/create";

interface RemixImageButtonProps {
  imageId: string;
  currentModel?: string | null;
  disabled?: boolean;
}

export const RemixImageButton = ({
  imageId,
  currentModel,
  disabled = false,
}: RemixImageButtonProps) => {
  const userData = useLoggedInUser();
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedModel, setSelectedModel] = React.useState<string>("");
  const fetcher = useFetcher();
  const isLoading = fetcher.state !== "idle";

  // Get available models (excluding the current model)
  const availableModels = MODEL_OPTIONS.filter(
    (model) => model.value !== currentModel
  );

  const selectedModelData = availableModels.find((m) => m.value === selectedModel);
  const userCredits = userData?.credits ?? 0;
  const canAffordRemix = selectedModelData ? userCredits >= selectedModelData.creditCost : true;

  const handleRemix = () => {
    if (!userData || isLoading || !selectedModel) return;

    if (!canAffordRemix) {
      toast.error("Not enough credits for this remix");
      return;
    }

    fetcher.submit(
      { model: selectedModel },
      {
        method: "POST",
        action: `/api/images/${imageId}/remix`,
      }
    );

    toast.success("Remixing image with " + selectedModelData?.name);
    setIsOpen(false);
  };

  // Show error if the remix failed
  React.useEffect(() => {
    if (fetcher.data && 'error' in (fetcher.data as object)) {
      const errorData = fetcher.data as { error: string };
      toast.error(errorData.error || "Failed to remix image");
    }
  }, [fetcher.data]);

  if (!userData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled || isLoading}
              onClick={() => setIsOpen(true)}
              className={cn(
                "gap-1.5 text-zinc-600 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400",
                "hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors",
                isLoading && "opacity-70"
              )}
            >
              <Sparkles className={cn("h-5 w-5", isLoading && "animate-pulse")} />
              <span className="font-medium">Remix</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px] text-center">
            <p>Try this prompt with a different AI model</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            Remix with Different AI
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Create a new version of this image using a different AI model.
            Your prompt stays the same—just pick a new model to see different results.
          </DialogDescription>
        </DialogHeader>

        {/* User's credit balance */}
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-lg border border-zinc-700">
          <Coins className="h-4 w-4 text-yellow-500" />
          <span className="text-sm text-zinc-300">Your balance:</span>
          <span className="text-sm font-medium text-yellow-500">{userCredits} credits</span>
        </div>

        <div className="grid gap-4 py-2">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-zinc-300">Select AI Model</h4>
            <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-2">
              {availableModels.map((model) => {
                const canAfford = userCredits >= model.creditCost;
                return (
                  <button
                    key={model.value}
                    onClick={() => setSelectedModel(model.value)}
                    disabled={!canAfford}
                    className={cn(
                      "flex flex-col items-start p-3 rounded-lg border transition-all text-left",
                      selectedModel === model.value
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800",
                      !canAfford && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {model.image && (
                        <img
                          src={model.image}
                          alt={model.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-100 truncate">
                          {model.name}
                        </p>
                        <p className="text-xs text-zinc-500">{model.company}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between w-full">
                      <span className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        canAfford
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-red-500/20 text-red-400"
                      )}>
                        {model.creditCost} {model.creditCost === 1 ? "credit" : "credits"}
                      </span>
                      {!canAfford && (
                        <span className="text-xs text-red-400">Not enough</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedModel && selectedModelData && (
            <div className={cn(
              "rounded-lg p-3 border",
              canAffordRemix
                ? "bg-zinc-800/50 border-zinc-700"
                : "bg-red-900/20 border-red-500/50"
            )}>
              <p className="text-sm text-zinc-300">
                <span className="font-medium">Selected:</span>{" "}
                {selectedModelData.name}
              </p>
              <p className="text-sm mt-1">
                <span className="text-zinc-500">Cost:</span>{" "}
                <span className={cn(
                  "font-semibold",
                  canAffordRemix ? "text-purple-400" : "text-red-400"
                )}>
                  {selectedModelData.creditCost} credits
                </span>
                {canAffordRemix ? (
                  <span className="text-zinc-500 ml-2">
                    ({userCredits - selectedModelData.creditCost} remaining after remix)
                  </span>
                ) : (
                  <span className="text-red-400 ml-2">
                    (need {selectedModelData.creditCost - userCredits} more)
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="text-zinc-400 hover:text-zinc-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleRemix}
            disabled={!selectedModel || isLoading || !canAffordRemix}
            className={cn(
              "text-white",
              canAffordRemix
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-zinc-600 cursor-not-allowed"
            )}
          >
            {isLoading ? "Remixing..." : selectedModelData
              ? `Remix (${selectedModelData.creditCost} credits)`
              : "Remix Image"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
