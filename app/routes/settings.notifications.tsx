import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { requireUserLogin } from "~/services/auth.server";
import { prisma } from "~/services/prisma.server";
import { PageContainer } from "~/components";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell, Heart, MessageCircle, Users, Trophy, Flame } from "lucide-react";
import { invalidateCache } from "~/utils/cache.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);
  const prefs = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      notifyFollowers: true,
      notifyLikes: true,
      notifyComments: true,
      notifyAchievements: true,
      notifyStreaks: true,
    },
  });

  return json({ prefs });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);
  const formData = await request.formData();

  const notifyFollowers = formData.get("notifyFollowers") === "on";
  const notifyLikes = formData.get("notifyLikes") === "on";
  const notifyComments = formData.get("notifyComments") === "on";
  const notifyAchievements = formData.get("notifyAchievements") === "on";
  const notifyStreaks = formData.get("notifyStreaks") === "on";

  await prisma.user.update({
    where: { id: user.id },
    data: {
      notifyFollowers,
      notifyLikes,
      notifyComments,
      notifyAchievements,
      notifyStreaks,
    },
  });

  await invalidateCache(`user-login:${user.id}`);

  return json({ success: true });
}

const NOTIFICATION_OPTIONS = [
  {
    name: "notifyFollowers",
    label: "New Followers",
    description: "Get notified when someone follows you",
    icon: Users,
    key: "notifyFollowers" as const,
  },
  {
    name: "notifyLikes",
    label: "Likes",
    description: "Get notified when someone likes your content",
    icon: Heart,
    key: "notifyLikes" as const,
  },
  {
    name: "notifyComments",
    label: "Comments",
    description: "Get notified when someone comments on your content",
    icon: MessageCircle,
    key: "notifyComments" as const,
  },
  {
    name: "notifyAchievements",
    label: "Achievements",
    description: "Get notified when you unlock an achievement",
    icon: Trophy,
    key: "notifyAchievements" as const,
  },
  {
    name: "notifyStreaks",
    label: "Streak Milestones",
    description: "Get notified when you reach a login streak milestone",
    icon: Flame,
    key: "notifyStreaks" as const,
  },
];

export default function NotificationSettings() {
  const { prefs } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto py-6 md:py-10 space-y-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Notification Preferences</h1>
              <p className="text-muted-foreground">
                Choose which notifications you want to receive
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifications</CardTitle>
            <CardDescription>
              Toggle which notifications appear in your notification center
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-6">
              {NOTIFICATION_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <div key={option.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label htmlFor={option.name} className="text-sm font-medium">
                          {option.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id={option.name}
                      name={option.name}
                      defaultChecked={prefs?.[option.key] ?? true}
                    />
                  </div>
                );
              })}

              {actionData && "success" in actionData && actionData.success && (
                <div className="text-green-500 text-sm font-medium bg-green-500/10 px-3 py-2 rounded-md">
                  Notification preferences saved!
                </div>
              )}

              <Button type="submit" className="w-full sm:w-auto">
                Save Preferences
              </Button>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
