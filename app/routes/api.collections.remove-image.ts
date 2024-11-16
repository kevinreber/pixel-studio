import { ActionFunctionArgs, json } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { prisma } from "~/services/prisma.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);
  const formData = await request.formData();
  const imageId = formData.get("imageId") as string;
  const collectionId = formData.get("collectionId") as string;

  if (!imageId || !collectionId) {
    return json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // Verify the collection belongs to the user
    const collection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        userId: user.id,
      },
    });

    if (!collection) {
      return json(
        { error: "Collection not found or unauthorized" },
        { status: 404 }
      );
    }

    // Remove the image from the collection
    await prisma.collectionHasImage.deleteMany({
      where: {
        imageId,
        collectionId,
      },
    });

    return json({ success: true });
  } catch (error) {
    console.error("Error removing image from collection:", error);
    return json(
      { error: "Failed to remove image from collection" },
      { status: 500 }
    );
  }
};
