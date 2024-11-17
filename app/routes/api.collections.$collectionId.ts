import { ActionFunctionArgs, json } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { prisma } from "~/services/prisma.server";
import { CollectionSchema } from "~/schemas/collection";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);
  const collectionId = params.collectionId;

  if (!collectionId) {
    return json({ error: "Collection ID is required" }, { status: 400 });
  }

  // First verify the collection exists and belongs to the user
  const collection = await prisma.collection.findFirst({
    where: {
      id: collectionId,
      userId: user.id, // This ensures the collection belongs to the requesting user
    },
  });

  if (!collection) {
    return json(
      { error: "Collection not found or you don't have permission to modify it" },
      { status: 403 }
    );
  }

  switch (request.method) {
    case "PUT": {
      const formData = await request.formData();
      const data = {
        title: formData.get("title"),
        description: formData.get("description"),
      };

      try {
        const validatedData = CollectionSchema.parse(data);
        const updatedCollection = await prisma.collection.update({
          where: { 
            id: collectionId,
            userId: user.id, // Double check ownership
          },
          data: validatedData,
        });

        return json({ collection: updatedCollection });
      } catch (error) {
        return json({ error: "Invalid collection data" }, { status: 400 });
      }
    }

    case "DELETE": {
      await prisma.collection.delete({
        where: { 
          id: collectionId,
          userId: user.id, // Double check ownership
        },
      });

      return json({ success: true });
    }

    default:
      return json(
        { error: "Method not allowed" },
        { status: 405 }
      );
  }
}; 