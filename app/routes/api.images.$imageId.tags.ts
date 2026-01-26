/**
 * Image Tags API
 *
 * GET: Get tags for an image
 * POST: Trigger AI tagging for an image
 * PUT: Add a manual tag
 * DELETE: Remove a tag
 */

import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUserLogin } from "~/services/auth.server";
import {
  getImageTags,
  getImageAttributes,
  tagImage,
  addManualTag,
  removeTag,
} from "~/services/imageTagging.server";
import { prisma } from "~/services/prisma.server";
import { z } from "zod";

const AddTagSchema = z.object({
  tag: z.string().min(1).max(50),
});

const RemoveTagSchema = z.object({
  tag: z.string().min(1),
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const imageId = params.imageId;

  if (!imageId) {
    return json({ error: "Image ID required" }, { status: 400 });
  }

  // Check if image exists and is accessible
  const image = await prisma.image.findUnique({
    where: { id: imageId },
    select: { id: true, private: true, userId: true },
  });

  if (!image) {
    return json({ error: "Image not found" }, { status: 404 });
  }

  // For private images, require authentication
  if (image.private) {
    try {
      const user = await requireUserLogin(request);
      if (user.id !== image.userId) {
        return json({ error: "Unauthorized" }, { status: 403 });
      }
    } catch {
      return json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  const [tags, attributes] = await Promise.all([
    getImageTags(imageId),
    getImageAttributes(imageId),
  ]);

  return json({ tags, attributes });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);
  const imageId = params.imageId;

  if (!imageId) {
    return json({ error: "Image ID required" }, { status: 400 });
  }

  const method = request.method;

  if (method === "POST") {
    // Trigger AI tagging
    // Check if user owns the image
    const image = await prisma.image.findFirst({
      where: { id: imageId, userId: user.id },
    });

    if (!image) {
      return json({ error: "Image not found or unauthorized" }, { status: 404 });
    }

    try {
      const result = await tagImage(imageId);
      return json({
        success: true,
        message: `Added ${result.tags} tags and ${result.attributes} attributes`,
      });
    } catch (error) {
      return json(
        { error: error instanceof Error ? error.message : "Failed to tag image" },
        { status: 500 }
      );
    }
  }

  if (method === "PUT") {
    // Add manual tag
    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    const result = AddTagSchema.safeParse(data);
    if (!result.success) {
      return json({ error: "Invalid tag" }, { status: 400 });
    }

    try {
      const tag = await addManualTag(imageId, result.data.tag, user.id);
      return json({ success: true, tag });
    } catch (error) {
      return json(
        { error: error instanceof Error ? error.message : "Failed to add tag" },
        { status: 400 }
      );
    }
  }

  if (method === "DELETE") {
    // Remove tag
    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    const result = RemoveTagSchema.safeParse(data);
    if (!result.success) {
      return json({ error: "Invalid tag" }, { status: 400 });
    }

    try {
      await removeTag(imageId, result.data.tag, user.id);
      return json({ success: true });
    } catch (error) {
      return json(
        { error: error instanceof Error ? error.message : "Failed to remove tag" },
        { status: 400 }
      );
    }
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}
