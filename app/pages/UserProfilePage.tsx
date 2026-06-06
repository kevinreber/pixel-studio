import {
  useLoaderData,
  Link,
  useNavigation,
} from "@remix-run/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PageContainer,
  ImageCard,
  VideoCard,
  FollowButton,
  FollowListModal,
} from "~/components";
import type { UserProfilePageLoader } from "~/routes/profile.$userId._index";
import { Grid, User, Loader2, Image, Film, Layers } from "lucide-react";
import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { ProfileMediaItem, ProfileVideo, UserProfileData } from "~/server/getUserDataByUserId";

interface FollowStats {
  followersCount: number;
  followingCount: number;
}

const UserDoesNotExist = () => {
  return (
    <PageContainer>
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="pb-4">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center pb-8 border-b border-zinc-200 dark:border-zinc-800">
            <Avatar className="w-32 h-32">
              <AvatarFallback className="text-2xl">
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-xl">Unknown User</h1>
              </div>

              <div className="flex gap-8 mb-4">
                <div>
                  <span className="font-semibold">0</span>{" "}
                  <span className="text-zinc-500">posts</span>
                </div>
                <div>
                  <span className="font-semibold">0</span>{" "}
                  <span className="text-zinc-500">followers</span>
                </div>
                <div>
                  <span className="font-semibold">0</span>{" "}
                  <span className="text-zinc-500">following</span>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="all" className="mt-4">
            <TabsList className="w-full justify-center bg-transparent border-b border-zinc-200 dark:border-zinc-800 rounded-none p-0">
              <TabsTrigger
                value="all"
                className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none"
              >
                <Grid className="h-4 w-4" />
                ALL
              </TabsTrigger>
              <TabsTrigger
                value="images"
                className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none"
              >
                <Image className="h-4 w-4" />
                IMAGES
              </TabsTrigger>
              <TabsTrigger
                value="videos"
                className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none"
              >
                <Film className="h-4 w-4" />
                VIDEOS
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4">
            <div className="text-center py-12">
              <h2 className="text-lg mb-2">User Does Not Exist</h2>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

interface UserProfileAccessorProps {
  userData: UserProfileData;
  followStats: FollowStats;
  isFollowing: boolean;
  profileUserId: string;
}

type ContentFilter = "all" | "images" | "videos";

const UserProfileAccessor = ({
  userData: resolvedData,
  followStats,
  isFollowing: initialIsFollowing,
  profileUserId,
}: UserProfileAccessorProps) => {
  const userData = resolvedData.user;
  const userItems = resolvedData.items || [];
  const totalCount = resolvedData.count || 0;

  const [followersCount, setFollowersCount] = React.useState(
    followStats.followersCount
  );
  const [followListModalOpen, setFollowListModalOpen] = React.useState(false);
  const [followListTab, setFollowListTab] = React.useState<"followers" | "following">("followers");
  const [selectedVideo, setSelectedVideo] = React.useState<ProfileVideo | null>(null);
  const [contentFilter, setContentFilter] = React.useState<ContentFilter>("all");

  // Filter items based on selected content filter
  const filteredItems = React.useMemo(() => {
    if (contentFilter === "all") return userItems;
    if (contentFilter === "images") return userItems.filter((item) => item.type === "image");
    if (contentFilter === "videos") return userItems.filter((item) => item.type === "video");
    return userItems;
  }, [userItems, contentFilter]);

  // Get counts for each content type
  const imageCount = userItems.filter((item) => item.type === "image").length;
  const videoCount = userItems.filter((item) => item.type === "video").length;

  if (!userData) return <UserDoesNotExist />;

  const handleFollowChange = (isNowFollowing: boolean) => {
    setFollowersCount((prev) => (isNowFollowing ? prev + 1 : prev - 1));
  };

  const openFollowersModal = () => {
    setFollowListTab("followers");
    setFollowListModalOpen(true);
  };

  const openFollowingModal = () => {
    setFollowListTab("following");
    setFollowListModalOpen(true);
  };

  const handleVideoClick = (item: ProfileMediaItem) => {
    if (item.type === "video") {
      setSelectedVideo(item);
    }
  };

  const handleCloseVideo = () => {
    setSelectedVideo(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
      {/* Follow List Modal */}
      <FollowListModal
        isOpen={followListModalOpen}
        onClose={() => setFollowListModalOpen(false)}
        userId={profileUserId}
        initialTab={followListTab}
        followersCount={followersCount}
        followingCount={followStats.followingCount}
      />

      {/* Video Modal */}
      {selectedVideo !== null && (
        <Dialog open={true} onOpenChange={handleCloseVideo}>
          <DialogContent
            className="w-full md:max-w-[90%] md:h-[90vh] h-[100vh] p-0 gap-0 dark:bg-zinc-900 overflow-hidden z-[100] [&>button]:absolute [&>button]:right-4 [&>button]:top-4 [&>button]:z-10 [&>button_span]:hidden"
            onInteractOutside={(e) => e.preventDefault()}
            aria-describedby={undefined}
          >
            <VisuallyHidden>
              <DialogTitle>Video Details</DialogTitle>
            </VisuallyHidden>
            <div className="flex flex-col h-full">
              <div className="flex-1 flex items-center justify-center bg-black">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                  src={selectedVideo.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-full"
                  poster={selectedVideo.thumbnailURL}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="p-4 bg-zinc-900">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={selectedVideo.user.image || undefined} alt={selectedVideo.user.username} />
                    <AvatarFallback className="text-xs">
                      {selectedVideo.user.username.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{selectedVideo.user.username}</span>
                </div>
                <p className="text-sm text-zinc-300">{selectedVideo.prompt}</p>
                {selectedVideo.duration && (
                  <p className="text-xs text-zinc-500 mt-2">
                    Duration: {Math.floor(selectedVideo.duration / 60)}:{(selectedVideo.duration % 60).toString().padStart(2, "0")}
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Profile banner + meta — redesign */}
      <div className="pb-4">
        <div className="relative isolate mb-8 rounded-xl">
          {/* Gradient banner */}
          <div
            aria-hidden
            className="h-[180px] w-full rounded-xl"
            style={{
              background:
                "linear-gradient(120deg, var(--accent) 0%, rgba(255,90,180,0.65) 55%, rgba(255,170,90,0.6) 100%)",
            }}
          />
          {/* Header row over banner */}
          <div className="-mt-12 flex flex-col items-start gap-6 px-1 md:flex-row md:items-end">
            <div className="relative">
              <div className="rounded-full bg-bg p-1.5 shadow-md">
                {userData.image ? (
                  <Avatar className="h-[112px] w-[112px] md:h-[112px] md:w-[112px]">
                    <AvatarImage src={userData.image} alt={userData.username} />
                    <AvatarFallback className="text-2xl">
                      {userData.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="grid h-[112px] w-[112px] place-items-center rounded-full bg-accent-soft text-3xl font-bold text-[var(--accent-text)]">
                    {userData.name?.charAt(0) || userData.username.charAt(0)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-3 pb-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[26px] font-bold tracking-[-0.02em]">
                  {userData.name || userData.username}
                </h1>
                <span className="rounded-full border border-border-accent bg-accent-soft px-2.5 py-0.5 text-[11.5px] font-semibold text-[var(--accent-text)]">
                  Top creator
                </span>
              </div>
              <div className="text-[13.5px] text-fg-muted">
                @{userData.username}
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
                <div className="mono text-[15px] text-fg">
                  <span className="font-semibold">{totalCount}</span>{" "}
                  <span className="text-fg-subtle text-[12.5px] uppercase tracking-wider">
                    posts
                  </span>
                </div>
                <button
                  onClick={openFollowersModal}
                  className="mono text-[15px] text-fg hover:opacity-70"
                >
                  <span className="font-semibold">{followersCount}</span>{" "}
                  <span className="text-fg-subtle text-[12.5px] uppercase tracking-wider">
                    followers
                  </span>
                </button>
                <button
                  onClick={openFollowingModal}
                  className="mono text-[15px] text-fg hover:opacity-70"
                >
                  <span className="font-semibold">
                    {followStats.followingCount}
                  </span>{" "}
                  <span className="text-fg-subtle text-[12.5px] uppercase tracking-wider">
                    following
                  </span>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 pb-1">
              <FollowButton
                targetUserId={profileUserId}
                isFollowing={initialIsFollowing}
                onFollowChange={handleFollowChange}
              />
              <Link
                to={`/profile/${profileUserId}/sets`}
                prefetch="intent"
                className="inline-flex h-[38px] items-center justify-center gap-2 whitespace-nowrap rounded-sm border border-border-strong bg-surface-2 px-3.5 text-[14px] font-semibold text-fg hover:bg-surface-hover"
                data-testid="view-sets-button"
              >
                <Layers className="h-4 w-4" />
                View sets
              </Link>
            </div>
          </div>
        </div>

        {/* Content Filter Tabs */}
        <Tabs
          value={contentFilter}
          onValueChange={(value) => setContentFilter(value as ContentFilter)}
          className="mt-4"
        >
          <TabsList className="w-full justify-center rounded-none border-b border-[var(--border)] bg-transparent p-0">
            <TabsTrigger
              value="all"
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-fg-subtle data-[state=active]:border-[var(--accent)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-text)] data-[state=active]:shadow-none"
            >
              <Grid className="h-4 w-4" />
              All
            </TabsTrigger>
            <TabsTrigger
              value="images"
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-fg-subtle data-[state=active]:border-[var(--accent)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-text)] data-[state=active]:shadow-none"
            >
              <Image className="h-4 w-4" />
              Images
              {imageCount > 0 && (
                <span className="mono text-[11px] text-fg-subtle">
                  {imageCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="videos"
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-fg-subtle data-[state=active]:border-[var(--accent)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-text)] data-[state=active]:shadow-none"
            >
              <Film className="h-4 w-4" />
              Videos
              {videoCount > 0 && (
                <span className="mono text-[11px] text-fg-subtle">
                  {videoCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content Grid — uniform squares */}
        <div className="mt-6">
          {filteredItems.length > 0 ? (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {filteredItems.map((item) =>
                item.type === "image" ? (
                  <li
                    key={item.id}
                    className="group relative overflow-hidden rounded-md border border-[var(--border)] bg-surface-2 transition-all duration-200 hover:-translate-y-[2px] hover:border-border-accent hover:shadow-lg"
                  >
                    <ImageCard imageData={item} />
                  </li>
                ) : (
                  <li
                    key={item.id}
                    className="group relative overflow-hidden rounded-md border border-[var(--border)] bg-surface-2 transition-all duration-200 hover:-translate-y-[2px] hover:border-border-accent hover:shadow-lg"
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => handleVideoClick(item)}
                    >
                      <VideoCard videoData={item} onClickRedirectTo="#" />
                    </button>
                  </li>
                )
              )}
            </ul>
          ) : (
            <div className="text-center py-12">
              {contentFilter === "all" && (
                <>
                  <h2 className="font-semibold text-lg mb-2">No Posts Yet</h2>
                  <p className="text-zinc-500">
                    When you create images or videos, they will appear here.
                  </p>
                  <Button
                    className="mt-4 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    asChild
                  >
                    <Link to="/create" prefetch="intent">
                      Create Your First Image
                    </Link>
                  </Button>
                </>
              )}
              {contentFilter === "images" && (
                <>
                  <h2 className="font-semibold text-lg mb-2">No Images Yet</h2>
                  <p className="text-zinc-500">
                    When you create images, they will appear here.
                  </p>
                  <Button
                    className="mt-4 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    asChild
                  >
                    <Link to="/create" prefetch="intent">
                      Create Your First Image
                    </Link>
                  </Button>
                </>
              )}
              {contentFilter === "videos" && (
                <>
                  <h2 className="font-semibold text-lg mb-2">No Videos Yet</h2>
                  <p className="text-zinc-500">
                    When you create videos, they will appear here.
                  </p>
                  <Button
                    className="mt-4 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    asChild
                  >
                    <Link to="/create-video" prefetch="intent">
                      Create Your First Video
                    </Link>
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const UserProfileWrapper = ({
  userData,
  followStats,
  isFollowing,
  profileUserId,
  isNavigating,
}: {
  userData: UserProfileData;
  followStats: FollowStats;
  isFollowing: boolean;
  profileUserId: string;
  isNavigating: boolean;
}) => {
  return (
    <div className="relative">
      {isNavigating && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      )}
      <UserProfileAccessor
        userData={userData}
        followStats={followStats}
        isFollowing={isFollowing}
        profileUserId={profileUserId}
      />
    </div>
  );
};

export default function UserProfilePage() {
  const data = useLoaderData<UserProfilePageLoader>();
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";

  // The loader now resolves all data eagerly (warm cache) and returns json(),
  // so we render directly — no Suspense / Await needed. v3_singleFetch made
  // the previous deferred + composed-promise approach stall on the client.
  return (
    <PageContainer>
      <UserProfileWrapper
        userData={data.userData as unknown as UserProfileData}
        followStats={data.followStats}
        isFollowing={data.isFollowing}
        profileUserId={data.profileUserId}
        isNavigating={isNavigating}
      />
    </PageContainer>
  );
}
