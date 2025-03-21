import React from "react";
import { useFetcher } from "@remix-run/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CommentSchema, type CommentResponse } from "~/schemas/comment";
import { z } from "zod";

export const CommentForm = ({ imageId }: { imageId: string }) => {
  const fetcher = useFetcher<CommentResponse>();
  const formRef = React.useRef<HTMLFormElement>(null);
  const isLoading = fetcher.state !== "idle";
  const [lastSubmitTime, setLastSubmitTime] = React.useState(0);
  const SUBMIT_DELAY = 1000; // Minimum time (ms) between submissions

  React.useEffect(() => {
    if (fetcher.data?.success) {
      toast.success("Comment posted successfully!");
    } else if (fetcher.data?.error) {
      toast.error(fetcher.data.error);
    }
  }, [fetcher.data]);

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
    <fetcher.Form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex gap-2 items-center bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2"
    >
      <Input
        name="comment"
        placeholder="Add a comment..."
        className="flex-1 text-sm border-none bg-transparent focus-visible:ring-0 placeholder:text-zinc-500"
        disabled={isLoading}
        minLength={1}
        maxLength={500}
        required
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
  );
};
