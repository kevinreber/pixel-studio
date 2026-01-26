import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUserLogin } from "~/services/auth.server";
import { getUserWithRoles, isAdmin } from "~/server/isAdmin.server";
import {
  getTopUsersByFollowers,
  getTopCreatorsByEngagement,
  getPlatformSocialStats,
  getMostLikedContent,
  getFollowTrends,
} from "~/services/adminAnalytics.server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  Heart,
  MessageCircle,
  UserPlus,
  TrendingUp,
  Award,
  Image as ImageIcon,
  Crown,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);
  const userWithRoles = await getUserWithRoles(user.id);

  if (!isAdmin(userWithRoles)) {
    throw new Response("Forbidden", { status: 403 });
  }

  const [
    topByFollowers,
    topByEngagement,
    socialStats,
    mostLikedContent,
    followTrends,
  ] = await Promise.all([
    getTopUsersByFollowers(10),
    getTopCreatorsByEngagement(10),
    getPlatformSocialStats(),
    getMostLikedContent(10),
    getFollowTrends(14),
  ]);

  return json({
    topByFollowers,
    topByEngagement,
    socialStats,
    mostLikedContent,
    followTrends,
  });
}

function UserCard({
  user,
  rank,
  showEngagement = false,
}: {
  user: {
    id: string;
    username: string;
    image: string | null;
    followerCount: number;
    followingCount: number;
    imageCount: number;
    totalLikes: number;
    totalComments: number;
    engagementRate: number;
  };
  rank: number;
  showEngagement?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      {/* Rank */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
          rank === 1
            ? "bg-yellow-500/20 text-yellow-500"
            : rank === 2
              ? "bg-zinc-400/20 text-zinc-400"
              : rank === 3
                ? "bg-amber-600/20 text-amber-600"
                : "bg-muted text-muted-foreground"
        )}
      >
        {rank}
      </div>

      {/* Avatar */}
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.image ?? undefined} alt={user.username} />
        <AvatarFallback>
          {user.username?.charAt(0).toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{user.username}</div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ImageIcon className="h-3 w-3" />
            {user.imageCount}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {user.followerCount}
          </span>
        </div>
      </div>

      {/* Stats */}
      {showEngagement ? (
        <div className="text-right">
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 text-red-500">
              <Heart className="h-4 w-4" />
              {user.totalLikes.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 text-blue-500">
              <MessageCircle className="h-4 w-4" />
              {user.totalComments.toLocaleString()}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {user.engagementRate}/img avg
          </div>
        </div>
      ) : (
        <div className="text-right">
          <div className="font-bold text-lg">
            {user.followerCount.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">followers</div>
        </div>
      )}
    </div>
  );
}

export default function AdminEngagementPage() {
  const {
    topByFollowers,
    topByEngagement,
    socialStats,
    mostLikedContent,
    followTrends,
  } = useLoaderData<typeof loader>();

  // Calculate max for chart
  const maxFollows = Math.max(...followTrends.map((d) => d.count), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Social & Engagement</h2>
        <p className="text-sm text-muted-foreground">
          Platform social activity and top creators
        </p>
      </div>

      {/* Social Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Follows
            </CardTitle>
            <UserPlus className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {socialStats.totalFollowRelationships.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {socialStats.avgFollowersPerUser} avg per user
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {socialStats.totalLikes.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {socialStats.avgLikesPerImage} avg per image
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Comments
            </CardTitle>
            <MessageCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {socialStats.totalComments.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {socialStats.avgCommentsPerImage} avg per image
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Users with Followers
            </CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {socialStats.usersWithFollowers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {socialStats.usersWithNoFollowers} without
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Most Followed User Highlight */}
      {socialStats.mostFollowedUser && (
        <Card className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/20">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 rounded-full bg-yellow-500/20">
              <Crown className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Most Followed User</p>
              <p className="text-xl font-bold">
                @{socialStats.mostFollowedUser.username}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-bold text-yellow-500">
                {socialStats.mostFollowedUser.followerCount.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">followers</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Follow Activity Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Follow Activity (Last 14 Days)
          </CardTitle>
          <CardDescription>New follow relationships per day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-32">
            {followTrends.map((day) => (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center"
                title={`${day.date}: ${day.count} new follows`}
              >
                <div
                  className="w-full bg-blue-500/80 rounded-t transition-all hover:bg-blue-500"
                  style={{
                    height: `${(day.count / maxFollows) * 100}%`,
                    minHeight: day.count > 0 ? "4px" : "0px",
                  }}
                />
                <span className="text-[10px] text-muted-foreground mt-1 rotate-45 origin-left">
                  {day.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Users Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top by Followers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top by Followers
            </CardTitle>
            <CardDescription>Users with the most followers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {topByFollowers.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No follower data available
              </div>
            ) : (
              topByFollowers.map((user, index) => (
                <UserCard
                  key={user.id}
                  user={user}
                  rank={index + 1}
                  showEngagement={false}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Top by Engagement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top by Engagement
            </CardTitle>
            <CardDescription>
              Creators with the most likes & comments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {topByEngagement.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No engagement data available
              </div>
            ) : (
              topByEngagement.map((user, index) => (
                <UserCard
                  key={user.id}
                  user={user}
                  rank={index + 1}
                  showEngagement={true}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Most Liked Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Most Popular Content
          </CardTitle>
          <CardDescription>Top images by likes and comments</CardDescription>
        </CardHeader>
        <CardContent>
          {mostLikedContent.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No content data available
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {mostLikedContent.map((image, index) => (
                <div
                  key={image.id}
                  className="group relative rounded-lg overflow-hidden bg-muted aspect-square"
                >
                  {/* Rank Badge */}
                  <div
                    className={cn(
                      "absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      index === 0
                        ? "bg-yellow-500 text-yellow-950"
                        : index === 1
                          ? "bg-zinc-400 text-zinc-950"
                          : index === 2
                            ? "bg-amber-600 text-amber-950"
                            : "bg-zinc-700 text-zinc-100"
                    )}
                  >
                    {index + 1}
                  </div>

                  {/* Image */}
                  {image.url ? (
                    <img
                      src={image.url}
                      alt={image.title || image.prompt}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="h-5 w-5">
                          <AvatarImage
                            src={image.user.image ?? undefined}
                            alt={image.user.username}
                          />
                          <AvatarFallback className="text-[10px]">
                            {image.user.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-white truncate">
                          @{image.user.username}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-white">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {image._count.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {image._count.comments}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Badge (always visible) */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 text-white text-xs">
                    <Heart className="h-3 w-3 text-red-400" />
                    {image._count.likes}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
