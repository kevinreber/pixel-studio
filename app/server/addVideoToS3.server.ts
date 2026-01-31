/**
 * Upload video to AWS S3
 *
 * Handles uploading video files to S3 with proper content type
 * and optional thumbnail generation
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID_AWS!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY_AWS!,
  },
  region: process.env.REGION_AWS!,
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME_AWS || "";
// Thumbnail bucket - defaults to main bucket with "-resized" suffix if not specified
const S3_THUMBNAIL_BUCKET_NAME =
  process.env.S3_BUCKET_THUMBNAIL_NAME_AWS ||
  (S3_BUCKET_NAME ? `${S3_BUCKET_NAME}-resized` : "");

export interface AddVideoToS3Params {
  videoId: string;
  videoBuffer: Buffer;
  contentType?: string;
}

/**
 * Upload a video buffer to S3
 */
export const addVideoToS3 = async ({
  videoId,
  videoBuffer,
  contentType = "video/mp4",
}: AddVideoToS3Params): Promise<{ success: boolean; key: string }> => {
  const key = `videos/${videoId}`;

  try {
    console.log(`Uploading video ${videoId} to S3...`);

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: videoBuffer,
      ContentType: contentType,
      // Enable public read if needed
      // ACL: "public-read",
    });

    await s3Client.send(command);

    console.log(`Successfully uploaded video ${videoId} to S3`);

    return {
      success: true,
      key,
    };
  } catch (error) {
    console.error(`Error uploading video to S3: ${error}`);
    throw new Error(
      `Failed to upload video to S3: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Upload a video thumbnail to S3
 */
export const addVideoThumbnailToS3 = async ({
  videoId,
  thumbnailBuffer,
  contentType = "image/jpeg",
}: {
  videoId: string;
  thumbnailBuffer: Buffer;
  contentType?: string;
}): Promise<{ success: boolean; key: string }> => {
  const key = `video-thumb-${videoId}`;

  try {
    console.log(`Uploading video thumbnail ${videoId} to S3 bucket: ${S3_THUMBNAIL_BUCKET_NAME}...`);

    const command = new PutObjectCommand({
      Bucket: S3_THUMBNAIL_BUCKET_NAME,
      Key: key,
      Body: thumbnailBuffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    console.log(`Successfully uploaded video thumbnail ${videoId} to S3`);

    return {
      success: true,
      key,
    };
  } catch (error) {
    console.error(`Error uploading video thumbnail to S3: ${error}`);
    throw new Error(
      `Failed to upload video thumbnail to S3: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
