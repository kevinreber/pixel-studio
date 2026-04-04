import React from "react";
import { useFetcher } from "@remix-run/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CommentSchema, type CommentResponse } from "~/schemas/comment";
import { z } from "zod";

interface MentionUser {
  id: string;
  username: string;
  image: string | null;
}

export const CommentForm = ({ imageId }: { imageId: string }) => {
  const fetcher = useFetcher<CommentResponse>();
  const searchFetcher = useFetcher<{ users: MentionUser[] }>();
  const formRef = React.useRef<HTMLFormElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const isLoading = fetcher.state !== "idle";
  const [lastSubmitTime, setLastSubmitTime] = React.useState(0);
  const [showMentions, setShowMentions] = React.useState(false);
  const SUBMIT_DELAY = 1000; // Minimum time (ms) between submissions

  React.useEffect(() => {
    if (fetcher.data?.success) {
      toast.success("Comment posted successfully!");
    } else if (fetcher.data?.error) {
      toast.error(fetcher.data.error);
    }
  }, [fetcher.data]);

  // Track @ mentions as user types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart ?? value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_-]{0,30})$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      if (query.length >= 2) {
        searchFetcher.load(`/api/users/search?q=${encodeURIComponent(query)}`);
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (username: string) => {
    const input = inputRef.current;
    if (!input) return;
    const value = input.value;
    const cursorPos = input.selectionStart ?? value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const mentionStart = textBeforeCursor.lastIndexOf("@");
    if (mentionStart === -1) return;

    const newValue = value.slice(0, mentionStart) + `@${username} ` + value.slice(cursorPos);
    // Update input value using native setter to trigger React's change detection
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    nativeInputValueSetter?.call(input, newValue);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    setShowMentions(false);
    input.focus();
  };

  const mentionUsers = searchFetcher.data?.users ?? [];

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const now = Date.now();

    if (isLoading || now - lastSubmitTime < SUBMIT_DELAY) return;

    const formData = new FormData(event.currentTarget);
    const comment = formData.get("comment")?.toString() ?? "";

    try {
      // Validate the data before submitting
      const validatedData = CommentSchema.parse({
        imageId,
        comment,
      });

      setLastSubmitTime(now);

      fetcher.submit(
        { ...validatedData },
        {
          method: "POST",
          action: `/api/images/${imageId}/comments`,
        }
      );

      formRef.current?.reset();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((e) => e.message);
        toast.error(errors.join("\n"));
      } else {
        toast.error("Failed to validate comment");
      }
    }
  };

  return (
    <div className="relative">
      {/* Mention autocomplete dropdown */}
      {showMentions && mentionUsers.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50">
          {mentionUsers.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => insertMention(user.username)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
            >
              {user.image ? (
                <img src={user.image} alt="" className="w-5 h-5 rounded-full" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs">
                  {user.username.charAt(0)}
                </div>
              )}
              <span className="font-medium">@{user.username}</span>
            </button>
          ))}
        </div>
      )}

      <fetcher.Form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex gap-2 items-center bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2"
      >
        <Input
          ref={inputRef}
          name="comment"
          placeholder="Add a comment... Use @ to mention"
          className="flex-1 text-sm border-none bg-transparent focus-visible:ring-0 placeholder:text-zinc-500"
          disabled={isLoading}
          minLength={1}
          maxLength={500}
          required
          onChange={handleInputChange}
          onBlur={() => {
            // Delay hiding to allow click on mention
            setTimeout(() => setShowMentions(false), 200);
          }}
        />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="px-4 py-2 font-semibold"
          disabled={isLoading}
        >
          {isLoading ? "Posting..." : "Post"}
        </Button>
      </fetcher.Form>
    </div>
  );
};
