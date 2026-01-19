/**
 * Backfill Video Thumbnails
 *
 * This script generates thumbnails for existing videos that don't have them.
 * It downloads each video from S3, extracts the first frame using FFmpeg,
 * and uploads the thumbnail back to S3.
 *
 * Usage: npx tsx scripts/backfillVideoThumbnails.ts [--dry-run] [--limit=N]
 *
 * Options:
 *   --dry-run   Show what would be done without making changes
 *   --limit=N   Process only N videos (default: all)
 *
 * Requirements:
 *   - FFmpeg must be installed on the system
 *   - Environment variables: DATABASE_URL, S3 credentials
 */

import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import ffmpeg from "fluent-ffmpeg";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const limitArg = args.find((a) => a.startsWith("--limit="));
const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : undefined;

// Initialize clients
const prisma = new PrismaClient();

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID_AWS!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY_AWS!,
  },
  region: process.env.REGION_AWS!,
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME_AWS || "";
const S3_BUCKET_URL = process.env.S3_BUCKET_URL_AWS || "";
// Thumbnail bucket name - defaults to main bucket with "-resized" suffix
const S3_THUMBNAIL_BUCKET_NAME =
  process.env.S3_BUCKET_THUMBNAIL_NAME_AWS ||
  (S3_BUCKET_NAME ? `${S3_BUCKET_NAME}-resized` : "");

/**
 * Check if a thumbnail already exists in S3
 */
async function thumbnailExists(videoId: string): Promise<boolean> {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: S3_THUMBNAIL_BUCKET_NAME,
        Key: `video-thumb-${videoId}`,
      })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Download video from S3
 */
async function downloadVideo(videoId: string): Promise<Buffer> {
  const videoUrl = `${S3_BUCKET_URL}/videos/${videoId}`;
  console.log(`  Downloading from: ${videoUrl}`);

  const response = await fetch(videoUrl, {
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Extract first frame from video using FFmpeg
 */
async function extractThumbnail(videoBuffer: Buffer): Promise<Buffer> {
  const tempDir = os.tmpdir();
  const uniqueId = crypto.randomBytes(8).toString("hex");
  const tempVideoPath = path.join(tempDir, `video-${uniqueId}.mp4`);
  const tempThumbnailPath = path.join(tempDir, `thumb-${uniqueId}.jpg`);

  try {
    await fs.promises.writeFile(tempVideoPath, videoBuffer);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempVideoPath)
        .on("error", (err) => {
          reject(new Error(`FFmpeg error: ${err.message}`));
        })
        .on("end", () => {
          resolve();
        })
        .screenshots({
          count: 1,
          folder: tempDir,
          filename: `thumb-${uniqueId}.jpg`,
          timestamps: ["0%"],
          size: "640x?",
        });
    });

    const thumbnailBuffer = await fs.promises.readFile(tempThumbnailPath);
    return thumbnailBuffer;
  } finally {
    await fs.promises.unlink(tempVideoPath).catch(() => {});
    await fs.promises.unlink(tempThumbnailPath).catch(() => {});
  }
}

/**
 * Upload thumbnail to S3
 */
async function uploadThumbnail(
  videoId: string,
  thumbnailBuffer: Buffer
): Promise<void> {
  const key = `video-thumb-${videoId}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_THUMBNAIL_BUCKET_NAME,
      Key: key,
      Body: thumbnailBuffer,
      ContentType: "image/jpeg",
    })
  );

  console.log(`  Uploaded thumbnail to ${S3_THUMBNAIL_BUCKET_NAME}: ${key}`);
}

type ProcessResult = "processed" | "skipped" | "failed";

/**
 * Process a single video
 */
async function processVideo(video: { id: string; prompt: string }): Promise<ProcessResult> {
  console.log(`\nProcessing video: ${video.id}`);
  console.log(`  Prompt: ${video.prompt.substring(0, 50)}...`);

  try {
    // Check if thumbnail already exists
    const exists = await thumbnailExists(video.id);
    if (exists) {
      console.log(`  Thumbnail already exists, skipping`);
      return "skipped";
    }

    if (isDryRun) {
      console.log(`  [DRY RUN] Would generate thumbnail`);
      return "processed";
    }

    // Download video
    const videoBuffer = await downloadVideo(video.id);
    console.log(`  Downloaded: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Extract thumbnail
    const thumbnailBuffer = await extractThumbnail(videoBuffer);
    console.log(`  Extracted thumbnail: ${(thumbnailBuffer.length / 1024).toFixed(2)} KB`);

    // Upload thumbnail
    await uploadThumbnail(video.id, thumbnailBuffer);

    return "processed";
  } catch (error) {
    console.error(`  Error: ${error instanceof Error ? error.message : error}`);
    return "failed";
  }
}

/**
 * Main function
 */
async function main() {
  console.log("=== Video Thumbnail Backfill ===\n");

  if (isDryRun) {
    console.log("Running in DRY RUN mode - no changes will be made\n");
  }

  // Validate environment
  if (!S3_BUCKET_NAME || !S3_BUCKET_URL || !S3_THUMBNAIL_BUCKET_NAME) {
    console.error("Error: S3 environment variables not configured");
    console.log("Required: S3_BUCKET_NAME_AWS, S3_BUCKET_URL_AWS, ACCESS_KEY_ID_AWS, SECRET_ACCESS_KEY_AWS, REGION_AWS");
    process.exit(1);
  }

  console.log(`Thumbnail bucket: ${S3_THUMBNAIL_BUCKET_NAME}`);

  // Fetch all completed videos
  console.log("Fetching videos from database...");

  const videos = await prisma.video.findMany({
    where: {
      status: "complete",
    },
    select: {
      id: true,
      prompt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  console.log(`Found ${videos.length} completed videos${limit ? ` (limited to ${limit})` : ""}`);

  // Process videos
  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const video of videos) {
    const result = await processVideo(video);
    if (result === "processed") {
      processed++;
    } else if (result === "skipped") {
      skipped++;
    } else {
      failed++;
    }
  }

  // Summary
  console.log("\n=== Summary ===");
  console.log(`Total videos: ${videos.length}`);
  console.log(`Processed: ${processed}`);
  console.log(`Skipped (already had thumbnail): ${skipped}`);
  console.log(`Failed: ${failed}`);

  if (isDryRun) {
    console.log("\n[DRY RUN] No changes were made");
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
