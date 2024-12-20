import React from "react";
import { useLoggedInUser } from "~/hooks";
import { Await, Link, useAsyncValue, useLoaderData } from "@remix-run/react";
import { ExplorePageImageLoader } from "~/routes/explore.$imageId";
import { convertUtcDateToLocalDateString, fallbackImageSource } from "~/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Info, Loader2 } from "lucide-react";
import { CopyToClipboardButton } from "~/components";
import { LikeImageButton } from "~/components/LikeImageButton";
import { CommentForm } from "~/components/CommentForm";
import { ImageComment } from "~/components/ImageComment";
import { AddImageToCollectionButton } from "~/components/AddImageToCollectionButton";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ExploreImageDetailsPageProps {
  onClose: () => void;
}

// const LoadingSkeleton = () => {
//   return (
//     <div className="flex h-full">
//       <div className="flex-1">
//         <div className="h-full flex items-center justify-center">
//           <div className="relative max-h-[90vh] w-full h-full aspect-[4/3]">
//             <Skeleton className="w-full h-full rounded-none bg-zinc-700/50" />
//           </div>
//         </div>
//       </div>

//       <div className="w-[420px] flex flex-col h-[90vh] border-l border-zinc-200 dark:border-zinc-800">
//         <div className="shrink-0 p-4 border-b border-zinc-200 dark:border-zinc-800">
//           <div className="flex items-center gap-3">
//             <Skeleton className="h-8 w-8 rounded-full bg-zinc-700/50" />
//             <Skeleton className="h-4 w-32 bg-zinc-700/50" />
//           </div>
//         </div>

//         <Tabs defaultValue="comments" className="flex-1 flex flex-col mt-2">
//           <TabsList className="grid w-full grid-cols-2 p-1">
//             <TabsTrigger
//               disabled
//               value="comments"
//               className="flex items-center gap-2"
//             >
//               <MessageCircle className="h-4 w-4" />
//               Comments
//             </TabsTrigger>
//             <TabsTrigger
//               disabled
//               value="info"
//               className="flex items-center gap-2"
//             >
//               <Info className="h-4 w-4" />
//               Info
//             </TabsTrigger>
//           </TabsList>

//           <TabsContent value="comments" className="flex-1 overflow-y-auto">
//             <div className="p-4 space-y-4">
//               {[1, 2, 3].map((i) => (
//                 <div key={i} className="flex items-start gap-3">
//                   <Skeleton className="h-8 w-8 rounded-full shrink-0 bg-zinc-700/50" />
//                   <div className="space-y-2 flex-1">
//                     <Skeleton className="h-4 w-32 bg-zinc-700/50" />
//                     <Skeleton className="h-3 w-full bg-zinc-700/50" />
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </TabsContent>
//         </Tabs>
//       </div>
//     </div>
//   );
// };

type AsyncImageData = Awaited<ExplorePageImageLoader["data"]>;
export type ImageUserData = NonNullable<AsyncImageData["user"]>;

const ExploreImageDetailsPageAccessor = () => {
  const imageData = useAsyncValue() as AsyncImageData;
  const imageUserData = imageData.user as ImageUserData;
  const userData = useLoggedInUser();
  const isUserLoggedIn = Boolean(userData);

  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsPopoverOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!imageData) return null;

  return (
    <>
      {/* Mobile header - hidden on desktop */}
      <div className="md:hidden shrink-0 py-2 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage
              src={imageUserData.image}
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
              className="w-full h-auto object-contain md:max-h-[90vh] md:w-auto"
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
                    src={imageUserData.image}
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
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                      <Info className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="bottom"
                    align="end"
                    className="max-w-[280px] p-3 space-y-2 z-[2000] w-screen sm:w-auto mx-4 sm:mx-0 bg-zinc-800"
                  >
                    <p>Image Details</p>
                    {imageData.setId && (
                      <div className="space-y-1">
                        <p className="text-xs">
                          <Link
                            to={`/sets/${imageData.setId}`}
                            className="ml-1 text-blue-500 hover:text-blue-600 hover:underline"
                            prefetch="intent"
                          >
                            View Set
                          </Link>
                        </p>
                      </div>
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
                      {/* <CopyToClipboardButton
                        stringToCopy={imageData.prompt || ""}
                      /> */}
                    </div>
                  </PopoverContent>
                </Popover>
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

const ExploreImageDetailsPage = ({ onClose }: ExploreImageDetailsPageProps) => {
  const loaderData = useLoaderData<ExplorePageImageLoader>();

  return (
    <>
      <div className="fixed inset-0 bg-black/80 z-[99]" />
      <React.Suspense
        fallback={
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-zinc-500" />
          </div>
        }
      >
        <Await
          resolve={loaderData.data}
          errorElement={
            <Dialog open={true} onOpenChange={onClose}>
              <DialogContent>
                <div className="p-4">
                  <p className="text-red-500">Error loading image details</p>
                </div>
              </DialogContent>
            </Dialog>
          }
        >
          <Dialog open={true} onOpenChange={onClose}>
            <DialogContent
              className="w-full md:max-w-[90%] md:h-[90vh] h-[100vh] p-0 gap-0 dark:bg-zinc-900 overflow-hidden z-[100] [&>button]:absolute [&>button]:right-4 [&>button]:top-4 [&>button]:z-10 [&>button_span]:hidden"
              onInteractOutside={(e) => e.preventDefault()}
            >
              <VisuallyHidden asChild>
                <DialogTitle>Image Details</DialogTitle>
              </VisuallyHidden>
              <ExploreImageDetailsPageAccessor />
            </DialogContent>
          </Dialog>
        </Await>
      </React.Suspense>
    </>
  );
};

export default ExploreImageDetailsPage;
