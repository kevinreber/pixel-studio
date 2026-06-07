# Redesign — Post-Merge Follow-ups

Tracking the work that should happen after PR #150 (`feat: redesign Pixel Studio`) lands on `main`. Pick any item from a later session and check it off.

PR: https://github.com/kevinreber/pixel-studio/pull/150

---

## 1. Same-day after merge

- [ ] **Smoke-test prod after deploy**
  - Landing: anchor scroll for `#lp-models` / `#lp-pricing` lands ~72px below the top bar (no jump to "Made by the community").
  - `/create`: generate an image end-to-end. Validates the layered OpenAI fallback (`dall-e-3` → `dall-e-3` w/o params → `gpt-image-1`) on production keys.
  - Theme toggle: flip light↔dark, reload — preference persists (writes to `User.theme` via `api.preferences.theme`).
  - `/explore`: page renders without spinner stall (validates `defer()` → `await` + `json()` refactor under `v3_singleFetch`).

- [ ] **Verify PostHog autocapture is firing in prod**
  - `app/entry.client.tsx` now defers `initPostHog` past `window.load` to avoid hydration mismatches.
  - Confirm pageviews + autocapture events are landing in PostHog.
  - Watch browser console + Sentry for any `Hydration failed` warnings.

- [x] ~~**Remove `pr-screenshots/` from the repo**~~ — **Reclassified as intentional.** The 32 PNGs (desktop + iPhone 14 Pro Max before/after) are kept as a permanent visual record of the redesign. See `pr-screenshots/README.md`.

## 2. First-week monitoring

- [ ] **Sentry triage** — watch for new error signatures on `/create`, `/create-video`, `/profile/*`, and admin routes. The `defer()` → `json()` switch changed loader return shapes; any client code still expecting a `Promise` will surface here.

- [ ] **Admin staleness check** — all `admin.*` loaders now cache 60s via `getCachedDataWithRevalidate`. If credit edits / user bans aren't visible within ~60s, that's expected. If it actively confuses you, drop TTL to 15s in those loaders.

- [ ] **Credit-refund audit** — `app/services/qstash.server.ts` flipped `refundCredits: false → true`. Query `CreditTransaction` for recent rows of `type=refund` and confirm:
  - Refunds appear when a generation legitimately fails.
  - Refunds do **not** double-fire (one failed job should produce exactly one refund row).

- [ ] **Mobile engagement signal** — pull PostHog session recordings on iPhone/Android viewports for the first week. Validate the new bottom-tab nav + FAB are getting tapped, and check for stuck-viewport edge cases (e.g. the bottom-sheet on `/create`).

## 3. Tech-debt cleanup (next sprint)

- [ ] **Drop the layered `dall-e-3` fallback** in `app/server/createNewDallEImages.ts`
  - Currently: try `dall-e-3` w/ `style`+`quality` → retry w/o those params → fall back to `gpt-image-1` (with `mapSizeToGptImage1()`).
  - Only the last layer is succeeding in prod (OpenAI deprecated all of `response_format`, then `style`/`quality`, then `dall-e-3` itself in sequence).
  - Once metrics confirm 100% of OpenAI traffic hits the `gpt-image-1` branch, delete the first two layers and rename the function.

- [ ] **Audit remaining `defer()` + `<Await>` patterns under `v3_singleFetch`**
  - The flag is enabled in `vite.config.ts`. `ExplorePage` and `UserProfilePage` had Suspense stalls because of it.
  - Run `grep -rn "defer(" app/routes app/pages` and `grep -rn "<Await" app/routes app/pages`. Any composed `Promise.all` inside a `defer()` is a probable stall.

- [x] ~~**Remove `design_handoff_pixel_studio_redesign/` from the working tree**~~ — **Partially closed.** PR #151 curated the bundle: kept `README.md` (design brief), `redesign/tokens.css` (source-of-truth tokens), and `screenshots/{desktop,mobile}/*.png` (intended-state mockups) as a historical record. Removed the standalone HTML previews, prototype JSX shells, and ~30 decorative placeholder JPGs (all process-only scaffolding).

- [ ] **Verify CodeQL `js/xss-through-dom` alert stays dismissed**
  - `app/components/ImagePicker.tsx` validates URLs via `isSafeImageUrl()` before assigning to `<img src>`. Alert was dismissed as a false positive with that justification.
  - On the next weekly CodeQL run, confirm it does not reappear.

- [ ] **Trim `.eslintrc.cjs` ignorePatterns**
  - Currently includes `design_handoff/`, `playwright-report/`, `tmp-screenshots/`.
  - Remove `design_handoff/` and `tmp-screenshots/` once those directories are gone.

## 4. Docs / coordination

- [ ] **Update `CHANGELOG.md`** with:
  - "Full app redesign — tokens, primitives, shell, all core screens."
  - "OpenAI provider switched from `dall-e-3` to `gpt-image-1` (with fallback chain)."
  - "Credit refunds now correctly issued on failed generations."

- [ ] **Tidy `app/.claude/CLAUDE.md`**
  - Note that `dall-e-2` model is removed from `app/config/models.ts`.
  - Note that DALL-E 3 falls back to `gpt-image-1` under the hood.
  - Re-check whether the "Supabase v2 auth migration in progress" line still applies.

- [ ] **Publish a What's New post**
  - The `/whats-new` page (`app/routes/whats-new.tsx`) is the natural place for users to discover:
    - The redesign itself.
    - Theme toggle (light + dark).
    - New mobile bottom-tab nav + FAB.

---

## Notes for future-me

- The dev-server `connection_limit=1` in `DATABASE_URL` causes serial Prisma queries — admin tabs felt slow until we layered Redis caching on top. Don't "fix" the slow admin by removing the cache; the underlying constraint is the local Postgres connection pool.
- The PostHog hydration fix is timing-sensitive — if you ever move PostHog init back to module-top-level, the hydration errors return. Keep the `window.load` + `setTimeout(0)` deferral.
- Anchor links on the landing page need manual `onClick` scrollTo (with 72px offset for the sticky nav). Remix `ScrollRestoration` intercepts plain `<a href="#...">`, which is why pure-anchor links jumped to the wrong section before.
