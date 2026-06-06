import { json, type ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { requireUserLogin } from "~/services/auth.server";
import { prisma } from "~/services/prisma.server";
import { cacheDelete } from "~/utils/cache.server";

const ThemeSchema = z.object({
  theme: z.enum(["dark", "light", "system"]),
});

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);
  const formData = await request.formData();
  const parsed = ThemeSchema.safeParse({ theme: formData.get("theme") });
  if (!parsed.success) {
    return json({ success: false, error: "Invalid theme" }, { status: 400 });
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { theme: parsed.data.theme },
  });
  // Bust the cached user blob so the next root loader pick reflects the change.
  await cacheDelete(`user-login:${user.id}`).catch(() => {});
  return json({ success: true });
}
