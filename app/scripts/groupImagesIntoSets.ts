import { PrismaClient } from "@prisma/client";
import { singleton } from "utils/singleton";

const prisma = singleton("prisma", () => {
  const client = new PrismaClient({
    log: [{ level: "error", emit: "stdout" }],
  });

  client.$connect().catch((e) => {
    console.error("Failed to connect to database:", e);
    process.exit(1);
  });

  return client;
});

interface GroupingResults {
  totalImages: number;
  uniquePrompts: number;
  setsCreated: number;
  imagesUpdated: number;
}

async function groupImagesIntoSets(dryRun = true): Promise<GroupingResults> {
  // 1. Get all images without a setId
  const images = await prisma.image.findMany({
    where: {
      setId: null,
    },
    select: {
      id: true,
      prompt: true,
      userId: true,
    },
  });

  console.log(`Found ${images.length} images without sets`);

  // 2. Group images by prompt and userId
  const groupedImages = images.reduce((acc, img) => {
    const key = `${img.userId}-${img.prompt}`;
    if (!acc[key]) {
      acc[key] = {
        userId: img.userId,
        prompt: img.prompt,
        imageIds: [],
      };
    }
    acc[key].imageIds.push(img.id);
    return acc;
  }, {} as Record<string, { userId: string; prompt: string; imageIds: string[] }>);

  const groups = Object.values(groupedImages);
  console.log(`Grouped into ${groups.length} unique prompt groups`);

  let setsCreated = 0;
  let imagesUpdated = 0;

  if (!dryRun) {
    // 3. Create sets and update images
    for (const group of groups) {
      try {
        // Create new set
        const newSet = await prisma.set.create({
          data: {
            prompt: group.prompt,
            userId: group.userId,
          },
        });

        // Update all images in the group with the new setId
        await prisma.image.updateMany({
          where: {
            id: {
              in: group.imageIds,
            },
          },
          data: {
            setId: newSet.id,
          },
        });

        setsCreated++;
        imagesUpdated += group.imageIds.length;

        console.log(
          `Created set for prompt "${group.prompt.slice(0, 25)}..." with ${
            group.imageIds.length
          } images`
        );
      } catch (error) {
        console.error(
          `Error processing group with prompt "${group.prompt.slice(
            0,
            50
          )}..."`,
          error
        );
      }
    }
  }

  return {
    totalImages: images.length,
    uniquePrompts: groups.length,
    setsCreated,
    imagesUpdated,
  };
}

async function runGrouping(dryRun = true) {
  console.log(`Starting grouping in ${dryRun ? "dry run" : "live"} mode...`);

  try {
    const results = await groupImagesIntoSets(dryRun);

    console.log("\nGrouping Results:");
    console.log("----------------");
    console.log(`Total images processed: ${results.totalImages}`);
    console.log(`Unique prompt groups: ${results.uniquePrompts}`);
    console.log(`Sets created: ${results.setsCreated}`);
    console.log(`Images updated: ${results.imagesUpdated}`);

    if (dryRun) {
      console.log("\nThis was a dry run. No changes were made.");
    }

    return results;
  } catch (error) {
    console.error("Grouping failed:", error);
    throw error;
  }
}

// Run the grouping
runGrouping(true) // Set to false to perform actual updates
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

export { runGrouping };
