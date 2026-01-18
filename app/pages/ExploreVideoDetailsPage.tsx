import React from "react";
import { useLoggedInUser } from "~/hooks";
import { Link, useLoaderData } from "@remix-run/react";
import { ExplorePageVideoLoader } from "~/routes/explore.video.$videoId";
import { convertUtcDateToLocalDateString } from "~/client";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageCircle,
  Info,
  Loader2,
  X,
  Cpu,
  Images,
  NotepadText,
  Clock,
  Film,
  Maximize2,
  MonitorPlay,
  ImageIcon,
} from "lucide-react";
import { LikeVideoButton } from "~/components/LikeVideoButton";
import { VideoCommentForm } from "~/components/VideoCommentForm";
import { VideoComment } from "~/components/VideoComment";
import { ModelBadge } from "~/components/ModelBadge";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface ExploreVideoDetailsPageProps {
  onClose: () => void;
}

export type AsyncVideoData = Awaited<
  Awaited<ReturnType<ExplorePageVideoLoader>>["data"]
>;
export type VideoUserData = NonNullable<AsyncVideoData["user"]>;

const ExploreVideoDetailsPageContent = ({
  onClose,
}: ExploreVideoDetailsPageProps) => {
  const loaderData = useLoaderData<ExplorePageVideoLoader>();
  const videoData = loaderData.data as AsyncVideoData;
  const videoUserData = videoData?.user as VideoUserData;
  const userData = useLoggedInUser();
  const isUserLoggedIn = Boolean(userData);

  if (!videoData) return null;

  // Format duration as MM:SS
  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formattedDuration = formatDuration(videoData.duration);

  return (
    <>
      {/* Mobile header - hidden on desktop */}
      <div className="md:hidden py-5 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={videoUserData?.image ?? undefined}
              alt={videoUserData?.username}
            />
            <AvatarFallback>
              {videoUserData?.username?.charAt(0) || ""}
            </AvatarFallback>
          </Avatar>
          <Link
            to={`/profile/${videoUserData?.id}`}
            className="font-semibold text-sm hover:underline"
            prefetch="intent"
          >
            {videoUserData?.username}
          </Link>
        </div>
        <div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Mobile layout structure */}
      <div className="flex md:flex-row flex-col h-full">
        {/* Video section - Mobile optimized, desktop unchanged */}
        <div className="md:flex-1 md:bg-black">
          <div className="md:h-full md:flex md:items-center md:justify-center p-4">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              src={videoData.url || ""}
              controls
              autoPlay
              className="w-full md:max-h-[85vh] md:w-auto object-contain rounded-lg"
              poster={videoData.thumbnailURL}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        {/* Details section */}
        <div className="md:w-[420px] w-full flex flex-col md:h-[90vh] h-[calc(100vh-100vw-73px)] border-l border-zinc-200 dark:border-zinc-800">
          {/* Desktop header - hidden on mobile */}
          <div className="hidden md:block shrink-0 p-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={videoUserData?.image ?? undefined}
                    alt={videoUserData?.username}
                  />
                  <AvatarFallback>
                    {videoUserData?.username?.charAt(0) || ""}
                  </AvatarFallback>
                </Avatar>
                <Link
                  to={`/profile/${videoUserData?.id}`}
                  className="font-semibold text-sm hover:underline"
                  prefetch="intent"
                >
                  {videoUserData?.username}
                </Link>
              </div>
            </div>
          </div>

          {/* Action buttons - Mobile only - Fixed */}
          <div className="shrink-0 p-4 border-b border-zinc-200 dark:border-zinc-800 md:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LikeVideoButton videoData={videoData} />
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-zinc-500">
                  {convertUtcDateToLocalDateString(videoData.createdAt!)}
                </p>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                      <Info className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent
                    className="w-80 p-3 space-y-2 bg-zinc-800 text-white border-zinc-700 max-h-[60vh] overflow-y-auto"
                    side="bottom"
                    align="end"
                  >
                    <h4 className="font-semibold text-sm">Video Details</h4>
                    <div className="space-y-1">
                      <p className="text-xs flex items-center gap-2">
                        <span className="font-semibold flex items-center gap-1">
                          <Images className="w-4 h-4" />
                          Set:
                        </span>{" "}
                        {videoData.setId ? (
                          <Link
                            to={`/sets/${videoData.setId}`}
                            className="text-sm text-blue-500 hover:text-blue-600 hover:underline"
                            prefetch="intent"
                          >
                            View Set
                          </Link>
                        ) : (
                          <span className="text-xs text-zinc-500">No set</span>
                        )}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs flex items-center gap-2">
                        <span className="font-semibold flex items-center gap-1">
                          <Cpu className="w-4 h-4" />
                          Model:
                        </span>
                      </p>
                      <ModelBadge model={videoData.model} size="sm" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs">
                        <span className="font-semibold flex items-center gap-2">
                          <NotepadText className="w-4 h-4" />
                          Prompt:
                        </span>{" "}
                        <span className="italic">{videoData.prompt}</span>
                      </p>
                    </div>

                    {/* Video Parameters - Mobile */}
                    {(formattedDuration || videoData.aspectRatio || videoData.resolution || videoData.fps || videoData.sourceImageUrl) && (
                      <div className="border-t border-zinc-600 pt-2 mt-2 space-y-2">
                        <h4 className="font-semibold text-xs text-zinc-400 uppercase">
                          Video Parameters
                        </h4>

                        {formattedDuration && (
                          <p className="text-xs flex items-center gap-2">
                            <span className="font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Duration:
                            </span>{" "}
                            {formattedDuration}
                          </p>
                        )}

                        {videoData.aspectRatio && (
                          <p className="text-xs flex items-center gap-2">
                            <span className="font-semibold flex items-center gap-1">
                              <Maximize2 className="w-3 h-3" />
                              Aspect Ratio:
                            </span>{" "}
                            {videoData.aspectRatio}
                          </p>
                        )}

                        {videoData.resolution && (
                          <p className="text-xs flex items-center gap-2">
                            <span className="font-semibold flex items-center gap-1">
                              <MonitorPlay className="w-3 h-3" />
                              Resolution:
                            </span>{" "}
                            {videoData.resolution}
                          </p>
                        )}

                        {videoData.fps && (
                          <p className="text-xs flex items-center gap-2">
                            <span className="font-semibold flex items-center gap-1">
                              <Film className="w-3 h-3" />
                              FPS:
                            </span>{" "}
                            {videoData.fps}
                          </p>
                        )}

                        {videoData.sourceImageUrl && (
                          <p className="text-xs flex items-center gap-2">
                            <span className="font-semibold flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              Source Image:
                            </span>{" "}
                            <a
                              href={videoData.sourceImageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-600 hover:underline"
                            >
                              View
                            </a>
                          </p>
                        )}
                      </div>
                    )}
                  </HoverCardContent>
                </HoverCard>
              </div>
            </div>
          </div>

          {/* Tabs Section - Desktop only */}
          <div className="hidden md:flex md:flex-col flex-1 overflow-y-auto">
            <Tabs defaultValue="comments" className="flex-1 flex flex-col mt-2">
              <TabsList className="grid w-full grid-cols-2 p-1 bg-zinc-900">
                <TabsTrigger
                  value="comments"
                  className="flex items-center gap-2 data-[state=active]:bg-zinc-800 py-2 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  Comments
                </TabsTrigger>
                <TabsTrigger
                  value="info"
                  className="flex items-center gap-2 data-[state=active]:bg-zinc-800 py-2 transition-colors"
                >
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
                    {videoData.comments && videoData.comments.length > 0 ? (
                      videoData.comments.map((comment) => (
                        <VideoComment
                          key={comment.id}
                          videoId={videoData.id as string}
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
                    {videoData.setId && (
                      <div className="space-y-1">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Images className="w-4 h-4" />
                          Set
                        </h4>
                        <Link
                          to={`/sets/${videoData.setId}`}
                          className="text-sm text-blue-500 hover:text-blue-600 hover:underline"
                          prefetch="intent"
                        >
                          View Set
                        </Link>
                      </div>
                    )}

                    <div className="space-y-1">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Cpu className="w-4 h-4" />
                        Engine Model
                      </h4>
                      <ModelBadge model={videoData.model} size="sm" />
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-semibold flex items-center gap-2">
                        <NotepadText className="w-4 h-4" />
                        Prompt
                      </h4>
                      <div className="flex items-start gap-2">
                        <p className="italic text-sm">{videoData.prompt}</p>
                      </div>
                    </div>

                    {/* Video Parameters Section */}
                    {(formattedDuration || videoData.aspectRatio || videoData.resolution || videoData.fps || videoData.sourceImageUrl) && (
                      <div className="border-t border-zinc-700 pt-4 mt-4 space-y-4">
                        <h3 className="font-semibold text-sm text-zinc-400 uppercase tracking-wide">
                          Video Parameters
                        </h3>

                        {/* Duration */}
                        {formattedDuration && (
                          <div className="space-y-1">
                            <h4 className="font-semibold flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Duration
                            </h4>
                            <p className="text-sm text-zinc-300">
                              {formattedDuration}
                            </p>
                          </div>
                        )}

                        {/* Aspect Ratio */}
                        {videoData.aspectRatio && (
                          <div className="space-y-1">
                            <h4 className="font-semibold flex items-center gap-2">
                              <Maximize2 className="w-4 h-4" />
                              Aspect Ratio
                            </h4>
                            <p className="text-sm text-zinc-300">
                              {videoData.aspectRatio}
                            </p>
                          </div>
                        )}

                        {/* Resolution */}
                        {videoData.resolution && (
                          <div className="space-y-1">
                            <h4 className="font-semibold flex items-center gap-2">
                              <MonitorPlay className="w-4 h-4" />
                              Resolution
                            </h4>
                            <p className="text-sm text-zinc-300">
                              {videoData.resolution}
                            </p>
                          </div>
                        )}

                        {/* FPS */}
                        {videoData.fps && (
                          <div className="space-y-1">
                            <h4 className="font-semibold flex items-center gap-2">
                              <Film className="w-4 h-4" />
                              Frames Per Second
                            </h4>
                            <p className="text-sm text-zinc-300">
                              {videoData.fps} fps
                            </p>
                          </div>
                        )}

                        {/* Source Image */}
                        {videoData.sourceImageUrl && (
                          <div className="space-y-1">
                            <h4 className="font-semibold flex items-center gap-2">
                              <ImageIcon className="w-4 h-4" />
                              Source Image
                            </h4>
                            <a
                              href={videoData.sourceImageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:text-blue-600 hover:underline"
                            >
                              View Source Image
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Action buttons - Desktop only */}
          <div className="shrink-0 p-4 border-b border-zinc-200 dark:border-zinc-800 hidden md:block">
            <div className="flex items-center justify-between">
              <LikeVideoButton videoData={videoData} />
              <p className="text-xs text-zinc-500">
                {convertUtcDateToLocalDateString(videoData.createdAt!)}
              </p>
            </div>
          </div>

          {/* Comments section - Mobile only - Scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0 md:hidden">
            <div className="p-4 space-y-4">
              {videoData.comments && videoData.comments.length > 0 ? (
                videoData.comments.map((comment) => (
                  <VideoComment
                    key={comment.id}
                    id={comment.id}
                    videoId={videoData.id as string}
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

          {/* Comment input section - Fixed */}
          <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
            {isUserLoggedIn ? (
              <VideoCommentForm videoId={videoData.id as string} />
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

const ExploreVideoDetailsPage = ({ onClose }: ExploreVideoDetailsPageProps) => {
  const loaderData = useLoaderData<ExplorePageVideoLoader>();
  const [isMobile, setIsMobile] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px is our md breakpoint
    };

    checkMobile();
    setIsLoading(false);
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isLoading || !loaderData.data) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
        <Loader2 className="h-12 w-12 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen z-[500] relative dark:bg-zinc-900">
        <ExploreVideoDetailsPageContent onClose={onClose} />
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/80 z-[99]" />
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent
          className="w-full md:max-w-[90%] md:h-[90vh] p-0 gap-0 dark:bg-zinc-900 overflow-hidden z-[100] [&>button]:absolute [&>button]:right-4 [&>button]:top-4 [&>button]:z-10 [&>button_span]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <VisuallyHidden asChild>
            <DialogTitle>Video Details</DialogTitle>
          </VisuallyHidden>
          <ExploreVideoDetailsPageContent onClose={onClose} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExploreVideoDetailsPage;
