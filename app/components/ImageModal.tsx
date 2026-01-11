import { useLoggedInUser } from "~/hooks";
import { Link } from "@remix-run/react";
import { convertUtcDateToLocalDateString, fallbackImageSource } from "~/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Info } from "lucide-react";
import { LikeImageButton } from "~/components/LikeImageButton";
import { CommentForm } from "~/components/CommentForm";
import { ImageComment } from "~/components/ImageComment";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ImageUserData } from "~/pages/ExploreImageDetailsPage";
import { ImageDetail } from "~/server/getImage";

const ImageModal = ({ imageData }: { imageData: ImageDetail }) => {
  const imageUserData = imageData!.user as ImageUserData;
  const userData = useLoggedInUser();
  const isUserLoggedIn = Boolean(userData);


  if (!imageData) return null;

  return (
    <>
      {/* Mobile header - hidden on desktop */}
      <div className="md:hidden py-5 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={imageUserData.image ?? undefined}
              alt={imageUserData.username}
            />
            <AvatarFallback>
              {imageUserData?.username.charAt(0) || ""}
            </AvatarFallback>
          </Avatar>
          <Link
            to={`/profile/${imageUserData?.id}`}
            className="font-semibold text-sm hover:underline"
            prefetch="intent"
          >
            {imageUserData?.username}
          </Link>
          {/* TODO: Maybe add tooltip or something here for user to see image data? */}
        </div>
      </div>

      <div className="flex md:flex-row flex-col h-full">
        {/* Image section - Mobile optimized, desktop unchanged */}
        <div className="md:flex-1 md:bg-black">
          <div className="md:h-full md:flex md:items-center md:justify-center">
            <img
              loading="lazy"
              decoding="async"
              src={imageData.url}
              alt={imageData.prompt || "Generated Image"}
              className="w-full h-auto object-contain md:max-h-[90vh]"
              // className="w-full h-auto object-contain md:max-h-[90vh] md:w-auto"
              onError={(e) => {
                e.currentTarget.src = fallbackImageSource;
              }}
            />
          </div>
        </div>

        {/* Details section */}
        <div className="md:w-[420px] w-full flex flex-col md:h-[90vh] h-[calc(100vh-100vw)] border-l border-zinc-200 dark:border-zinc-800">
          {/* Desktop header - hidden on mobile */}
          <div className="hidden md:block shrink-0 p-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={imageUserData.image ?? undefined}
                    alt={imageUserData.username}
                  />
                  <AvatarFallback>
                    {imageUserData?.username.charAt(0) || ""}
                  </AvatarFallback>
                </Avatar>
                <Link
                  to={`/profile/${imageUserData?.id}`}
                  className="font-semibold text-sm hover:underline"
                  prefetch="intent"
                >
                  {imageUserData?.username}
                </Link>
              </div>
            </div>
          </div>

          {/* Action buttons - Mobile only */}
          <div className="shrink-0 p-4 border-b border-zinc-200 dark:border-zinc-800 md:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LikeImageButton imageData={imageData} />
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-zinc-500">
                  {convertUtcDateToLocalDateString(imageData.createdAt!)}
                </p>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                      <Info className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent
                    className="w-80 p-3 space-y-2 bg-zinc-800 text-white border-zinc-700"
                    side="bottom"
                    align="end"
                  >
                    <h4 className="font-semibold text-sm">Image Details</h4>
                    {imageData.setId && (
                      <Link
                        to={`/sets/${imageData.setId}`}
                        className="text-sm text-blue-500 hover:text-blue-600 hover:underline"
                        prefetch="intent"
                      >
                        View Set
                      </Link>
                    )}
                    <div className="space-y-1">
                      <p className="text-xs">
                        <span className="font-semibold">Model:</span>{" "}
                        <span className="italic">{imageData.model}</span>
                      </p>
                    </div>
                    {imageData.stylePreset && (
                      <div className="space-y-1">
                        <p className="text-xs">
                          <span className="font-semibold">Style:</span>{" "}
                          <span className="italic">
                            {imageData.stylePreset}
                          </span>
                        </p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-xs">
                        <span className="font-semibold">Prompt:</span>{" "}
                        <span className="italic">{imageData.prompt}</span>
                      </p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            </div>
          </div>

          {/* Tabs Section - Desktop only */}
          <div className="hidden md:flex md:flex-col flex-1 overflow-y-auto">
            <Tabs defaultValue="comments" className="flex flex-col flex-1">
              <TabsList className="shrink-0 grid w-full grid-cols-2 p-1">
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

              <div className="flex-1 min-h-0">
                <TabsContent
                  value="comments"
                  className="h-full overflow-y-auto"
                >
                  <div className="p-4 space-y-4">
                    {imageData.comments && imageData.comments.length > 0 ? (
                      imageData.comments.map((comment) => (
                        <ImageComment
                          key={comment.id}
                          id={comment.id}
                          imageId={imageData.id}
                          message={comment.message}
                          createdAt={comment.createdAt}
                          user={comment.user}
                          likes={comment.likes}
                        />
                      ))
                    ) : (
                      <p className="text-center text-sm text-zinc-500 py-8">
                        No comments yet.
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="info" className="h-full overflow-y-auto">
                  <div className="p-4 space-y-4">
                    {imageData.setId && (
                      <div className="space-y-1">
                        <h4 className="font-semibold">Set</h4>
                        <Link
                          to={`/sets/${imageData.setId}`}
                          className="text-sm text-blue-500 hover:text-blue-600 hover:underline"
                          prefetch="intent"
                        >
                          View Set
                        </Link>
                      </div>
                    )}

                    <div className="space-y-1">
                      <h4 className="font-semibold">Engine Model</h4>
                      <p className="italic text-sm">{imageData.model}</p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-semibold">Style Preset</h4>
                      {imageData.stylePreset ? (
                        <p className="italic text-sm">
                          {imageData.stylePreset}
                        </p>
                      ) : (
                        <p className="italic text-sm text-zinc-500">none</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-semibold">Prompt</h4>
                      <div className="flex items-start gap-2">
                        <p className="italic text-sm">{imageData.prompt}</p>
                        {/* <CopyToClipboardButton
                          stringToCopy={imageData.prompt || ""}
                        /> */}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Comments section - Improved mobile scrolling */}
          <div className="flex-1 overflow-y-auto min-h-0 md:hidden">
            <div className="p-4 space-y-4 pb-32 md:pb-4 mb-8">
              {imageData.comments && imageData.comments.length > 0 ? (
                imageData.comments.map((comment) => (
                  <ImageComment
                    key={comment.id}
                    id={comment.id}
                    imageId={imageData.id}
                    message={comment.message}
                    createdAt={comment.createdAt}
                    user={comment.user}
                    likes={comment.likes}
                  />
                ))
              ) : (
                <p className="text-center text-sm text-zinc-500 py-8">
                  No comments yet.
                </p>
              )}
            </div>
          </div>

          {/* Action buttons - Desktop only */}
          <div className="shrink-0 p-4 border-b border-zinc-200 dark:border-zinc-800 hidden md:block">
            <div className="flex items-center justify-between">
              <LikeImageButton imageData={imageData} />
              <p className="text-xs text-zinc-500">
                {convertUtcDateToLocalDateString(imageData.createdAt!)}
              </p>
            </div>
          </div>
          {/* Comment input section */}
          <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800 p-4 md:relative fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900">
            {isUserLoggedIn ? (
              <CommentForm imageId={imageData.id as string} />
            ) : (
              <p className="text-center text-sm text-zinc-500">
                Log in to comment
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ImageModal;
