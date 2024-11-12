import React from "react";
import { useLoggedInUser } from "~/hooks";
import { Await, useAsyncValue, useLoaderData } from "@remix-run/react";
import { ExplorePageImageLoader } from "~/routes/explore.$imageId";
import { convertUtcDateToLocalDateString, fallbackImageSource } from "~/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Bookmark, Info, Loader2 } from "lucide-react";
import { CopyToClipboardButton } from "~/components";
import { LikeImageButton } from "~/components/LikeImageButton";
import { CommentForm } from "~/components/CommentForm";
import { ImageComment } from "~/components/ImageComment";

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
  const isLoadingFetcher = false;
  if (!imageData) return null;

  return (
    <>
      <div className="flex h-full">
        {/* Left side - Image */}
        <div className="flex-1 bg-black">
          <div className="h-full flex items-center justify-center">
            <img
              loading="lazy"
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
                  src={imageUserData?.image}
                  alt={imageUserData?.username}
                >
                  <AvatarFallback>
                    {imageUserData?.username.charAt(0) || ""}
                    {/* <User className="h-4 w-4" /> */}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <a
                    href={`/profile/${imageUserData?.id}`}
                    className="font-semibold text-sm hover:underline"
                  >
                    {imageUserData?.username}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="comments" className="flex-1 flex flex-col mt-2">
            <TabsList className="grid w-full grid-cols-2 p-1">
              <TabsTrigger value="comments" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Comments
              </TabsTrigger>
              <TabsTrigger value="info" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Info
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comments" className="flex-1 overflow-y-auto">
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

            <TabsContent value="info" className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-4">
                <div className="space-y-1">
                  <h4 className="font-semibold">Engine Model</h4>
                  <p className="italic text-sm">{imageData.model}</p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold">Style Preset</h4>
                  {imageData.stylePreset ? (
                    <p className="italic text-sm">{imageData.stylePreset}</p>
                  ) : (
                    <p className="italic text-sm text-zinc-500">none</p>
                  )}
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
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-4">
                  <LikeImageButton imageData={imageData} />
                  {/* <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-zinc-600"
                      >
                        <MessageCircle className="h-6 w-6" />
                      </Button> */}
                  {/* <Button
                    variant="ghost"
                    size="icon"
                    className="hover:text-zinc-600"
                    disabled={isLoadingFetcher}
                  >
                    <Send className="h-6 w-6" />
                  </Button> */}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:text-zinc-600"
                  disabled={isLoadingFetcher}
                >
                  <Bookmark className="h-6 w-6" />
                </Button>
              </div>

              <div className="mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <p className="text-xs text-zinc-500">
                  {convertUtcDateToLocalDateString(imageData.createdAt!)}
                </p>
              </div>

              {/* Comment Input - Now separated with better contrast */}
              {isUserLoggedIn && <CommentForm imageId={imageData.id} />}
            </div>
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
              className="max-w-[90%] h-[90vh] p-0 gap-0 dark:bg-zinc-900 overflow-hidden z-[100] [&>button]:absolute [&>button]:right-4 [&>button]:top-4 [&>button]:z-10 [&>button_span]:hidden"
              onInteractOutside={(e) => e.preventDefault()}
            >
              <ExploreImageDetailsPageAccessor />
            </DialogContent>
          </Dialog>
        </Await>
      </React.Suspense>
    </>
  );
};

export default ExploreImageDetailsPage;
