/**
 * Source Image Storage Utility
 *
 * This module handles storing source images for video generation.
 * - If the image is already in our S3, we just return the URL
 * - If the image is external, we download and upload to S3 for persistence
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createId } from "@paralleldrive/cuid2";

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID_AWS!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY_AWS!,
  },
  region: process.env.REGION_AWS!,
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME_AWS || "";
const S3_BUCKET_URL = process.env.S3_BUCKET_URL_AWS || "";

/**
 * Check if a URL is from our S3 bucket
 */
export function isOurS3Url(url: string): boolean {
  if (!url || !S3_BUCKET_URL) return false;

  // Check if the URL starts with our S3 bucket URL
  // e.g., https://ai-icon-generator.s3.us-east-2.amazonaws.com/
  return url.startsWith(S3_BUCKET_URL);
}

/**
 * Extract image ID from our S3 URL
 */
export function extractImageIdFromS3Url(url: string): string | null {
  if (!isOurS3Url(url)) return null;

  // URL format: https://bucket.s3.region.amazonaws.com/{imageId}
  const parts = url.split("/");
  return parts[parts.length - 1] || null;
}

/**
 * Download an image from a URL and return as Buffer
 */
async function downloadImage(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(30000), // 30 second timeout
  });

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "image/png";
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Validate it's actually an image
  if (!contentType.startsWith("image/")) {
    throw new Error(`URL does not point to an image. Content-Type: ${contentType}`);
  }

  return { buffer, contentType };
}

/**
 * Upload an image buffer to S3 for video source images
 */
async function uploadSourceImageToS3(
  buffer: Buffer,
  contentType: string
): Promise<{ id: string; url: string }> {
  const id = `video-source-${createId()}`;
  const key = `video-sources/${id}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  const url = `${S3_BUCKET_URL}/video-sources/${id}`;

  return { id, url };
}

export interface StoreSourceImageResult {
  url: string;
  sourceImageId: string | null;
  wasExternal: boolean;
}

/**
 * Store a source image for video generation
 *
 * If the URL is already in our S3, returns it as-is.
 * If the URL is external, downloads and uploads to our S3 for persistence.
 *
 * @param sourceImageUrl - The URL of the source image
 * @returns Object with the (possibly new) URL and metadata
 */
export async function storeSourceImage(
  sourceImageUrl: string
): Promise<StoreSourceImageResult> {
  if (!sourceImageUrl) {
    throw new Error("Source image URL is required");
  }

  // If it's already our S3 URL, just return it
  if (isOurS3Url(sourceImageUrl)) {
    const imageId = extractImageIdFromS3Url(sourceImageUrl);
    console.log(`Source image is already in our S3: ${imageId}`);
    return {
      url: sourceImageUrl,
      sourceImageId: imageId,
      wasExternal: false,
    };
  }

  // External URL - download and upload to our S3
  console.log(`Downloading external source image: ${sourceImageUrl}`);

  try {
    const { buffer, contentType } = await downloadImage(sourceImageUrl);
    console.log(`Downloaded image: ${buffer.length} bytes, type: ${contentType}`);

    const { id, url } = await uploadSourceImageToS3(buffer, contentType);
    console.log(`Uploaded source image to S3: ${id}`);

    return {
      url,
      sourceImageId: id,
      wasExternal: true,
    };
  } catch (error) {
    console.error("Failed to store external source image:", error);
    throw new Error(
      `Failed to store source image: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
