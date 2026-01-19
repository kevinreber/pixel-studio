/**
 * Image Tags Component
 *
 * Displays AI-generated tags and attributes for an image
 */

import { useFetcher } from "@remix-run/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface ImageTag {
  id: string;
  tag: string;
  confidence: number;
  source: string;
}

interface ImageAttribute {
  id: string;
  category: string;
  value: string;
  confidence: number;
}

interface ImageTagsProps {
  imageId: string;
  tags?: ImageTag[];
  attributes?: ImageAttribute[];
  isOwner?: boolean;
  onTagClick?: (tag: string) => void;
  className?: string;
}

export function ImageTags({
  imageId,
  tags = [],
  attributes = [],
  isOwner = false,
  onTagClick,
  className,
}: ImageTagsProps) {
  const tagFetcher = useFetcher();
  const [newTag, setNewTag] = useState("");
  const [showAddTag, setShowAddTag] = useState(false);

  const isAnalyzing = tagFetcher.state === "submitting" && tagFetcher.formData?.get("_action") === "analyze";
  const isAddingTag = tagFetcher.state === "submitting" && tagFetcher.formData?.get("tag");

  const handleAnalyze = () => {
    tagFetcher.submit(
      { _action: "analyze" },
      { method: "POST", action: `/api/images/${imageId}/tags` }
    );
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;

    tagFetcher.submit(
      { tag: newTag.trim() },
      { method: "PUT", action: `/api/images/${imageId}/tags` }
    );
    setNewTag("");
    setShowAddTag(false);
  };

  const handleRemoveTag = (tag: string) => {
    tagFetcher.submit(
      { tag },
      { method: "DELETE", action: `/api/images/${imageId}/tags` }
    );
  };

  // Group attributes by category
  const attributesByCategory = attributes.reduce(
    (acc, attr) => {
      if (!acc[attr.category]) acc[attr.category] = [];
      acc[attr.category].push(attr);
      return acc;
    },
    {} as Record<string, ImageAttribute[]>
  );

  const hasData = tags.length > 0 || attributes.length > 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Tags Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">Tags</h4>
          {isOwner && (
            <div className="flex gap-2">
              {!hasData && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Auto-tag
                    </>
                  )}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAddTag(!showAddTag)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Add tag form */}
        {showAddTag && (
          <form onSubmit={handleAddTag} className="flex gap-2 mb-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag..."
              className="h-8 text-sm"
              maxLength={50}
            />
            <Button type="submit" size="sm" disabled={isAddingTag || !newTag.trim()}>
              {isAddingTag ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
            </Button>
          </form>
        )}

        {/* Tags list */}
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant={tag.source === "user" ? "default" : "secondary"}
                className={cn(
                  "text-xs cursor-pointer hover:opacity-80 transition-opacity",
                  tag.confidence < 0.7 && "opacity-75"
                )}
                onClick={() => onTagClick?.(tag.tag)}
              >
                {tag.tag}
                {isOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTag(tag.tag);
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No tags yet</p>
        )}
      </div>

      {/* Attributes Section */}
      {Object.keys(attributesByCategory).length > 0 && (
        <div className="space-y-3">
          {Object.entries(attributesByCategory).map(([category, attrs]) => (
            <div key={category}>
              <h5 className="text-xs font-medium text-muted-foreground capitalize mb-1.5">
                {category}
              </h5>
              <div className="flex flex-wrap gap-1">
                {attrs.map((attr) => (
                  <Badge
                    key={attr.id}
                    variant="outline"
                    className={cn(
                      "text-xs capitalize",
                      attr.confidence < 0.7 && "opacity-75"
                    )}
                  >
                    {attr.value}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state for owner */}
      {!hasData && isOwner && (
        <div className="text-center py-4 border rounded-lg bg-muted/50">
          <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            Click &quot;Auto-tag&quot; to analyze this image with AI
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for image cards
 */
export function ImageTagsCompact({
  tags,
  maxTags = 3,
  onTagClick,
  className,
}: {
  tags: Array<{ tag: string; confidence: number }>;
  maxTags?: number;
  onTagClick?: (tag: string) => void;
  className?: string;
}) {
  const visibleTags = tags.slice(0, maxTags);
  const remainingCount = tags.length - maxTags;

  if (tags.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {visibleTags.map((tag) => (
        <Badge
          key={tag.tag}
          variant="secondary"
          className="text-xs cursor-pointer hover:opacity-80"
          onClick={() => onTagClick?.(tag.tag)}
        >
          {tag.tag}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}
