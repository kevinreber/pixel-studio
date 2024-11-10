import React from "react";
import { useLoggedInUser } from "~/hooks";
import { useLoaderData } from "@remix-run/react";
import { ExplorePageImageLoader } from "~/routes/explore.$imageId";
import { convertUtcDateToLocalDateString, fallbackImageSource } from "~/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Heart,
  MessageCircle,
  Send,
  User,
  Bookmark,
  Info,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyToClipboardButton } from "~/components";

interface ExploreImageDetailsPageProps {
  onClose: () => void;
}

const ExploreImageDetailsPage = ({ onClose }: ExploreImageDetailsPageProps) => {
  const { data: imageData } = useLoaderData<ExplorePageImageLoader>();

  const userData = useLoggedInUser();
  const isUserLoggedIn = Boolean(userData);
  const formRef = React.useRef<HTMLFormElement>(null);
  const isLoadingFetcher = false;

  const handleCommentFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    formRef.current?.reset();
  };

  if (!imageData) return null;

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/80 z-[99]" />

      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent
          className="max-w-[90%] h-[90vh] p-0 gap-0 dark:bg-zinc-900 overflow-hidden z-[100] [&>button]:absolute [&>button]:right-4 [&>button]:top-4 [&>button]:z-10 [&>button_span]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="flex h-full">
            {/* Left side - Image */}
            <div className="flex-1 bg-black">
              <div className="h-full flex items-center justify-center">
                <img
                  src={imageData.url}
                  alt={imageData.prompt || "Generated Image"}
                  className="max-h-[90vh] w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.src = fallbackImageSource;
                  }}
                />
              </div>
            </div>

            {/* Right side - Details */}
            <div className="w-[420px] flex flex-col h-[90vh] border-l border-zinc-200 dark:border-zinc-800">
              {/* Header */}
              <div className="shrink-0 p-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      className="h-8 w-8"
                      src={imageData.user?.image}
                      alt={imageData.user?.username}
                    >
                      <AvatarFallback>
                        {imageData.user?.username.charAt(0) || ""}
                        {/* <User className="h-4 w-4" /> */}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <a
                        href={`/profile/${imageData.user?.id}`}
                        className="font-semibold text-sm hover:underline"
                      >
                        {imageData.user?.username}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs Section */}
              <Tabs
                defaultValue="comments"
                className="flex-1 flex flex-col mt-2"
              >
                <TabsList className="grid w-full grid-cols-2 p-1">
                  <TabsTrigger
                    value="comments"
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Comments
                  </TabsTrigger>
                  <TabsTrigger value="info" className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Info
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="comments"
                  className="flex-1 overflow-y-auto"
                >
                  <div className="p-4">
                    {/* Original Post */}
                    {/* <div className="flex items-start gap-3 mb-4">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-2">
                          <a
                            href={`/profile/${imageData.user?.username}`}
                            className="font-semibold text-sm shrink-0"
                          >
                            {imageData.user?.username}
                          </a>
                          <span className="text-sm break-words">
                            {imageData.prompt}
                          </span>
                        </div>
                        <div className="mt-1 flex gap-4 text-xs text-zinc-500">
                          <span>
                            {convertUtcDateToLocalDateString(
                              imageData.createdAt!
                            )}
                          </span>
                        </div>
                      </div>
                    </div> */}

                    {imageData.comments && imageData.comments.length ? (
                      imageData.comments.map((comment) => (
                        <div key={comment.id}>{comment.message}</div>
                      ))
                    ) : (
                      <p className="text-center text-sm text-zinc-500 py-8">
                        No comments yet.
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="info" className="flex-1 overflow-y-auto">
                  <div className="p-4 space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-semibold">Engine Model</h4>
                      <p className="italic text-sm">{imageData.model}</p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-semibold">Style Preset</h4>
                      <p className="italic text-sm">{imageData.stylePreset}</p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-semibold">Prompt</h4>
                      <div className="flex items-start gap-2">
                        <p className="italic text-sm">{imageData.prompt}</p>
                        <CopyToClipboardButton
                          stringToCopy={imageData.prompt || ""}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Actions Bar - Fixed at bottom */}
              <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-zinc-600"
                      >
                        <Heart className="h-6 w-6" />
                      </Button>
                      {/* <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-zinc-600"
                      >
                        <MessageCircle className="h-6 w-6" />
                      </Button> */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-zinc-600"
                      >
                        <Send className="h-6 w-6" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:text-zinc-600"
                    >
                      <Bookmark className="h-6 w-6" />
                    </Button>
                  </div>

                  <div className="mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                    <p className="text-sm font-semibold">0 likes</p>
                    <p className="text-xs text-zinc-500">
                      {convertUtcDateToLocalDateString(imageData.createdAt!)}
                    </p>
                  </div>

                  {/* Comment Input - Now separated with better contrast */}
                  {isUserLoggedIn && (
                    <form
                      ref={formRef}
                      onSubmit={handleCommentFormSubmit}
                      className="flex gap-2 items-center bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2"
                    >
                      <Input
                        name="comment"
                        placeholder="Add a comment..."
                        className="flex-1 text-sm border-none bg-transparent focus-visible:ring-0 placeholder:text-zinc-500"
                      />
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        className="px-4 py-2 font-semibold"
                        disabled={isLoadingFetcher}
                      >
                        Post
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExploreImageDetailsPage;
