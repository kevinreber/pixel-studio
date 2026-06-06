# PR Screenshots — Historical Record

This directory holds before/after screenshot sets captured during major UI changes. They're kept in the repo as a permanent visual record of how the app evolved.

## Current contents

| Set | Source | Viewport | Description |
|---|---|---|---|
| `before/` | `main` before PR #150 | 1440×900 (desktop) | Pre-redesign desktop screens (consumer + admin) |
| `after/` | `feat/pixel-studio-redesign` | 1440×900 (desktop) | Post-redesign desktop screens (same routes, same authed account) |
| `mobile-before/` | `main` before PR #150 | iPhone 14 Pro Max (430×932, DPR 3, webkit) | Pre-redesign mobile screens |
| `mobile-after/` | `feat/pixel-studio-redesign` | iPhone 14 Pro Max (430×932, DPR 3, webkit) | Post-redesign mobile screens |

Original PR: [#150 — feat: redesign Pixel Studio](https://github.com/kevinreber/pixel-studio/pull/150)

## Conventions

- Naming: `NN-screen-name.png` (`01-landing`, `02-explore`, …) so they sort naturally
- Each new historical snapshot belongs in a clearly-dated subdirectory (e.g. `2026-06-redesign/`) so future archaeology stays legible. The current flat structure is grandfathered in from PR #150 and can be re-organized later if more snapshots accumulate
- Captures are produced via Playwright specs in `tests/capture-pr-*.spec.ts` — these specs live only for the duration of the PR and are deleted after the screenshots are committed

## Not for runtime

These files are not served, not imported, and not part of the build. They exist purely as documentation.
