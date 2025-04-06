import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { singleton } from "utils/singleton";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Verify environment variables
if (!process.env.DATABASE_BASE_URL || !process.env.DATABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables:");
  if (!process.env.DATABASE_BASE_URL) console.error("- DATABASE_BASE_URL");
  if (!process.env.DATABASE_SERVICE_ROLE_KEY)
    console.error("- DATABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const prisma = singleton("prisma", () => {
  const client = new PrismaClient({
    log: [{ level: "error", emit: "stdout" }],
  });

  // Properly handle connection
  client.$connect().catch((e) => {
    console.error("Failed to connect to database:", e);
    process.exit(1);
  });

  return client;
});

const supabase = createClient(
  process.env.DATABASE_BASE_URL!,
  process.env.DATABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

interface MigrationResults {
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
}

async function migrateUsersToSupabase(
  client: SupabaseClient,
  dryRun: boolean
): Promise<MigrationResults> {
  const existingUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      image: true,
    },
    // where: {
    //   email: { contains: "kevin", not: "kevinreber1@gmail.com" },
    // },
    where: {
      new_supabase_id: { equals: null },
    },
  });

  console.log(`Found ${existingUsers.length} users to migrate`);

  const results: MigrationResults = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  for (const user of existingUsers) {
    try {
      console.log(`Processing user: ${user.email}`);

      if (dryRun) {
        results.success++;
        console.log(`[DRY RUN] Would migrate user: ${user.email}`);
        continue;
      }

      // Create user in Supabase (it will generate a UUID)
      const { data: newSupabaseUser, error } =
        await client.auth.admin.createUser({
          email: user.email,
          email_confirm: true,
          user_metadata: {
            name: user.name,
            avatar_url: user.image,
            picture: user.image,
            provider: "google",
            google_id: user.id,
            full_name: user.name,
          },
          app_metadata: {
            provider: "google",
            providers: ["google"],
          },
        });

      if (error) throw error;
      if (!newSupabaseUser) throw new Error("No user created");

      // Update our User table with new Supabase UUID and archive old ID
      await prisma.user.update({
        // where: { id: user.id },
        where: { email: user.email },
        data: {
          new_supabase_id: newSupabaseUser.user.id, // New Supabase UUID
          archived_google_id: user.id, // Store original Google ID
        },
      });

      results.success++;
      console.log(`Successfully migrated user: ${user.email}`);
      console.log(`Old ID: ${user.id}`);
      console.log(`New ID: ${newSupabaseUser.user.id}`);
    } catch (error) {
      results.failed++;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      results.errors.push(`Failed to migrate user ${user.id}: ${errorMessage}`);
      console.error(`Error migrating user ${user.id}:`, error);
    }
  }

  return results;
}

async function runMigration(dryRun = true) {
  console.log(`Starting migration in ${dryRun ? "dry run" : "live"} mode...`);

  try {
    const results = await migrateUsersToSupabase(supabase, dryRun);

    console.log("\nMigration Results:");
    console.log("------------------");
    console.log(`Success: ${results.success}`);
    console.log(`Skipped: ${results.skipped}`);
    console.log(`Failed: ${results.failed}`);

    if (results.errors.length > 0) {
      console.log("\nErrors:");
      results.errors.forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
    }

    if (dryRun) {
      console.log("\nThis was a dry run. No changes were made.");
    }

    return results;
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Run the migration directly
runMigration(true) // Set to false to perform actual migration
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

export { runMigration };
