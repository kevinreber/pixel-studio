import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { requireUserLogin } from "~/services/auth.server";
import { prisma } from "~/services/prisma.server";
import { PageContainer } from "~/components";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Palette, Sun, Moon, Monitor } from "lucide-react";
import { invalidateCache } from "~/utils/cache.server";
import { cn } from "@/lib/utils";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);
  const prefs = await prisma.user.findUnique({
    where: { id: user.id },
    select: { theme: true },
  });

  return json({ theme: prefs?.theme ?? "dark" });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);
  const formData = await request.formData();
  const theme = formData.get("theme")?.toString();

  if (!theme || !["dark", "light", "system"].includes(theme)) {
    return json({ error: "Invalid theme" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { theme },
  });

  await invalidateCache(`user-login:${user.id}`);

  return json({ success: true, theme });
}

const THEME_OPTIONS = [
  { value: "dark", label: "Dark", icon: Moon, description: "Dark background with light text" },
  { value: "light", label: "Light", icon: Sun, description: "Light background with dark text" },
  { value: "system", label: "System", icon: Monitor, description: "Follow your system preference" },
];

export default function ThemeSettings() {
  const { theme } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto py-6 md:py-10 space-y-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Palette className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Theme</h1>
              <p className="text-muted-foreground">
                Choose your preferred appearance
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
            <CardDescription>
              Select the theme for the application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {THEME_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = theme === option.value;
                  return (
                    <Label
                      key={option.value}
                      htmlFor={`theme-${option.value}`}
                      className={cn(
                        "flex flex-col items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-accent/50",
                        isActive
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      )}
                    >
                      <input
                        type="radio"
                        id={`theme-${option.value}`}
                        name="theme"
                        value={option.value}
                        defaultChecked={isActive}
                        className="sr-only"
                      />
                      <Icon className={cn(
                        "w-8 h-8",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )} />
                      <div className="text-center">
                        <p className="text-sm font-medium">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </Label>
                  );
                })}
              </div>

              {actionData && "success" in actionData && actionData.success && (
                <div className="text-green-500 text-sm font-medium bg-green-500/10 px-3 py-2 rounded-md">
                  Theme updated!
                </div>
              )}

              <Button type="submit" className="w-full sm:w-auto">
                Save Theme
              </Button>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
