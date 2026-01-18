/**
 * Video Thumbnail Extraction Utility
 *
 * Uses FFmpeg to extract the first frame from a video buffer
 * and returns it as a JPEG image buffer.
 */

import ffmpeg from "fluent-ffmpeg";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";

/**
 * Extract the first frame from a video buffer as a JPEG thumbnail
 *
 * @param videoBuffer - The video file as a Buffer
 * @returns Promise<Buffer> - The thumbnail image as a JPEG buffer
 */
export async function extractVideoThumbnail(
  videoBuffer: Buffer
): Promise<Buffer> {
  // FFmpeg requires file-based input/output for screenshots
  // We'll use temp files for the operation
  const tempDir = os.tmpdir();
  const uniqueId = crypto.randomBytes(8).toString("hex");
  const tempVideoPath = path.join(tempDir, `video-${uniqueId}.mp4`);
  const tempThumbnailPath = path.join(tempDir, `thumb-${uniqueId}.jpg`);

  try {
    // Write video buffer to temp file
    await fs.promises.writeFile(tempVideoPath, videoBuffer);

    // Extract first frame using FFmpeg
    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempVideoPath)
        .on("error", (err) => {
          console.error("FFmpeg error:", err);
          reject(new Error(`Failed to extract thumbnail: ${err.message}`));
        })
        .on("end", () => {
          resolve();
        })
        .screenshots({
          count: 1,
          folder: tempDir,
          filename: `thumb-${uniqueId}.jpg`,
          timestamps: ["0%"], // First frame
          size: "640x?", // 640px width, maintain aspect ratio
        });
    });

    // Read the generated thumbnail
    const thumbnailBuffer = await fs.promises.readFile(tempThumbnailPath);

    return thumbnailBuffer;
  } finally {
    // Clean up temp files
    try {
      await fs.promises.unlink(tempVideoPath).catch(() => {});
      await fs.promises.unlink(tempThumbnailPath).catch(() => {});
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Extract thumbnail with retry logic for robustness
 *
 * @param videoBuffer - The video file as a Buffer
 * @param maxRetries - Maximum number of retry attempts (default: 2)
 * @returns Promise<Buffer | null> - The thumbnail buffer or null if extraction fails
 */
export async function extractVideoThumbnailSafe(
  videoBuffer: Buffer,
  maxRetries: number = 2
): Promise<Buffer | null> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const thumbnail = await extractVideoThumbnail(videoBuffer);
      return thumbnail;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `Thumbnail extraction attempt ${attempt + 1} failed:`,
        lastError.message
      );

      if (attempt < maxRetries) {
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  console.error("All thumbnail extraction attempts failed:", lastError);
  return null;
}
