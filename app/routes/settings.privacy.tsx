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
import { Shield, Eye, EyeOff } from "lucide-react";
import { invalidateCache, cacheDeletePattern } from "~/utils/cache.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);
  const prefs = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      privateProfile: true,
      privateImages: true,
    },
  });

  return json({ prefs });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);
  const formData = await request.formData();

  const privateProfile = formData.get("privateProfile") === "on";
  const privateImages = formData.get("privateImages") === "on";

  await prisma.user.update({
    where: { id: user.id },
    data: {
      privateProfile,
      privateImages,
    },
  });

  await Promise.all([
    invalidateCache(`user-login:${user.id}`),
    cacheDeletePattern(`user-profile:${user.id}:*`),
  ]);

  return json({ success: true });
}

export default function PrivacySettings() {
  const { prefs } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto py-6 md:py-10 space-y-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Privacy Settings</h1>
              <p className="text-muted-foreground">
                Control who can see your profile and content
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile Visibility</CardTitle>
            <CardDescription>
              Manage your profile and content visibility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <EyeOff className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="privateProfile" className="text-sm font-medium">
                      Private Profile
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Hide your profile from the public user directory
                    </p>
                  </div>
                </div>
                <Switch
                  id="privateProfile"
                  name="privateProfile"
                  defaultChecked={prefs?.privateProfile ?? false}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="privateImages" className="text-sm font-medium">
                      Default Images to Private
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      New images will be private by default (you can change this per image)
                    </p>
                  </div>
                </div>
                <Switch
                  id="privateImages"
                  name="privateImages"
                  defaultChecked={prefs?.privateImages ?? false}
                />
              </div>

              {actionData && "success" in actionData && actionData.success && (
                <div className="text-green-500 text-sm font-medium bg-green-500/10 px-3 py-2 rounded-md">
                  Privacy settings saved!
                </div>
              )}

              <Button type="submit" className="w-full sm:w-auto">
                Save Settings
              </Button>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
