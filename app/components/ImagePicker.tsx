/**
 * ImagePicker Component
 *
 * Allows users to select from their existing images for video generation.
 * Supports search, pagination, and shows a preview of selected image.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useFetcher } from "@remix-run/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ImageIcon,
  Search,
  Loader2,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserImage {
  id: string;
  title: string | null;
  prompt: string;
  model: string;
  createdAt: string;
  private: boolean;
  url: string;
  thumbnailURL: string;
}

interface ImagePickerResponse {
  images: UserImage[];
  pagination: {
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    pageSize: number;
  } | null;
  error?: string;
}

interface ImagePickerProps {
  onSelect: (image: { id: string; url: string } | null) => void;
  selectedImageUrl?: string;
  disabled?: boolean;
}

export function ImagePicker({
  onSelect,
  selectedImageUrl,
  disabled = false,
}: ImagePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const fetcher = useFetcher<ImagePickerResponse>();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch images when dialog opens or search/page changes
  const fetchImages = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    }
    fetcher.load(`/api/user/images?${params.toString()}`);
  }, [page, debouncedSearch, fetcher]);

  useEffect(() => {
    if (open) {
      fetchImages();
    }
  }, [open, page, debouncedSearch, fetchImages]);

  const handleSelect = (image: UserImage) => {
    onSelect({ id: image.id, url: image.url });
    setOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
  };

  const isLoading = fetcher.state === "loading";
  const data = fetcher.data;
  const images = data?.images || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className="flex-1 justify-start gap-2 bg-zinc-800/50 hover:bg-zinc-700/50"
            >
              <ImageIcon className="w-4 h-4" />
              {selectedImageUrl ? "Change Image" : "Select from My Images"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Select an Image</DialogTitle>
            </DialogHeader>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search your images..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-zinc-800/50"
              />
            </div>

            {/* Images Grid */}
            <ScrollArea className="flex-1 min-h-[300px] max-h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                </div>
              ) : images.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-zinc-400">
                  <ImageIcon className="w-12 h-12 mb-2" />
                  <p>No images found</p>
                  {debouncedSearch && (
                    <p className="text-sm">Try a different search term</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-1">
                  {images.map((image) => {
                    const isSelected = selectedImageUrl === image.url;
                    return (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => handleSelect(image)}
                        className={cn(
                          "relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:opacity-90",
                          isSelected
                            ? "border-pink-500 ring-2 ring-pink-500/50"
                            : "border-transparent hover:border-zinc-600"
                        )}
                      >
                        <img
                          src={image.thumbnailURL}
                          alt={image.prompt}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
                            <Check className="w-8 h-8 text-pink-500" />
                          </div>
                        )}
                        {image.private && (
                          <div className="absolute top-1 right-1 bg-zinc-900/80 text-xs px-1.5 py-0.5 rounded">
                            Private
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-zinc-700">
                <span className="text-sm text-zinc-400">
                  Page {pagination.currentPage} of {pagination.totalPages} (
                  {pagination.totalCount} images)
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPrevPage || isLoading}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNextPage || isLoading}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {selectedImageUrl && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={handleClear}
            className="shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Selected Image Preview */}
      {selectedImageUrl && (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800">
          <img
            src={selectedImageUrl}
            alt="Selected source image"
            className="w-full h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
