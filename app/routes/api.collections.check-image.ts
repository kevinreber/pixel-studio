import { LoaderFunctionArgs, json } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { prisma } from "~/services/prisma.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUserLogin(request);
  const url = new URL(request.url);
  const imageId = url.searchParams.get("imageId");

  if (!imageId) {
    return json({ error: "Image ID is required" }, { status: 400 });
  }

  try {
    // Check if image exists in any of user's collections
    const collectionHasImage = await prisma.collectionHasImage.findFirst({
      where: {
        imageId,
        collection: {
          userId: user.id,
        },
      },
      select: {
        id: true,
        collectionId: true,
      },
    });

    return json({
      exists: Boolean(collectionHasImage),
      collectionId: collectionHasImage?.collectionId,
    });
  } catch (error) {
    console.error("Error checking image in collections:", error);
    return json(
      { error: "Failed to check image in collections" },
      { status: 500 }
    );
  }
};
