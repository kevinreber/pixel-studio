import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserLogin } from "~/services/auth.server";
import { getUserWithRoles, isAdmin } from "~/server/isAdmin.server";
import { getImageDeletionStats } from "~/services/imageDeletionLog.server";
import { prisma } from "~/services/prisma.server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trash2, Users, Image, ChevronRight, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);
  const userWithRoles = await getUserWithRoles(user.id);

  if (!isAdmin(userWithRoles)) {
    throw new Response("Forbidden", { status: 403 });
  }

  // Get various stats and admin users
  const [deletionStats, totalUsers, totalImages, adminUsers] = await Promise.all([
    getImageDeletionStats(),
    prisma.user.count(),
    prisma.image.count(),
    prisma.user.findMany({
      where: {
        roles: {
          some: {
            name: {
              equals: "admin",
              mode: "insensitive",
            },
          },
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
        image: true,
        createdAt: true,
        roles: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
  ]);

  return json({
    deletionStats,
    totalUsers,
    totalImages,
    adminUsers,
  });
}

export default function AdminDashboard() {
  const { deletionStats, totalUsers, totalImages, adminUsers } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Images</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalImages.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Generated content
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Images Deleted
            </CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deletionStats.totalDeletions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              By admin moderation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link to="/admin/deletion-logs" className="group">
            <Card className="h-full transition-colors hover:bg-accent/50 hover:border-accent">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-base mb-1">Deletion Logs</CardTitle>
                <CardDescription>
                  View history of deleted images and videos
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link to="/explore" className="group">
            <Card className="h-full transition-colors hover:bg-accent/50 hover:border-accent">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Image className="w-5 h-5 text-blue-500" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-base mb-1">Browse Content</CardTitle>
                <CardDescription>
                  Review and moderate user content
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Deletion Stats by Admin */}
      {deletionStats.deletionsByAdmin.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Deletions by Admin</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {deletionStats.deletionsByAdmin.map((stat) => (
                  <div
                    key={stat.deletedBy}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-muted-foreground font-mono">
                      {stat.deletedBy}
                    </span>
                    <span className="font-medium">
                      {stat._count.id} deletion{stat._count.id !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Admin Users */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-semibold">Admin Users</h2>
          <Badge variant="secondary" className="ml-2">
            {adminUsers.length}
          </Badge>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {adminUsers.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={admin.image ?? undefined} alt={admin.username} />
                    <AvatarFallback>
                      {admin.username?.charAt(0).toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{admin.username}</span>
                      <Badge variant="destructive" className="text-xs">
                        Admin
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {admin.email}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground hidden sm:block">
                    <span className="text-xs uppercase tracking-wide block mb-0.5">
                      Member since
                    </span>
                    {new Date(admin.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
