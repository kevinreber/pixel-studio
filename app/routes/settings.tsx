import { json, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, Link, Outlet, useLocation } from "@remix-run/react";
import { prisma } from "~/services/prisma.server";
import { requireUserLogin } from "~/services/auth.server";
import { z } from "zod";
import { PageContainer } from "~/components";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLoggedInUser } from "~/hooks";
import { invalidateCache, cacheDeletePattern } from "~/utils/cache.server";
import {
  History,
  Wallet,
  User,
  ChevronRight,
  Settings as SettingsIcon,
} from "lucide-react";

const UsernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters long")
  .max(30, "Username cannot exceed 30 characters")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Username can only contain letters, numbers, underscores, and hyphens"
  )
  .transform((username) => username.toLowerCase());

export async function loader({ request }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);
  return json({ user });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const rawUsername = formData.get("username");

  const usernameResult = UsernameSchema.safeParse(rawUsername);

  if (!usernameResult.success) {
    return json(
      { error: usernameResult.error.errors[0].message },
      { status: 400 }
    );
  }

  const username = usernameResult.data;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        NOT: {
          id: user.id,
        },
      },
    });

    if (existingUser) {
      return json(
        { error: "This username is already taken. Please choose another one." },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { username },
    });
    // Invalidate both login and profile caches so new username appears everywhere
    await Promise.all([
      invalidateCache(`user-login:${user.id}`),
      cacheDeletePattern(`user-profile:${user.id}:*`),
    ]);

    return json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating username:", error);
    return json(
      { error: "Failed to update username. Please try again." },
      { status: 500 }
    );
  }
}

export default function Index() {
  const user = useLoggedInUser();
  const actionData = useActionData<typeof action>();
  const location = useLocation();

  // Check if we're on a child route
  const isChildRoute = location.pathname !== "/settings";

  // If on a child route, render the Outlet
  if (isChildRoute) {
    return <Outlet />;
  }

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto py-6 md:py-10 space-y-8">
        {/* Page Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <SettingsIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground">
                Manage your account settings and preferences
              </p>
            </div>
          </div>
        </div>

        {/* Activity Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Activity
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/settings/generation-history" className="group">
              <Card className="h-full transition-colors hover:bg-accent/50 hover:border-accent">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <History className="w-5 h-5 text-blue-500" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-base mb-1">
                    Generation History
                  </CardTitle>
                  <CardDescription>
                    View all your generated images and videos
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>

            <Link to="/settings/credit-history" className="group">
              <Card className="h-full transition-colors hover:bg-accent/50 hover:border-accent">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Wallet className="w-5 h-5 text-green-500" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-base mb-1">Credit History</CardTitle>
                  <CardDescription>
                    Track your credit usage and purchases
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Account Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Account
          </h2>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <User className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <CardTitle className="text-base">Profile Information</CardTitle>
                  <CardDescription>
                    Update your account details
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form method="post" className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    type="text"
                    id="username"
                    name="username"
                    defaultValue={user.username}
                    minLength={3}
                    maxLength={30}
                    pattern="^[a-zA-Z0-9_-]+$"
                    required
                    className="max-w-md"
                  />
                  <p className="text-sm text-muted-foreground">
                    Username can only contain letters, numbers, underscores, and
                    hyphens.
                  </p>
                </div>

                {actionData?.error && (
                  <div className="text-red-500 text-sm font-medium bg-red-500/10 px-3 py-2 rounded-md">
                    {actionData.error}
                  </div>
                )}

                {actionData?.success && (
                  <div className="text-green-500 text-sm font-medium bg-green-500/10 px-3 py-2 rounded-md">
                    Username updated successfully!
                  </div>
                )}

                <Button type="submit" className="w-full sm:w-auto">
                  Save Changes
                </Button>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
