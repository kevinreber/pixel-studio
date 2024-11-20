import { json, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { prisma } from "~/services/prisma.server";
import { requireUserLogin } from "~/services/auth.server";
import { z } from "zod";
import { PageContainer } from "~/components";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLoggedInUser } from "~/hooks";

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

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Account Settings
            </CardTitle>
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
                <div className="text-red-500 text-sm font-medium">
                  {actionData.error}
                </div>
              )}

              {actionData?.success && (
                <div className="text-green-500 text-sm font-medium">
                  Username updated successfully!
                </div>
              )}

              <Button
                type="submit"
                className="w-full sm:w-auto"
                variant="outline"
              >
                Update Username
              </Button>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
