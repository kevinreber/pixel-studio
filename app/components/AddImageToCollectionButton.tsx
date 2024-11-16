import React from "react";
import { Button } from "@/components/ui/button";
import { Bookmark, Plus } from "lucide-react";
import { useLoggedInUser } from "~/hooks";
import { useFetcher } from "@remix-run/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Collection {
  id: string;
  title: string;
  imageCount: number;
  hasImage: boolean;
}

interface AddImageToCollectionButtonProps {
  imageId: string;
  disabled?: boolean;
  initialCollections?: Collection[];
  isInitiallySaved?: boolean;
}

export const AddImageToCollectionButton = ({
  imageId,
  disabled = false,
  initialCollections = [],
  isInitiallySaved = false,
}: AddImageToCollectionButtonProps) => {
  const userData = useLoggedInUser();
  const [isOpen, setIsOpen] = React.useState(false);
  const [collections, setCollections] =
    React.useState<Collection[]>(initialCollections);
  const [isCreatingNew, setIsCreatingNew] = React.useState(false);
  const [newCollectionName, setNewCollectionName] = React.useState("");
  const [isSaved, setIsSaved] = React.useState(isInitiallySaved);
  const fetcher = useFetcher();
  const isLoading = fetcher.state !== "idle";

  // Update saved state when initial value changes
  React.useEffect(() => {
    setIsSaved(isInitiallySaved);
  }, [isInitiallySaved]);

  // Update collections when initialCollections changes
  React.useEffect(() => {
    if (initialCollections.length > 0) {
      setCollections(initialCollections);
    }
  }, [initialCollections]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleCreateNewClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCreatingNew(true);
  };

  const handleCancelClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCreatingNew(false);
    setNewCollectionName("");
  };

  const handleAddToCollection = (collectionId: string) => {
    if (!userData || isLoading) return;

    // Find if image is already in this collection
    const collection = collections.find((c) => c.id === collectionId);
    const isInCollection = collection?.hasImage;

    // If image is in collection, remove it. If not, add it.
    fetcher.submit(
      { imageId, collectionId },
      {
        method: "POST",
        action: isInCollection
          ? "/api/collections/remove-image"
          : "/api/collections/add-image",
      }
    );

    // Optimistically update the collection's hasImage status
    setCollections((prev) =>
      prev.map((collection) =>
        collection.id === collectionId
          ? {
              ...collection,
              hasImage: !isInCollection,
              imageCount: isInCollection
                ? collection.imageCount - 1
                : collection.imageCount + 1,
            }
          : collection
      )
    );

    // Update saved state based on whether any collections still have the image
    const willHaveCollections = collections.some((c) =>
      c.id === collectionId ? !isInCollection : c.hasImage
    );
    setIsSaved(willHaveCollections);

    // Show appropriate toast message
    toast.success(
      isInCollection ? "Removed from collection" : "Added to collection"
    );
    setIsOpen(false);
  };

  const handleCreateCollection = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userData || isLoading || !newCollectionName.trim()) return;

    fetcher.submit(
      { title: newCollectionName },
      {
        method: "POST",
        action: "/api/collections",
      }
    );

    setNewCollectionName("");
    setIsCreatingNew(false);
    toast.success("Collection created");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          onClick={handleClick}
          className={cn("hover:bg-transparent", isSaved && "text-primary")}
        >
          <Bookmark
            className={cn("h-6 w-6", isSaved ? "fill-current" : "fill-none")}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        className="w-[400px] p-0 bg-zinc-800 border-zinc-700 shadow-xl z-[101]"
        sideOffset={10}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-700 p-4">
          <span className="font-semibold text-base text-zinc-100">
            Save to Collection
          </span>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {/* Collections List */}
          <div className="p-2">
            {collections.map((collection) => (
              <button
                key={collection.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCollection(collection.id);
                }}
                className={cn(
                  "w-full px-4 py-3 text-left hover:bg-zinc-700/50 rounded-lg",
                  "flex items-center justify-between transition-colors",
                  collection.hasImage && "bg-zinc-700/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-zinc-700 rounded-lg flex items-center justify-center">
                    <Bookmark
                      className={cn(
                        "h-6 w-6",
                        collection.hasImage && "fill-current"
                      )}
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm text-zinc-100">
                      {collection.title}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {collection.imageCount}{" "}
                      {collection.imageCount === 1 ? "post" : "posts"}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Create New Collection */}
          {isCreatingNew ? (
            <form
              onSubmit={handleCreateCollection}
              className="p-4 space-y-3 border-t border-zinc-700"
            >
              <Input
                placeholder="Collection name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="w-full text-sm bg-zinc-700 border-zinc-600 text-zinc-100 placeholder:text-zinc-400"
                maxLength={50}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelClick}
                  className="text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newCollectionName.trim() || isLoading}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Create
                </Button>
              </div>
            </form>
          ) : (
            <Button
              onClick={handleCreateNewClick}
              variant="ghost"
              className="w-full px-4 py-3 h-auto justify-start text-sm font-normal border-t border-zinc-700 rounded-none hover:bg-zinc-700/50 text-zinc-100"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Collection
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
