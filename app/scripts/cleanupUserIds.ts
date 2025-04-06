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

interface CleanupResults {
  usersToUpdate: number;
  usersUpdated: number;
  invalidUsers: {
    id: string;
    email: string | null;
    archived_google_id: string | null;
    new_supabase_id: string | null;
  }[];
}

async function cleanupUserIds(dryRun = true): Promise<CleanupResults> {
  // 1. Get all users where id doesn't match new_supabase_id
  const usersToCheck = await prisma.user.findMany({
    where: {
      new_supabase_id: {
        not: null,
      },
      NOT: {
        id: {
          equals: prisma.user.fields.new_supabase_id,
        },
      },
    },
    select: {
      id: true,
      email: true,
      archived_google_id: true,
      new_supabase_id: true,
    },
  });

  console.log(`Found ${usersToCheck.length} users with mismatched IDs`);

  // 2. Separate valid and invalid users
  const invalidUsers = usersToCheck.filter(
    (user) => user.id !== user.archived_google_id
  );
  const validUsers = usersToCheck.filter(
    (user) => user.id === user.archived_google_id
  );

  // Log invalid users that need manual review
  if (invalidUsers.length > 0) {
    console.log("\nUsers requiring manual review:");
    console.log("------------------------------");
    invalidUsers.forEach((user) => {
      console.log(`Email: ${user.email}`);
      console.log(`Current ID: ${user.id}`);
      console.log(`Archived Google ID: ${user.archived_google_id}`);
      console.log(`New Supabase ID: ${user.new_supabase_id}`);
      console.log("------------------------------");
    });
  }

  // 3. Update valid users
  let usersUpdated = 0;
  if (!dryRun && validUsers.length > 0) {
    for (const user of validUsers) {
      if (!user.new_supabase_id) continue;

      await prisma.user.update({
        where: { id: user.id },
        data: { id: user.new_supabase_id },
      });
      usersUpdated++;
      console.log(`Updated user ${user.email} with new Supabase ID`);
    }
  }

  return {
    usersToUpdate: validUsers.length,
    usersUpdated,
    invalidUsers,
  };
}

async function runCleanup(dryRun = true) {
  console.log(`Starting cleanup in ${dryRun ? "dry run" : "live"} mode...`);

  try {
    const results = await cleanupUserIds(dryRun);

    console.log("\nCleanup Results:");
    console.log("----------------");
    console.log(`Users needing updates: ${results.usersToUpdate}`);
    console.log(`Users updated: ${results.usersUpdated}`);
    console.log(
      `Users requiring manual review: ${results.invalidUsers.length}`
    );

    if (dryRun) {
      console.log("\nThis was a dry run. No changes were made.");
    }

    return results;
  } catch (error) {
    console.error("Cleanup failed:", error);
    throw error;
  }
}

// Run the cleanup
runCleanup(true) // Set to false to perform actual updates
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

export { runCleanup };
