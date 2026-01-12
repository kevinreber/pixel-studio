import React from "react";
import { Link } from "@remix-run/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { FollowButton } from "./FollowButton";
import { useLoggedInUser } from "~/hooks";

interface FollowUser {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
}

// Moved outside to prevent re-creation on every render
const UserListItem = React.memo(function UserListItem({
  user,
  currentUserId,
  isFollowing,
  onFollowChange,
  onClose,
}: {
  user: FollowUser;
  currentUserId: string | undefined;
  isFollowing: boolean;
  onFollowChange: (isFollowing: boolean) => void;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-1">
      <Link
        to={`/profile/${user.id}`}
        className="flex items-center gap-3 hover:opacity-80 flex-1 min-w-0"
        onClick={onClose}
      >
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={user.image || undefined} alt={user.username} />
          <AvatarFallback>
            {user.name?.charAt(0) || user.username.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{user.username}</p>
          {user.name && (
            <p className="text-zinc-500 text-xs truncate">{user.name}</p>
          )}
        </div>
      </Link>
      {currentUserId && currentUserId !== user.id && (
        <FollowButton
          targetUserId={user.id}
          isFollowing={isFollowing}
          onFollowChange={onFollowChange}
        />
      )}
    </div>
  );
});

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialTab?: "followers" | "following";
  followersCount: number;
  followingCount: number;
}

export const FollowListModal = ({
  isOpen,
  onClose,
  userId,
  initialTab = "followers",
  followersCount,
  followingCount,
}: FollowListModalProps) => {
  const currentUser = useLoggedInUser();
  const [activeTab, setActiveTab] = React.useState(initialTab);
  const [followers, setFollowers] = React.useState<FollowUser[]>([]);
  const [following, setFollowing] = React.useState<FollowUser[]>([]);
  const [followersLoading, setFollowersLoading] = React.useState(false);
  const [followingLoading, setFollowingLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [followingStatus, setFollowingStatus] = React.useState<Record<string, boolean>>({});

  // Fetch followers when tab is active
  React.useEffect(() => {
    if (isOpen && activeTab === "followers" && followers.length === 0) {
      setFollowersLoading(true);
      fetch(`/api/users/${userId}/followers`)
        .then((res) => res.json())
        .then((data) => {
          setFollowers(data.followers || []);
          // Initialize following status for each follower
          const status: Record<string, boolean> = {};
          data.followers?.forEach((user: FollowUser & { isFollowedByCurrentUser?: boolean }) => {
            status[user.id] = user.isFollowedByCurrentUser || false;
          });
          setFollowingStatus((prev) => ({ ...prev, ...status }));
        })
        .catch(() => {
          // Error is handled by showing empty state
        })
        .finally(() => setFollowersLoading(false));
    }
  }, [isOpen, activeTab, userId, followers.length]);

  // Fetch following when tab is active
  React.useEffect(() => {
    if (isOpen && activeTab === "following" && following.length === 0) {
      setFollowingLoading(true);
      fetch(`/api/users/${userId}/following`)
        .then((res) => res.json())
        .then((data) => {
          setFollowing(data.following || []);
          // Initialize following status for each user
          const status: Record<string, boolean> = {};
          data.following?.forEach((user: FollowUser & { isFollowedByCurrentUser?: boolean }) => {
            status[user.id] = user.isFollowedByCurrentUser || false;
          });
          setFollowingStatus((prev) => ({ ...prev, ...status }));
        })
        .catch(() => {
          // Error is handled by showing empty state
        })
        .finally(() => setFollowingLoading(false));
    }
  }, [isOpen, activeTab, userId, following.length]);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setFollowers([]);
      setFollowing([]);
      setSearchQuery("");
    }
  }, [isOpen]);

  // Update initial tab when prop changes
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const filteredFollowers = React.useMemo(() =>
    followers.filter(
      (user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [followers, searchQuery]
  );

  const filteredFollowing = React.useMemo(() =>
    following.filter(
      (user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [following, searchQuery]
  );

  // Memoize the callback creator to prevent re-renders
  const createFollowChangeHandler = React.useCallback(
    (targetUserId: string) => (isNowFollowing: boolean) => {
      setFollowingStatus((prev) => ({ ...prev, [targetUserId]: isNowFollowing }));
    },
    []
  );

  // Store handlers in a ref to maintain stable references
  const followChangeHandlersRef = React.useRef<Record<string, (isFollowing: boolean) => void>>({});

  const getFollowChangeHandler = React.useCallback((userId: string) => {
    if (!followChangeHandlersRef.current[userId]) {
      followChangeHandlersRef.current[userId] = createFollowChangeHandler(userId);
    }
    return followChangeHandlersRef.current[userId];
  }, [createFollowChangeHandler]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] flex flex-col" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="sr-only">Followers and Following</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "followers" | "following")} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers" className="flex items-center gap-2">
              <span className="font-semibold">{followersCount}</span> Followers
            </TabsTrigger>
            <TabsTrigger value="following" className="flex items-center gap-2">
              <span className="font-semibold">{followingCount}</span> Following
            </TabsTrigger>
          </TabsList>

          {/* Search input */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Followers tab */}
          <TabsContent value="followers" className="flex-1 overflow-y-auto mt-2">
            {followersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            ) : filteredFollowers.length > 0 ? (
              <div className="divide-y divide-zinc-800">
                {filteredFollowers.map((user) => (
                  <UserListItem
                    key={user.id}
                    user={user}
                    currentUserId={currentUser?.id}
                    isFollowing={followingStatus[user.id] || false}
                    onFollowChange={getFollowChangeHandler(user.id)}
                    onClose={onClose}
                  />
                ))}
              </div>
            ) : searchQuery ? (
              <p className="text-center text-zinc-500 py-8">No users found</p>
            ) : (
              <p className="text-center text-zinc-500 py-8">No followers yet</p>
            )}
          </TabsContent>

          {/* Following tab */}
          <TabsContent value="following" className="flex-1 overflow-y-auto mt-2">
            {followingLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            ) : filteredFollowing.length > 0 ? (
              <div className="divide-y divide-zinc-800">
                {filteredFollowing.map((user) => (
                  <UserListItem
                    key={user.id}
                    user={user}
                    currentUserId={currentUser?.id}
                    isFollowing={followingStatus[user.id] || false}
                    onFollowChange={getFollowChangeHandler(user.id)}
                    onClose={onClose}
                  />
                ))}
              </div>
            ) : searchQuery ? (
              <p className="text-center text-zinc-500 py-8">No users found</p>
            ) : (
              <p className="text-center text-zinc-500 py-8">Not following anyone yet</p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
