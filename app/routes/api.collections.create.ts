import { ActionFunctionArgs, json } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { prisma } from "~/services/prisma.server";
import { CollectionSchema } from "~/schemas/collection";

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);
  const formData = await request.formData();
  const data = {
    title: formData.get("title"),
    description: formData.get("description"),
  };

  try {
    const validatedData = CollectionSchema.parse(data);
    const collection = await prisma.collection.create({
      data: {
        ...validatedData,
        userId: user.id,
      },
    });

    return json({ collection });
  } catch (error) {
    return json({ error: "Invalid collection data" }, { status: 400 });
  }
}; 