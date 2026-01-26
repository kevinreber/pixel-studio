import React from "react";
import {
  Form,
  Link,
  useLoaderData,
  useNavigation,
  useFetcher,
} from "@remix-run/react";
import { Loader2, Search, Users, UserPlus, UserCheck } from "lucide-react";
import { PageContainer, PaginationControls } from "~/components";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UsersPageLoader } from "~/routes/users._index";

interface UserCardProps {
  user: UsersPageLoader["usersData"]["users"][number];
  currentUserId: string | null;
}

const UserCard = ({ user, currentUserId }: UserCardProps) => {
  const fetcher = useFetcher();
  const isOwnProfile = currentUserId === user.id;
  const isSubmitting = fetcher.state !== "idle";

  // Optimistic UI - determine follow state based on pending actions
  const isFollowing = (() => {
    if (fetcher.formData) {
      const intent = fetcher.formData.get("intent");
      if (intent === "follow") return true;
      if (intent === "unfollow") return false;
    }
    return user.isFollowedByCurrentUser;
  })();

  const handleFollowToggle = () => {
    if (!currentUserId) return;

    const intent = isFollowing ? "unfollow" : "follow";
    fetcher.submit(
      { intent, followingId: user.id },
      { method: "POST", action: "/api/follow" }
    );
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border/50 hover:bg-card/80 transition-colors">
      <Link
        to={`/profile/${user.id}`}
        className="flex items-center gap-3 flex-1 min-w-0"
        prefetch="intent"
      >
        <Avatar className="h-12 w-12 border border-border/50">
          <AvatarImage src={user.image || undefined} alt={user.username} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {user.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{user.username}</p>
          {user.name && (
            <p className="text-sm text-muted-foreground truncate">{user.name}</p>
          )}
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>{user._count.followedBy} followers</span>
            <span>{user._count.images} images</span>
          </div>
        </div>
      </Link>

      {currentUserId && !isOwnProfile && (
        <Button
          variant={isFollowing ? "outline" : "default"}
          size="sm"
          onClick={handleFollowToggle}
          disabled={isSubmitting}
          className={cn(
            "ml-3 min-w-[100px]",
            isFollowing && "hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
          )}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isFollowing ? (
            <>
              <UserCheck className="h-4 w-4 mr-1" />
              Following
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-1" />
              Follow
            </>
          )}
        </Button>
      )}
    </div>
  );
};

const UsersSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: 5 }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-3 p-4 rounded-lg bg-card/50 border border-border/50"
      >
        <div className="h-12 w-12 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-3 w-24 bg-muted rounded" />
        </div>
        <div className="h-9 w-24 bg-muted rounded" />
      </div>
    ))}
  </div>
);

const UsersPage = () => {
  const { usersData, searchTerm, currentUserId } =
    useLoaderData<UsersPageLoader>();
  const navigation = useNavigation();
  const [localSearchTerm, setLocalSearchTerm] = React.useState(searchTerm);
  const isLoading = navigation.state !== "idle";

  // Update local search term when URL changes
  React.useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  return (
    <PageContainer>
      <div className="flex flex-col h-[calc(100vh-6rem)] w-full max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex-shrink-0 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-6 w-6" />
            <h1 className="text-2xl font-semibold">Find Users</h1>
          </div>
          <p className="text-muted-foreground">
            Search for users by their username or name
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex-shrink-0 mb-4">
          <Form method="GET" action="/users">
            <div className="flex rounded-md shadow-sm">
              <div className="relative flex flex-grow items-stretch focus-within:z-10">
                <input
                  type="text"
                  name="q"
                  id="q"
                  className="bg-inherit block w-full rounded-l-md border-0 py-2 px-3 text-white ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  placeholder="Search by username or name..."
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-600 hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                ) : (
                  <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                )}
              </button>
            </div>
          </Form>
        </div>

        {/* Results Info */}
        <div className="flex-shrink-0 mb-4">
          {!isLoading && (
            <p className="text-sm text-muted-foreground">
              {usersData.pagination.totalCount > 0 ? (
                <>
                  {usersData.pagination.totalCount.toLocaleString()} user
                  {usersData.pagination.totalCount !== 1 ? "s" : ""} found
                  {searchTerm && (
                    <span className="ml-1">
                      for &ldquo;
                      <span className="text-foreground">{searchTerm}</span>
                      &rdquo;
                    </span>
                  )}
                </>
              ) : (
                <>
                  No users found
                  {searchTerm && (
                    <span className="ml-1">
                      for &ldquo;
                      <span className="text-foreground">{searchTerm}</span>
                      &rdquo;
                    </span>
                  )}
                </>
              )}
            </p>
          )}
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto min-h-0 px-1 scroll-smooth">
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {isLoading ? (
              <UsersSkeleton />
            ) : usersData.users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">
                  No users found
                </p>
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "Try a different search term"
                    : "Be the first to join!"}
                </p>
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {usersData.users.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {!isLoading && usersData.pagination.totalPages > 1 && (
          <div className="flex-shrink-0 border-t border-border/20">
            <PaginationControls
              currentPage={usersData.pagination.currentPage}
              totalPages={usersData.pagination.totalPages}
              hasNextPage={usersData.pagination.hasNextPage}
              hasPrevPage={usersData.pagination.hasPrevPage}
              basePath="/users"
              searchTerm={searchTerm}
            />
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default UsersPage;
