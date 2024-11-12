import { ActionFunctionArgs, json } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { invariantResponse } from "~/utils";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  console.log("******* API: Like Image *******");
  const user = await requireUserLogin(request);
  const imageId = params.imageId;
  invariantResponse(imageId, "Image ID is required");
  invariantResponse(user, "User is required");

  if (request.method === "POST") {
    console.log("Adding like");
    // Add like
    // await db.likes.create({ data: { userId: user.id, imageId } });
  } else if (request.method === "DELETE") {
    console.log("Removing like");
    // Remove like
    // await db.likes.delete({ where: { userId_imageId: { userId: user.id, imageId } } });
  }

  return json({ success: true });
};
