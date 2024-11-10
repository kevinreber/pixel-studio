import { useLoaderData } from "@remix-run/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Grid, Settings, User } from "lucide-react";
import { PageContainer } from "~/components";
import type { UserProfilePageLoader } from "~/routes/profile.$userId";
import ImageV2 from "~/components/ImageV2";
import { Grid, Settings, User, Heart, MessageCircle } from "lucide-react";

const UserDoesNotExist = () => {
  return (
    <PageContainer>
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="pb-4">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center py-8 border-b border-zinc-200 dark:border-zinc-800">
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

export default function UserProfilePage() {
  const data = useLoaderData<UserProfilePageLoader>();
  //   console.log(data);
  const userData = data.user || {};
  const userImages = data.images || [];

  if (!userData) return <UserDoesNotExist />;

  return (
    <PageContainer>
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        {/* Sticky Header */}
        <div className="pb-4">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center py-8 border-b border-zinc-200 dark:border-zinc-800">
            {/* Avatar */}
            {userData.image && (
              <Avatar
                className="w-32 h-32"
                src={userData.image}
                alt={userData.name}
              >
                <AvatarFallback className="text-2xl">
                  {/* <User className="h-12 w-12" /> */}
                  {userData.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            )}

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-xl">{userData.username}</h1>
                {/* <Button variant="outline" size="sm">
                  Edit Profile
                </Button>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button> */}
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

              {/* <div>
                <p className="font-semibold">{userData.name}</p>
                <p className="text-sm text-zinc-500">
                  {userData.bio || "No bio yet."}
                </p>
              </div> */}
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
                        {/* <div
                        key={image.id}
                        className="relative aspect-square group cursor-pointer hover:opacity-90 transition-opacity" */}
                        {/* > */}
                        {/* <div className="absolute inset-0"> */}
                        <ImageV2
                          imageData={image}
                          className="w-full h-full object-cover"
                        />
                        {/* </div> */}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-12">
                    <h2 className="font-semibold text-lg mb-2">No Posts Yet</h2>
                    <p className="text-zinc-500">
                      When you create images, they will appear here.
                    </p>
                    <Button className="mt-4" asChild>
                      <a href="/create">Create Your First Image</a>
                    </Button>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </PageContainer>
  );
}
