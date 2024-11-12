import { ActionFunctionArgs, json } from "@remix-run/node";
import { createImageLike, deleteImageLike } from "~/server";
import { requireUserLogin } from "~/services";
import { invariantResponse } from "~/utils";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);
  const imageId = params.imageId;
  invariantResponse(imageId, "Image ID is required");
  invariantResponse(user, "User is required");

  if (request.method === "POST") {
    await createImageLike({ imageId, userId: user.id });
  } else if (request.method === "DELETE") {
    await deleteImageLike({ imageId, userId: user.id });
  }

  return json({ success: true });
};
