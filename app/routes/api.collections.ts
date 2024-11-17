import { json, LoaderFunctionArgs } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { prisma } from "~/services/prisma.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUserLogin(request);
  const url = new URL(request.url);
  const imageId = url.searchParams.get("imageId");

  const collections = await prisma.collection.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      title: true,
      _count: {
        select: { images: true },
      },
      images: imageId
        ? {
            where: { id: imageId },
            select: { id: true },
          }
        : false,
    },
    orderBy: { createdAt: "desc" },
  });

  return json({
    collections: collections.map((c) => ({
      id: c.id,
      title: c.title,
      imageCount: c._count.images,
      hasImage: imageId ? c.images.length > 0 : undefined,
    })),
  });
};

export const action = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUserLogin(request);
  const formData = await request.formData();
  const title = formData.get("title")?.toString();

  if (!title) {
    return json({ error: "Title is required" }, { status: 400 });
  }

  const collection = await prisma.collection.create({
    data: {
      title,
      userId: user.id,
    },
  });

  return json({ success: true, collection });
};
