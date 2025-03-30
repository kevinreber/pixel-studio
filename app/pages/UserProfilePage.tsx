import {
  Await,
  useLoaderData,
  useAsyncValue,
  Link,
  useNavigation,
} from "@remix-run/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PageContainer,
  ImageCard,
  ErrorList,
  ImageGridSkeleton,
} from "~/components";
import type { UserProfilePageLoader } from "~/routes/profile.$userId";
import { Grid, User, Loader2 } from "lucide-react";
import React from "react";

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

          <Tabs defaultValue="posts" className="mt-4">
            <TabsList className="w-full justify-center">
              <TabsTrigger value="posts" className="flex items-center gap-2">
                <Grid className="h-4 w-4" />
                POSTS
              </TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <TabsContent value="posts">
                <div className="text-center py-12">
                  <h2 className="text-lg mb-2">User Does Not Exist</h2>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </PageContainer>
  );
};

const UserProfileAccessor = () => {
  const resolvedData = useAsyncValue() as Awaited<
    Awaited<ReturnType<UserProfilePageLoader>>["userData"]
  >;
  const userData = resolvedData.user || {};
  const userImages = resolvedData.images || [];

  if (!userData) return <UserDoesNotExist />;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
      {/* Sticky Header */}
      <div className="pb-4">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center pb-8 border-b border-zinc-200 dark:border-zinc-800">
          {/* Avatar */}
          {userData.image && (
            <Avatar className="w-32 h-32">
              <AvatarImage src={userData.image} alt={userData.username} />
              <AvatarFallback className="text-2xl">
                {userData.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          )}

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-xl">{userData.username}</h1>
            </div>

            <div className="flex gap-8 mb-4">
              <div>
                <span className="font-semibold">{userImages.length}</span>{" "}
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

        {/* Tabs */}
        <Tabs defaultValue="posts" className="mt-4">
          <TabsList className="w-full justify-center">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              POSTS
            </TabsTrigger>
          </TabsList>

          {/* Scrollable Content */}
          <div className="mt-4">
            <TabsContent value="posts">
              {userImages.length > 0 ? (
                <ul className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-4 lg:gap-6">
                  {userImages.map((image) => (
                    <li key={image.id} className="hover:!opacity-60">
                      <ImageCard imageData={image} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-12">
                  <h2 className="font-semibold text-lg mb-2">No Posts Yet</h2>
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
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default function UserProfilePage() {
  const data = useLoaderData<UserProfilePageLoader>();
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";

  return (
    <PageContainer>
      <React.Suspense
        fallback={
          <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
            <div className="animate-pulse">
              <div className="flex flex-col md:flex-row gap-8 items-start md:items-center pb-8">
                <div className="w-32 h-32 rounded-full bg-gray-700/50" />
                <div className="flex-1">
                  <div className="h-8 w-48 bg-gray-700/50 rounded mb-4" />
                  <div className="flex gap-8 mb-4">
                    <div className="h-6 w-20 bg-gray-700/50 rounded" />
                    <div className="h-6 w-20 bg-gray-700/50 rounded" />
                    <div className="h-6 w-20 bg-gray-700/50 rounded" />
                  </div>
                </div>
              </div>
            </div>
            <ImageGridSkeleton />
          </div>
        }
      >
        <Await
          resolve={data.userData}
          errorElement={
            <ErrorList
              errors={["There was an error loading the user profile"]}
            />
          }
        >
          <div className="relative">
            {isNavigating && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              </div>
            )}
            <UserProfileAccessor />
          </div>
        </Await>
      </React.Suspense>
    </PageContainer>
  );
}
