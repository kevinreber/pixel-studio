/**
 * Fetch a Runway task and download the video if available
 *
 * Usage: npx tsx scripts/fetch-runway-task.ts <taskId>
 */

import * as fs from 'fs';
import * as path from 'path';

const RUNWAY_API_URL = "https://api.dev.runwayml.com/v1";
const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;

async function fetchTask(taskId: string) {
  if (!RUNWAY_API_KEY) {
    console.error("Error: RUNWAY_API_KEY environment variable is not set");
    console.log("\nSet it with: export RUNWAY_API_KEY=your_key_here");
    process.exit(1);
  }

  console.log(`Fetching task: ${taskId}`);

  const response = await fetch(`${RUNWAY_API_URL}/tasks/${taskId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${RUNWAY_API_KEY}`,
      "X-Runway-Version": "2024-11-06",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`Error: ${response.status}`, errorData);
    process.exit(1);
  }

  const data = await response.json();
  console.log("\n=== Task Details ===");
  console.log(JSON.stringify(data, null, 2));

  // Check if video is available
  if (data.status === "SUCCEEDED" && data.output) {
    const videoUrl = Array.isArray(data.output) ? data.output[0] : data.output;

    if (videoUrl) {
      console.log("\n=== Video URL ===");
      console.log(videoUrl);

      // Ask to download
      console.log("\n=== Downloading Video ===");

      const videoResponse = await fetch(videoUrl);
      if (!videoResponse.ok) {
        console.error("Failed to download video:", videoResponse.status);
        process.exit(1);
      }

      const buffer = await videoResponse.arrayBuffer();
      const outputPath = path.join(process.cwd(), `runway-video-${taskId}.mp4`);
      fs.writeFileSync(outputPath, Buffer.from(buffer));

      console.log(`Video saved to: ${outputPath}`);
      console.log(`Size: ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
    }
  } else {
    console.log(`\nTask status: ${data.status}`);
    if (data.status !== "SUCCEEDED") {
      console.log("Video not ready yet or task failed.");
    }
  }
}

// Get task ID from command line
const taskId = process.argv[2] || "122dc0a4-a9fc-4ed6-989f-0cced62b14d4";

fetchTask(taskId).catch(console.error);
