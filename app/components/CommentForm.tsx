import React from "react";
import { useFetcher } from "@remix-run/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface CommentResponse {
  success: boolean;
  comment?: {
    id: string;
    message: string;
    createdAt: Date;
    user: {
      id: string;
      username: string;
      image: string | null;
    };
  };
  error?: string;
}

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
    const comment = formData.get("comment")?.toString().trim();

    if (!comment) {
      toast.error("Please enter a comment");
      return;
    }

    setLastSubmitTime(now);

    fetcher.submit(
      { imageId, comment },
      {
        method: "POST",
        action: `/api/images/${imageId}/comment`,
      }
    );

    formRef.current?.reset();
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
