import React from "react";
import { Button } from "@/components/ui/button";
import { Shuffle } from "lucide-react";
import { useLoggedInUser } from "~/hooks";
import { useFetcher } from "@remix-run/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

  const handleRemix = () => {
    if (!userData || isLoading || !selectedModel) return;

    fetcher.submit(
      { model: selectedModel },
      {
        method: "POST",
        action: `/api/images/${imageId}/remix`,
      }
    );

    toast.success("Remixing image with " + availableModels.find(m => m.value === selectedModel)?.name);
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
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled || isLoading}
          className="hover:bg-transparent"
          title="Remix with different AI model"
        >
          <Shuffle className={cn("h-6 w-6", isLoading && "animate-pulse")} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shuffle className="h-5 w-5" />
            Remix Image
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Generate a new version of this image using a different AI model.
            The same prompt will be used with your selected model.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-zinc-300">Select AI Model</h4>
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
              {availableModels.map((model) => (
                <button
                  key={model.value}
                  onClick={() => setSelectedModel(model.value)}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-lg border transition-all text-left",
                    selectedModel === model.value
                      ? "border-rose-500 bg-rose-500/10"
                      : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800"
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
                    <span className="text-xs text-zinc-400 line-clamp-1">
                      {model.description.slice(0, 50)}...
                    </span>
                    <span className="text-xs font-medium text-rose-400 whitespace-nowrap ml-2">
                      {model.creditCost} {model.creditCost === 1 ? "credit" : "credits"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedModel && (
            <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
              <p className="text-sm text-zinc-300">
                <span className="font-medium">Selected:</span>{" "}
                {availableModels.find((m) => m.value === selectedModel)?.name}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                This will cost{" "}
                <span className="text-rose-400 font-medium">
                  {availableModels.find((m) => m.value === selectedModel)?.creditCost} credits
                </span>
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
            disabled={!selectedModel || isLoading}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            {isLoading ? "Remixing..." : "Remix Image"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
