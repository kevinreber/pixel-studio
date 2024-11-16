import { ActionFunctionArgs, json } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { prisma } from "~/services/prisma.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);
  const formData = await request.formData();
  const imageId = formData.get("imageId")?.toString();
  const collectionId = formData.get("collectionId")?.toString();

  if (!imageId || !collectionId) {
    return json(
      { error: "Image ID and Collection ID are required" },
      { status: 400 }
    );
  }

  try {
    // Verify collection belongs to user
    const collection = await prisma.collection.findUnique({
      where: {
        id: collectionId,
        userId: user.id,
      },
    });

    if (!collection) {
      return json({ error: "Collection not found" }, { status: 404 });
    }

    // First verify the image exists
    const image = await prisma.image.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return json({ error: "Image not found" }, { status: 404 });
    }

    // Create the connection using CollectionHasImage
    await prisma.collectionHasImage.create({
      data: {
        collectionId,
        imageId,
      },
    });

    return json({ success: true });
  } catch (error) {
    console.error("Error adding image to collection:", error);

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return json(
        {
          success: false,
          error: "Image already exists in this collection",
        },
        {
          status: 400,
        }
      );
    }

    return json(
      {
        success: false,
        error: "Failed to add image to collection",
      },
      {
        status: 500,
      }
    );
  }
};
