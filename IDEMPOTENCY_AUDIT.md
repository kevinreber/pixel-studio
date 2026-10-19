# Idempotency & Duplicate-Write Audit

**As of:** 2026-10-04
**Status:** P0 items fixed in [PR #163](https://github.com/kevinreber/pixel-studio/pull/163); the Stripe migration is applied in production as of 2026-10-18. P1 and P2 items are open and need decisions. A separate critical finding — Row Level Security disabled in production — was fixed on 2026-10-18 and is recorded in the appendix.
**Live doc:** https://claude.ai/code/artifact/c492547a-34b2-4692-8f9e-a1df4a198406

> This file is the in-repo snapshot so the audit can be referenced from any session without opening the live doc. The live doc is the version that gets edited and commented on; if the two disagree, the live doc is newer.

## Summary

Eight issues, across account creation, image and video generation, and credit purchase. The most damaging one is not an idempotency bug at all: production video generation charged credits against a callback route that did not exist, so users paid for videos that were never created and never refunded.

The audit traced every write path a retry, a duplicate webhook delivery, or a double submit can reach. Exactly one deliberate idempotency mechanism existed in the codebase, a Redis claim on image-generation worker jobs, and it guards the expensive provider call rather than the charge.

| Pri | Issue | Primary file | What breaks | Effort | Status |
| --- | --- | --- | --- | --- | --- |
| P0 | Video callback route is absent | `app/routes/api.queue.process-video.tsx` | Every production video charges credits, 404s, never refunds | Medium | Fixed in #163 |
| P0 | Stripe webhook is not deduplicated | `app/services/webhook.server.ts` | One payment can grant 100 credits repeatedly | Small | Fixed in #163 |
| P0 | Image worker skips logging and refunds | `app/routes/api.queue.process-image.tsx` | No audit trail in production; failed generations never refunded | Small | Fixed in #163 |
| P1 | User creation races | `app/server/createNewUser.ts` | Concurrent signup returns a 500 on a signup that succeeded | Small | Open |
| P1 | Generation claim is non-atomic and fails open | `app/services/processingStatus.server.ts` | Duplicate deliveries can both generate and both spend | Medium | Open |
| P2 | No client idempotency key on submits | `app/routes/create.tsx` | A double submit is two charges and two generations | Medium | Open |
| P2 | Three copies of user-creation logic | `createNewUser.ts`, `auth.server.ts`, `getLoggedInUserData.ts` | Every fix has to land in three places | Small | Open |
| P2 | No regression tests on any of this | `tests/` | Nothing guards the fixes once they land | Medium | Open |

## P0-1. The video callback route did not exist

Every production video generation charged the user and delivered nothing. This was the most expensive bug found and it is not an idempotency problem.

`qstash.server.ts:436` publishes production video jobs to `${baseUrl}/api/queue/process-video`. The `app/routes/` directory contained only `api.queue.process-image.tsx` and `api.queue.status.tsx`; there was no `api.queue.process-video.tsx` and no other handler for that path. Meanwhile `create-video.tsx:201` deducts credits upfront, before queueing, exactly as the image path does.

The result in production was that credits were deducted, QStash received the job, called a URL that returned 404 on all three configured retries, and gave up. The user was charged and never refunded, because `logGenerationFailed` with `refundCredits: true` was only reached from the local-development worker in `qstash.server.ts`, never from a production callback.

Local development was unaffected, because `isLocalDevelopment()` routes to `processVideoGenerationLocally` instead of publishing to QStash. That is why the gap was not visible in testing.

**Fix (shipped).** `app/routes/api.queue.process-video.tsx` mirrors the image worker: verifies the QStash signature, claims the request through `claimProcessingRequest`, calls `createNewVideos`, publishes status updates, and on failure calls `logGenerationFailed` with a refund. It creates no notification, matching the local video worker, because no `VIDEO_COMPLETED` notification type exists in the schema.

## P0-2. The Stripe webhook granted credits on every delivery

One completed checkout could grant 100 credits several times, because nothing in the handler was keyed to the Stripe event.

`webhook.ts:38` constructs the event and passes `event.id` into `handleStripeEvent`. That id was written to the log and never used again. `handleCheckoutSession` went straight to `prisma.user.update` with `credits: { increment: 100 }`, with no prior check for whether this event was already applied. `CreditTransaction.stripeSessionId` is indexed but not unique, so the ledger recorded duplicates rather than rejecting them. The handler also never inspected `session.payment_status`.

Stripe delivers webhooks at least once and retries on any non-2xx response, so duplicates are expected traffic, not an edge case.

**Fix (shipped).** A nullable `stripeEventId` column with a unique constraint was added to `CreditTransaction`. The credit increment and the ledger row now happen inside a single `prisma.$transaction`. A replayed event fails the insert with P2002, which rolls the increment back, and the handler returns a `duplicate_ignored` result with HTTP 200 so Stripe stops retrying. Sessions whose `payment_status` is neither `paid` nor `no_payment_required` are skipped.

A nullable new column was deliberately chosen over making `stripeSessionId` unique: existing rows become NULL, Postgres permits many NULLs in a unique index, and the migration cannot fail on historical duplicates. Making `stripeSessionId` unique would require reconciling production data first.

> **Deploy note — applied 2026-10-18.** `CreditTransaction.stripeEventId` and its unique index now exist in production. Verified after applying: the column is nullable `text`, the index is `CreditTransaction_stripeEventId_key`, and all existing rows carry NULL.
>
> This repo has no automated migration step. `prisma/migrations/` holds flat `.sql` files with no `migration_lock.toml`, so it is not a Prisma-managed migrations directory, and `postinstall` runs `prisma generate` only. The migration was therefore applied by hand rather than by the deploy pipeline. One consequence to watch: running `npx prisma db push` from a branch that lacks this schema change will see the column as drift and offer to drop it.

## P0-3. The production image worker never logged or refunded

Production image generations left no audit trail, and failures were never refunded, because the logging helpers were only wired into the local-development code path.

`logGenerationStart` and `logGenerationFailed` appeared only in `app/services/qstash.server.ts`, in the two local workers and the comparison parent. `api.queue.process-image.tsx` called neither. Three consequences followed. Production single-model generations wrote no `GenerationLog` row, so the generation-history settings page was missing them. They also wrote no `CreditTransaction` spend row, because `logCreditSpend` is called from inside `logGenerationStart`, so the credit-history page showed purchases but not spending. And since `create.tsx:335` charges upfront for async generations, a failed generation was never refunded, even though the local worker does exactly that with `refundCredits: true`.

The `@unique` on `GenerationLog.requestId` was clearly intended as the replay guard for this path. It was never exercised, because nothing wrote the row.

**Fix (shipped).** `api.queue.process-image.tsx` now calls `logGenerationStart` after a successful claim, `logGenerationComplete` on success, and `logGenerationFailed` with a refund in the catch block.

### Known limitation (tracked TODO)

Logging is skipped for comparison child requests, because `queueComparisonGenerationQStash` already logs the full multi-model cost once against the parent at queue time. Logging each child would double-count the spend in the ledger. The consequence is that **a failed comparison child still does not refund its share.** Fixing that means restructuring how comparison credit cost is attributed, which is a larger change than these P0 fixes. Decided on 2026-10-04 to accept this as a tracked TODO; the TODO is recorded in the catch block of `api.queue.process-image.tsx` next to the skipped refund.

### Related: the refund path has a silent failure window

`logGenerationStart` swallows every error by design, so logging trouble cannot break a generation. `logGenerationFailed` then looks the row up by `requestId` and, finding none, warns and returns before reaching the refund.

The concrete sequence: a transient database error makes the `generationLog.create` fail, the worker proceeds because the error was swallowed, the generation then fails for an unrelated reason, `logGenerationFailed` finds no row, and the user is charged with no refund. This affects both refund paths equally and is inherited behaviour, not introduced by the P0 fixes. The fix belongs in `generationLog.server.ts` rather than in the callers: either make the refund independent of the log row existing, or let `logGenerationStart` surface a failure the caller can act on.

## P1-4. Account creation converges by luck, not by design

A concurrent signup cannot create two accounts, but it returns a 500 on a signup that actually succeeded.

Three near-identical copies of the same read-then-create pattern exist: `createNewUserWithSupabaseData` at `createNewUser.ts:56`, `handleAuthCallback` at `auth.server.ts:209`, and the create fallback in `getLoggedInUserData.ts`. Each looks the user up by id, falls back to looking them up by email, then calls `prisma.user.create`. `createNewUserWithGoogleSSOData` at `createNewUser.ts:20` has no existence check at all. There is no `prisma.user.upsert` anywhere in the codebase, although upsert is used freely for conversations, achievements, reviews, streaks, analytics, tags, and print products.

What saves this today is that the primary key is the identity provider's own id, and `username` and `email` both carry `@unique`. A replayed OAuth callback therefore converges on the same row instead of creating a second account.

The failure mode is still wrong. The check and the create are not in a transaction, so two concurrent callbacks both pass the check, the loser hits a P2002, and that error is rethrown rather than resolved to the existing user. `authLimiter` allows 10 attempts per 15 minutes, so this is reachable in practice.

**Proposed fix.** Replace all four sites with a single `prisma.user.upsert` keyed on `id`.

**Decision needed before implementing.** `username` is `@unique` and derived from the email local part or the provider display name, so two different people can collide on username independently of their ids. An upsert on `id` will still throw P2002 on `username` in that case. The collision strategy, whether that is a numeric suffix, a retry loop, or surfacing a username-picker to the user, is a product call.

## P1-5. The generation claim is non-atomic on the path production takes

The one deliberate idempotency mechanism in the codebase has an atomic path and a non-atomic path, and production always takes the non-atomic one.

`claimProcessingRequest` at `processingStatus.server.ts:22` branches on whether the Redis status key already exists. When it does not, the code uses `redis.set` with `nx: true`, which is a correct atomic claim. When it does exist in `"queued"` state, the branch at lines 45 to 71 uses a plain `redis.set` with no `NX`. Because `queueImageGenerationQStash` writes `status: "queued"` before publishing to QStash, the key always exists by the time the webhook fires. Two simultaneous deliveries of the same `requestId` can therefore both read `"queued"` and both claim. The window is narrow, but it is the opposite of what the code comment promises.

Separately, the catch block returns `{ claimed: true }` on any Redis error, commented as a fail-safe. `safeRedisOperation` rethrows failures as `RedisError`, so a Redis outage means every duplicate delivery claims successfully, calls the provider, and spends credits.

**Proposed fix.** Make the queued-state transition atomic, either with a Lua script that checks and sets in one round trip, or with a separate claim key that `SET NX` can own outright.

**Decision needed.** Failing closed on a Redis error is the safe choice for spend, but it means a Redis outage blocks all generation rather than degrading. That is a product tradeoff on availability versus duplicate spend, not a technical one, and it should be decided before the code changes.

## P2. Worth doing, not urgent

**No client-supplied idempotency key on generation submits.** Each submit calls `createId()` fresh at `qstash.server.ts:105`, so a double submit or a browser retry of the POST produces two distinct request ids, two charges, and two generations. The only guards today are the 5-per-minute `generationLimiter` at `rateLimit.server.ts:30` and the disabled submit button at `CreatePageRedesigned.tsx:521`. A key minted once per form instance and deduped server-side would close it. This touches both client and server, so effort is medium.

**Three copies of user-creation logic.** Fixing P1-4 correctly means changing the same logic in `createNewUser.ts`, `auth.server.ts`, and `getLoggedInUserData.ts`. Consolidating to one function has little value on its own and high value bundled with P1-4.

**No regression tests on any of this.** The three cases worth covering are a duplicate Stripe event granting credits exactly once, a concurrent signup resolving to one user without a 500, and a replayed QStash delivery generating exactly once. None of the existing unit tests or the Playwright specs touch these paths.

## What already works

These are worth preserving rather than rebuilding, and they are why the damage is bounded.

The Redis claim in `claimProcessingRequest` does genuinely stop QStash's three retries from regenerating images. The webhook returns 200 with `already_processing` rather than an error, which is the correct response to keep QStash from retrying further. P1-5 narrows a race inside this mechanism; it does not replace it.

Social writes are idempotent for free, because `ImageLike` and `Follow` use composite primary keys. A duplicate like or follow is a constraint violation, not a second row.

The Kafka producer is configured with `idempotent: true` at `kafka.server.ts:71`, so the alternative queue backend is already correct on this dimension if it is ever turned on.

Using the identity provider's id as the `User` primary key is what makes replayed OAuth callbacks converge. P1-4 fixes the error handling around it, but the underlying choice is the right one and should stay.

## Sequencing and open decisions

The three P0 items shipped first, as three independent commits in PR #163; none of them depends on another. The two P1 items need a decision before any code gets written.

Placement by user harm against implementation effort:

| Item | Impact | Effort | Quadrant |
| --- | --- | --- | --- |
| P0-1 Video callback route | Highest | Medium | Ship now |
| P0-2 Stripe dedup | Highest | Low | Ship now |
| P0-3 Worker logging and refunds | High | Low | Ship now |
| P1-4 User upsert | Medium | Low | Ship now |
| P1-5 Claim atomicity | Medium | Medium | Plan in |
| P2-8 Regression tests | Low-medium | High | Defer |
| P2-6 Client idempotency key | Low | High | Defer |
| P2-7 Consolidate user paths | Low | Low | Fill-in |

The three P0 items sit together in the upper band because each one costs a user real money. Two of them are also cheap, which was the argument for doing them immediately rather than scheduling them.

Two decisions are open. First, the username collision strategy for P1-4: an upsert on `id` still throws when two people derive the same username from different emails, and choosing between a numeric suffix, a retry, and a user-facing picker changes the signup flow. Second, whether the generation claim in P1-5 should fail closed: failing closed stops duplicate spend during a Redis outage but blocks all generation for the duration, which is an availability call.

P2 items are listed for completeness. The client idempotency key is the only one that changes user-visible behaviour, and it is worth revisiting after the P0 work lands and the real duplicate rate is visible in the generation log.

## Appendix: Row Level Security was disabled in production (fixed 2026-10-18)

Surfaced by the Supabase advisor while applying the Stripe migration. It is not an idempotency issue, but it was the most severe problem found during this work and it bears directly on the credit system, so it is recorded here.

### What was wrong

Row Level Security was disabled on 46 of the 48 tables in `public`, while the `anon` and `authenticated` roles held `SELECT`, `INSERT`, `UPDATE`, `DELETE` and `TRUNCATE` on all 48. The anon key is shipped to the browser by `createBrowserClient` in `app/hooks/useSupabaseClient.ts:25`.

Anyone who opened devtools on the site could therefore read all 2,252 user records, modify any user's credit balance directly, or truncate tables outright. The duplicate-webhook hardening in P0-2 guards one path into the credit balance; this was an open second path that bypassed Stripe entirely.

### Why enabling RLS was safe

Four checks, each of which would have blocked the change:

1. All 48 public tables are owned by `postgres`, and `postgres` has `rolbypassrls = true`. Prisma connects as that role, so RLS does not apply to application queries. `anon` and `authenticated` both have `rolbypassrls = false`.
2. Every Supabase API call in the codebase is `supabase.auth` — 13 call sites, with zero `.from()`, `.rpc()`, `.storage` or `.channel()`. Nothing reads these tables through PostgREST.
3. Supabase Auth operates on the `auth` schema, which was not touched.
4. `Image` and `Comment` already ran with RLS enabled and policies attached, and Prisma read them normally. That was a working precedent in the same database.

`FORCE ROW LEVEL SECURITY` was deliberately not used. It subjects the table owner to policies and would have broken Prisma immediately.

### What was applied

RLS was enabled on every `public` table lacking it, with no policies attached, which denies `anon` and `authenticated` while leaving Prisma unaffected. Applied through the Supabase SQL editor.

### Verification

| Check | Result |
| --- | --- |
| Tables with RLS on | 48 of 48 |
| Tables with RLS off | 0 |
| Tables with `FORCE` set | 0 (would have broken Prisma) |
| Supabase advisor | `rls_disabled_in_public` CRITICAL cleared; replaced by `rls_enabled_no_policy` at INFO, which is the intended end state |
| Production site | `/health`, `/`, `/users`, `/login` all 200; `/explore` 302 to login as designed; `/users` rendered real profile data with no error text |

### Rollback

`ALTER TABLE public."<name>" DISABLE ROW LEVEL SECURITY;` restores the prior state instantly and losslessly. Exclude `Image` and `Comment`, whose RLS predates this change.

### Still open

The Supabase advisor reports three unrelated WARN-level items that were not addressed: OTP expiry exceeds one hour, leaked-password protection against HaveIBeenPwned is disabled, and the Postgres version (`supabase-postgres-15.1.0.153`) has outstanding security patches.
