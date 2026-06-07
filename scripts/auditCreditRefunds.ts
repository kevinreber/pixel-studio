#!/usr/bin/env tsx
/* eslint-disable no-console */

/**
 * Credit-refund audit
 * --------------------
 * Runs against the production database to verify the fix in PR #150
 * (qstash.server.ts flipped `refundCredits: false → true`) is behaving
 * correctly: failed generations should produce exactly one `CreditTransaction`
 * of `type=refund`, never zero and never two.
 *
 * What this reports:
 *   1. Volume — refund rows over the last 7d and 30d
 *   2. Double-fires — same userId + same generationLogId producing >1 refund
 *   3. Orphans — refund rows with no preceding `spend` row referencing the
 *      same generation (suggests a refund without a charge)
 *   4. Mean / median refund amount, distribution by day
 *
 * Run:
 *   DATABASE_URL=... npx tsx scripts/auditCreditRefunds.ts
 *
 * Tracks: REDESIGN_FOLLOWUPS.md → "Credit-refund audit"
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;

async function main() {
  const now = Date.now();
  const since7d = new Date(now - 7 * DAY);
  const since30d = new Date(now - 30 * DAY);

  console.log("=== Credit refund audit ===");
  console.log(`Now: ${new Date(now).toISOString()}`);
  console.log("");

  // ---------- 1. Volume ----------
  const [count7d, count30d] = await Promise.all([
    prisma.creditTransaction.count({
      where: { type: "refund", createdAt: { gte: since7d } },
    }),
    prisma.creditTransaction.count({
      where: { type: "refund", createdAt: { gte: since30d } },
    }),
  ]);

  console.log(`Volume:`);
  console.log(`  Refund rows in last 7d:  ${count7d}`);
  console.log(`  Refund rows in last 30d: ${count30d}`);
  console.log("");

  if (count30d === 0) {
    console.log("No refunds in the last 30d. Either:");
    console.log("  (a) No generations failed (good)");
    console.log("  (b) The refund path isn't firing (bad — the bug is back)");
    console.log("");
    console.log("Cross-check: count failed generations in the same window.");
    await prisma.$disconnect();
    return;
  }

  // ---------- 2. Double-fires ----------
  // A double-fire = same userId + same generationLogId produced >1 refund.
  const refundRows30d = await prisma.creditTransaction.findMany({
    where: { type: "refund", createdAt: { gte: since30d } },
    select: { id: true, userId: true, generationLogId: true, amount: true, createdAt: true },
  });

  type RefundRow = (typeof refundRows30d)[number];
  const byUserGen = new Map<string, RefundRow[]>();
  for (const r of refundRows30d) {
    if (!r.generationLogId) continue;
    const key = `${r.userId}::${r.generationLogId}`;
    const arr = byUserGen.get(key) ?? [];
    arr.push(r);
    byUserGen.set(key, arr);
  }
  const doubleFires = [...byUserGen.entries()].filter(([, rows]) => rows.length > 1);

  console.log(`Double-fires (same user + same generation, multiple refunds):`);
  if (doubleFires.length === 0) {
    console.log(`  None ✓`);
  } else {
    console.log(`  ${doubleFires.length} cases found:`);
    for (const [key, rows] of doubleFires.slice(0, 10)) {
      const [userId, genId] = key.split("::");
      const amounts = rows.map((r) => r.amount).join(", ");
      const times = rows.map((r) => r.createdAt.toISOString()).join(" / ");
      console.log(`    user=${userId} gen=${genId}`);
      console.log(`      amounts=[${amounts}] at ${times}`);
    }
    if (doubleFires.length > 10) {
      console.log(`    … and ${doubleFires.length - 10} more`);
    }
  }
  console.log("");

  // ---------- 3. Orphans ----------
  // An orphan = refund references a generationLogId that has no
  // corresponding `spend` row. (A refund should always follow a charge.)
  const refundsWithGen = refundRows30d.filter((r) => r.generationLogId);
  let orphans = 0;
  const orphanSamples: { userId: string; generationLogId: string }[] = [];
  for (const refund of refundsWithGen) {
    const spend = await prisma.creditTransaction.findFirst({
      where: {
        userId: refund.userId,
        generationLogId: refund.generationLogId,
        type: "spend",
      },
      select: { id: true },
    });
    if (!spend) {
      orphans += 1;
      if (orphanSamples.length < 5) {
        orphanSamples.push({
          userId: refund.userId,
          generationLogId: refund.generationLogId!,
        });
      }
    }
  }
  console.log(`Orphan refunds (refund with no matching spend):`);
  if (orphans === 0) {
    console.log(`  None ✓`);
  } else {
    console.log(`  ${orphans} of ${refundsWithGen.length} refunds have no matching spend row`);
    for (const o of orphanSamples) {
      console.log(`    user=${o.userId} gen=${o.generationLogId}`);
    }
  }
  console.log("");

  // ---------- 4. Distribution ----------
  const amounts = refundRows30d.map((r) => Math.abs(r.amount)).sort((a, b) => a - b);
  const mean = amounts.reduce((s, a) => s + a, 0) / amounts.length;
  const median = amounts[Math.floor(amounts.length / 2)];
  console.log(`Refund amounts (last 30d):`);
  console.log(`  Count:  ${amounts.length}`);
  console.log(`  Mean:   ${mean.toFixed(2)} credits`);
  console.log(`  Median: ${median} credits`);
  console.log(`  Min:    ${amounts[0]} credits`);
  console.log(`  Max:    ${amounts[amounts.length - 1]} credits`);
  console.log("");

  // ---------- 5. Per-day counts ----------
  console.log(`Refunds per day (last 30d):`);
  const perDay = new Map<string, number>();
  for (const r of refundRows30d) {
    const day = r.createdAt.toISOString().slice(0, 10);
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }
  const days = [...perDay.entries()].sort();
  for (const [day, n] of days) {
    const bar = "▇".repeat(Math.min(n, 40));
    console.log(`  ${day} ${String(n).padStart(4)} ${bar}`);
  }

  console.log("");
  console.log("=== Done ===");
  console.log("");
  console.log("What to look for:");
  console.log("  Double-fires should be 0.   (If >0, the QStash retry is firing refunds twice.)");
  console.log("  Orphans should be 0.        (If >0, refunds are firing without a corresponding charge.)");
  console.log("  Volume should be > 0 on days you know generations failed (cross-check Sentry).");

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
