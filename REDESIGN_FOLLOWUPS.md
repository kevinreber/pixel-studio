# Redesign — Post-Merge Follow-ups

Tracking the work that should happen after PR #150 (`feat: redesign Pixel Studio`) lands on `main`. Pick any item from a later session and check it off.

PR: https://github.com/kevinreber/pixel-studio/pull/150

## Status

| PR | Title | Status |
|---|---|---|
| [#150](https://github.com/kevinreber/pixel-studio/pull/150) | feat: redesign Pixel Studio | ✅ merged |
| [#151](https://github.com/kevinreber/pixel-studio/pull/151) | chore: post-redesign cleanup (curated) | ✅ merged |
| [#152](https://github.com/kevinreber/pixel-studio/pull/152) | docs: redesign aftermath | ✅ merged |
| [#153](https://github.com/kevinreber/pixel-studio/pull/153) | refactor: drop defer() + Suspense | ✅ merged |

Everything that could be done from local code is now landed. Remaining items all need prod / external access.

---

## 1. Prod smoke + verification (needs deploy access)

- [ ] **Smoke-test prod after deploy**
  - Landing: anchor scroll for `#lp-models` / `#lp-pricing` lands ~72px below the top bar (no jump to "Made by the community").
  - `/create`: generate an image end-to-end. Validates the layered OpenAI fallback (`dall-e-3` → `dall-e-3` w/o params → `gpt-image-1`) on production keys.
  - Theme toggle: flip light↔dark, reload — preference persists (writes to `User.theme` via `api.preferences.theme`).
  - `/explore`, `/feed`, `/collections`, `/collections/$collectionId`, `/explore/$imageId` modal: render without spinner stall (validates the `defer()` → `await` + `json()` refactor under `v3_singleFetch` — PR #153).

- [ ] **Verify PostHog autocapture is firing in prod**
  - `app/entry.client.tsx` defers `initPostHog` past `window.load` to avoid hydration mismatches.
  - Confirm pageviews + autocapture events are landing in PostHog.
  - Watch browser console + Sentry for any `Hydration failed` warnings.

## 2. First-week monitoring (needs Sentry / PostHog / DB access)

- [ ] **Sentry triage** — watch for new error signatures on `/create`, `/create-video`, `/profile/*`, `/feed`, `/collections`, and admin routes. The `defer()` → `json()` switches in PRs #150 and #153 changed loader return shapes; any client code still expecting a `Promise` will surface here.

- [ ] **Admin staleness check** — all `admin.*` loaders now cache 60s via `getCachedDataWithRevalidate`. If credit edits / user bans aren't visible within ~60s, that's expected. If it actively confuses you, drop TTL to 15s in those loaders.

- [ ] **Credit-refund audit** — `app/services/qstash.server.ts` flipped `refundCredits: false → true`. **Pre-written script:** `scripts/auditCreditRefunds.ts`. Run with `npx tsx scripts/auditCreditRefunds.ts` against prod `DATABASE_URL`. Confirms:
  - Refunds appear when generations legitimately fail
  - Refunds do **not** double-fire (one failed job → exactly one refund row)
  - No orphan refunds (refunds without matching `spend` rows)

- [ ] **Mobile engagement signal** — pull PostHog session recordings on iPhone/Android viewports. Validate the bottom-tab nav + FAB are getting tapped, and watch for stuck-viewport edge cases (e.g. the bottom-sheet on `/create`).

## 3. Tech-debt cleanup (waiting on metrics / external scans)

- [ ] **Drop the layered `dall-e-3` fallback** in `app/server/createNewDallEImages.ts`
  - Currently: try `dall-e-3` w/ `style`+`quality` → retry w/o those params → fall back to `gpt-image-1` (with `mapSizeToGptImage1()`).
  - Only the last layer is succeeding in prod (OpenAI deprecated all of `response_format`, then `style`/`quality`, then `dall-e-3` itself in sequence).
  - Once metrics confirm 100% of OpenAI traffic hits the `gpt-image-1` branch, delete the first two layers and rename the function.

- [ ] **Verify CodeQL `js/xss-through-dom` alert stays dismissed**
  - `app/components/ImagePicker.tsx` validates URLs via `isSafeImageUrl()` before assigning to `<img src>`. Alert was dismissed as a false positive with that justification.
  - On the next weekly CodeQL run, confirm it does not reappear.

## Closed (no further action)

- [x] ~~**Remove `pr-screenshots/` from the repo**~~ — PR #151. **Reclassified as intentional historical record.** Kept the 32 PNGs (desktop + iPhone 14 Pro Max before/after) with `pr-screenshots/README.md` documenting them.
- [x] ~~**Audit remaining `defer()` + `<Await>` patterns under `v3_singleFetch`**~~ — PR #153. Converted feed, collections list, collection detail, and explore image-detail page. Net −140 lines.
- [x] ~~**Remove `design_handoff_pixel_studio_redesign/` from the working tree**~~ — PR #151. **Curated:** kept the README brief, `tokens.css`, `screenshots/{desktop,mobile}/`, and the prototype's art tiles. Removed the standalone HTML previews and prototype JSX shells.
- [x] ~~**Trim `.eslintrc.cjs` ignorePatterns**~~ — PR #151. Dropped `design_handoff/` and `tmp-screenshots/` entries; kept `playwright-report/`.
- [x] ~~**Update `CHANGELOG.md`**~~ — PR #152. Added entries for the redesign system, OpenAI provider switch, credit refund fix, PostHog hydration fix, and defer()→json() Suspense-stall fix.
- [x] ~~**Tidy `.claude/CLAUDE.md`**~~ — PR #152. Updated Tech Stack + Image Providers rows to reflect `gpt-image-1`; added redesign + provider-switch entries to Recent Features.
- [x] ~~**Publish a What's New post**~~ — PR #152. New entry at top of `app/config/buildLogs.ts` ("Fresh look — full app redesign", 2026-06-06, `category=announcement`).

---

## Notes for future-me

- The dev-server `connection_limit=1` in `DATABASE_URL` causes serial Prisma queries — admin tabs felt slow until we layered Redis caching on top. Don't "fix" the slow admin by removing the cache; the underlying constraint is the local Postgres connection pool.
- The PostHog hydration fix is timing-sensitive — if you ever move PostHog init back to module-top-level, the hydration errors return. Keep the `window.load` + `setTimeout(0)` deferral.
- Anchor links on the landing page need manual `onClick` scrollTo (with 72px offset for the sticky nav). Remix `ScrollRestoration` intercepts plain `<a href="#...">`, which is why pure-anchor links jumped to the wrong section before.
- The `dall-e-3` layered fallback only the last layer succeeds in prod. Don't waste time debugging the first two — they're there as defensive history. Just count gpt-image-1 hits and remove the dead branches when confident.
