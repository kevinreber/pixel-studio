import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useNavigation } from "@remix-run/react";
import { requireUserLogin } from "~/services/auth.server";
import { prisma } from "~/services/prisma.server";
import { PageContainer } from "~/components";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Download, FileJson } from "lucide-react";
import {
  checkRateLimit,
  writeLimiter,
  getRateLimitIdentifier,
  rateLimitResponse,
} from "~/services/rateLimit.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserLogin(request);
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);

  const rl = await checkRateLimit(
    writeLimiter,
    getRateLimitIdentifier(request, user.id)
  );
  if (!rl.success) return rateLimitResponse(rl.reset);

  // Gather all user data for export
  const [userData, images, videos, collections, comments, likes, follows] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          createdAt: true,
          credits: true,
        },
      }),
      prisma.image.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          title: true,
          prompt: true,
          model: true,
          stylePreset: true,
          createdAt: true,
          width: true,
          height: true,
          isRemix: true,
          parentImageId: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.video.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          title: true,
          prompt: true,
          model: true,
          duration: true,
          aspectRatio: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.collection.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          title: true,
          description: true,
          createdAt: true,
          _count: { select: { images: true, videos: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.comment.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          message: true,
          imageId: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.imageLike.findMany({
        where: { userId: user.id },
        select: { imageId: true },
      }),
      prisma.follow.findMany({
        where: { followerId: user.id },
        select: { followingId: true, createdAt: true },
      }),
    ]);

  const exportData = {
    exportDate: new Date().toISOString(),
    user: userData,
    images: {
      count: images.length,
      items: images,
    },
    videos: {
      count: videos.length,
      items: videos,
    },
    collections: collections.map((c) => ({
      ...c,
      imageCount: c._count.images,
      videoCount: c._count.videos,
    })),
    comments: {
      count: comments.length,
      items: comments,
    },
    likes: {
      count: likes.length,
      imageIds: likes.map((l) => l.imageId),
    },
    following: {
      count: follows.length,
      items: follows,
    },
  };

  return json(exportData, {
    headers: {
      "Content-Disposition": `attachment; filename="pixel-studio-export-${user.id}.json"`,
      "Content-Type": "application/json",
    },
  });
}

export default function DataExportSettings() {
  const navigation = useNavigation();
  const isExporting = navigation.state === "submitting";

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto py-6 md:py-10 space-y-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Export Your Data</h1>
              <p className="text-muted-foreground">
                Download a copy of all your data
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data Export</CardTitle>
            <CardDescription>
              Export all your data including images, videos, collections, comments, and more as a JSON file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Included in export:</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-7 list-disc">
                <li>Profile information</li>
                <li>All generated images and their prompts</li>
                <li>All generated videos</li>
                <li>Collections</li>
                <li>Comments you&apos;ve made</li>
                <li>Images you&apos;ve liked</li>
                <li>Users you follow</li>
              </ul>
            </div>

            <Form method="post" reloadDocument>
              <Button type="submit" disabled={isExporting}>
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Preparing export..." : "Download My Data"}
              </Button>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
