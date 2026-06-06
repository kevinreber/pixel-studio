# Handoff: Pixel Studio — Web & Mobile Redesign

## Overview
A full visual + UX redesign of **Pixel Studio**, an AI image/video generation platform. The redesign replaces an ad-hoc, multi-accent dark UI with a single coherent design system (one indigo accent, a real elevation ramp, dark + light themes) and rebuilds every core surface: marketing landing, Explore, Create (image + video), Feed, Profile, Liked, What's New, the image-detail modal, an 8-tab Admin dashboard, plus global navigation, notifications, and account/role management.

Two prototypes are included:
- **`Pixel Studio Redesign.html`** — desktop web app (sidebar + top utility bar).
- **`Pixel Studio Mobile.html`** — iOS mobile app (top bar + bottom tab nav + slide-up sheets).

Both run on the **same design system and the same mock-data layer**, so they are intentionally consistent.

---

## About the Design Files
The files in this bundle are **design references created in HTML/React (via in-browser Babel)** — prototypes that demonstrate the intended look, layout, and behavior. **They are not production code to copy directly.**

Your task is to **recreate these designs in the target codebase's environment**. The existing Pixel Studio app is a **Remix + React + TypeScript** project (see the `pixel-studio` repo: `app/routes`, `app/pages`, `app/components`, Tailwind). Implement these designs using that stack and its established patterns — Tailwind classes, existing component primitives, Remix routing/loaders — rather than porting the inline-styled prototype JSX verbatim. The prototype's structure, measurements, and tokens are the source of truth for *appearance and behavior*; the codebase is the source of truth for *how to build it*.

The prototypes use inline styles + CSS custom properties for speed of iteration. In the real app these should map to **Tailwind theme tokens / CSS variables** (the token table below is ready to drop into `tailwind.config.ts` or a global stylesheet).

---

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, elevation, copy, and interactions are all specified. Recreate the UI pixel-faithfully using the codebase's libraries. Exact values are in the **Design Tokens** section and inline below.

---

## Design Tokens

### Typography
- **Sans (UI):** `Onest` (Google Fonts), weights 300–800. Fallback: `system-ui, -apple-system, sans-serif`.
- **Mono (numbers/stats/credits/timestamps):** `Geist Mono`, weights 400–600. Used with `font-feature-settings: 'tnum' 1` (tabular numerals). Fallback: `ui-monospace, 'SF Mono', monospace`.
- Headings use tight tracking: `letter-spacing: -0.02em` to `-0.035em` at large sizes.
- Type sizes (px): page H1 25 / hero clamp(40–66) / section H2 clamp(28–42) / card title 14–17 / body 13.5–16 / labels 11 uppercase (`.u-label`: 11px, letter-spacing 0.08em, uppercase, weight 600, color `--fg-subtle`).

### Color — Accent (identical in both themes)
| Token | Value |
|---|---|
| `--accent` | `#6d5efc` |
| `--accent-hover` | `#8175ff` |
| `--accent-press` | `#5a4cf0` |
| `--accent-fg` | `#ffffff` |

### Color — Dark theme (primary)
| Token | Value | Use |
|---|---|---|
| `--bg` | `#09090b` | app background |
| `--surface-1` | `#111114` | sidebar, cards |
| `--surface-2` | `#18181d` | raised controls |
| `--surface-3` | `#212029` | chips, segmented active |
| `--surface-hover` | `#26252f` | hover |
| `--surface-inset` | `#0c0c0f` | inputs, wells |
| `--border` | `rgba(255,255,255,0.07)` | hairlines |
| `--border-strong` | `rgba(255,255,255,0.13)` | input borders |
| `--border-accent` | `rgba(124,112,255,0.45)` | accent outlines |
| `--fg` | `#fafafa` | primary text |
| `--fg-muted` | `#a2a2ad` | secondary text |
| `--fg-subtle` | `#6e6e79` | tertiary text |
| `--fg-faint` | `#46464f` | disabled / faint |
| `--accent-soft` | `rgba(109,94,252,0.16)` | accent fill |
| `--accent-soft-2` | `rgba(109,94,252,0.09)` | faint accent fill |
| `--accent-text` | `#b7adff` | accent text/icon |
| `--accent-glow` | `rgba(109,94,252,0.5)` | button glow shadow |
| `--success` `#2fcf8e` · `--warning` `#f6b03c` · `--danger` `#f4594a` · `--info` `#56a4ff` | each has a `*-soft` rgba at ~0.14 |

### Color — Light theme
| Token | Value |
|---|---|
| `--bg` | `#f6f6f8` |
| `--surface-1` / `--surface-2` | `#ffffff` |
| `--surface-3` | `#f1f1f4` |
| `--surface-inset` | `#f1f1f4` |
| `--border` | `rgba(9,9,11,0.09)` |
| `--border-strong` | `rgba(9,9,11,0.16)` |
| `--fg` | `#16161a` |
| `--fg-muted` | `#56565f` |
| `--fg-subtle` | `#8a8a94` |
| `--fg-faint` | `#b6b6bd` |
| `--accent-soft` | `rgba(109,94,252,0.10)` |
| `--accent-text` | `#5a4cf0` |
| success `#11a06a` · warning `#cf8a12` · danger `#dd3b2c` · info `#2f7fe0` |

Theme is toggled by setting `data-theme="dark"|"light"` on `<html>` (or a wrapper). All colors are CSS vars that switch on that attribute.

### Radius
`--r-xs 6` · `--r-sm 9` · `--r-md 13` · `--r-lg 18` · `--r-xl 24` · `--r-2xl 30` · `--r-full 999` (px).

### Elevation (shadows) — dark
- `--shadow-sm` `0 1px 2px rgba(0,0,0,.4)`
- `--shadow-md` `0 6px 20px -6px rgba(0,0,0,.55)`
- `--shadow-lg` `0 24px 60px -16px rgba(0,0,0,.72)`
- `--shadow-pop` `0 16px 48px -12px rgba(0,0,0,.7)` (popovers)
- Light theme uses softer equivalents (see `redesign/tokens.css`).

### Motion
- Easing: `--ease cubic-bezier(0.22,0.61,0.36,1)`, `--ease-out cubic-bezier(0.16,1,0.3,1)`.
- Standard transitions ~140–220ms.
- **Important implementation note:** entrance animations must animate **transform only**, never opacity-from-0, OR they must respect `prefers-reduced-motion`. The prototype runs in environments where a reduced-motion override froze opacity-keyframes at 0 and hid content. Keep the visible end-state as the base style. Images render at full opacity with no JS load-gating (a CSS gradient placeholder sits behind each image as the loading state).

### Spacing
Page gutters 40px (desktop) / 16–22px (mobile). Card padding 11–26px. Grid/flex gaps 8–24px. Section vertical rhythm 40–100px on the landing.

---

## Shared Components (build these as reusable primitives)
All live in `redesign/primitives.jsx` in the prototype.

- **Icon** — Lucide-style 24×24 stroke icons (stroke 1.8–2.4). In the real app use `lucide-react` (already a dependency). Icon names referenced: search, explore, users, feed, wand, video, sets/layers, heart, user, sparkles, shield, bell, image, plus, arrowRight, x, check, chevron(Down/Right/Left), sliders, copy, comment, shuffle, download, share, more, star, trending, sun, moon, coins, zap, activity, grid, clock, eye, play, compare, trash, cpu, palette, ratio, settings, logout, follow/following, send, bookmark, alert, wallet, external.
- **Button** — variants: `primary` (accent fill + glow), `secondary`, `ghost`, `soft` (accent-soft), `danger`, `outline`. Sizes: sm (h32), md (h38), lg (h46), icon (38²), iconSm (32²). Radius `--r-sm`, weight 600, 8px gap, hover lifts `translateY(-1px)` on primary.
- **Badge** — pill, tones: neutral/accent/success/warning/danger/info. 11.5px, weight 600, optional leading icon.
- **PageHeader** — accent icon tile (42², `--r-md`, accent-soft) + H1 (25px) + subtitle + right-aligned actions slot. Used on every app screen.
- **Segmented** — inset track (`--surface-inset`), active pill raised to `--surface-3` with `--shadow-sm`.
- **Select** — custom dropdown (button + absolute popover, `--shadow-pop`), check-marks selected row.
- **Avatar** — circular; gradient fallback derived from name hash when no image; optional accent ring.
- **EmptyState** — centered: 60² accent icon tile, 18px title, muted subtitle (max 360px), optional CTA button.
- **ArtTile** — the artwork renderer: a container with a mesh-gradient fallback background + `<img object-fit:cover>` on top + optional video play badge. Drop-in for any generated image.

---

## Screens / Views

> Layout shorthand: **Desktop** = 252px fixed left sidebar + flexible main (max-width 1400, 40px gutters) with a 58px sticky top utility bar. **Mobile** = 56px top bar + scroll body + bottom tab nav; modals are slide-up sheets.

### 1. Landing (marketing)
- **Purpose:** convert visitors; boots here by default (logged-out).
- **Desktop layout:** sticky top nav (logo left; Explore/Models/Pricing links + theme toggle + Sign in + Start creating right). Hero is a 2-col grid: left = eyebrow badge ("1.9M creations and counting"), H1 "Create stunning **art & video** from a sentence." (gradient on "art & video": `linear-gradient(100deg,var(--accent),#c4a3ff 60%,#ff9ad1)` with text-clip), subhead, an **auto-typing prompt bar** (typewriter cycling example prompts), example chips, social-proof avatars. Right = **floating gallery** of 5 portrait cards gently animating (`ps-float`, 7–9s).
- **Below the fold:** stats strip (1.9M / 12,000+ / 12 / 4.9★) → features grid (6 cards, colored icon tiles) → provider chips ("Powered by the world's best models") → community masonry gallery → **Pricing** (3 tiers, Pro featured) → gradient final CTA → footer.
- **Nav behavior:** Explore/Sign in/Start creating → enter app. **Models** → smooth-scroll to providers section (`#lp-models`). **Pricing** → smooth-scroll to pricing (`#lp-pricing`). Smooth scroll is a manual rAF animation (native `scroll-behavior:smooth` was unreliable in-prototype; in a real browser either is fine).
- **Mobile:** single scroll column — sticky bar (logo + theme + Sign in), hero with a 3-column **vertical marquee** of artwork behind the headline (masked top/bottom), auto-typing prompt, stacked CTAs, stats, features (stacked), providers, horizontal community gallery, Pricing (stacked), final CTA.
- **Pricing tiers:** Free $0 (50 cr/mo, standard models, public gallery, community support) · **Pro $18/mo — "Popular"** (2,500 cr/mo, all 12 models + video, private creations & sets, priority generation, commercial license) · Studio $49/mo (8,000 cr/mo, everything in Pro, API access, team workspaces, dedicated support).

### 2. Global Navigation
- **Desktop sidebar (252px):** logo; primary "New creation" button; grouped nav with `.u-label` group headers — **Discover** (Explore, Feed, Users) · **Create** (Image, Video, Sets) · **Library** (Liked, Profile) · **Manage** (What's New [badge "3"], Admin). Active item: accent-soft bg, accent text, 3px accent rail on the left. Footer: credits card (gradient accent-soft, mono balance, "Buy"), then account row (avatar + name + "@handle"; admin badge when admin).
- **Desktop top utility bar (58px sticky, blurred):** right-aligned **notification bell** (unread dot → opens notifications popover) + **account chip** (avatar + chevron → account menu: View profile, appearance toggle, **Admin access** toggle, Sign out).
- **Mobile:** top bar (left grid/menu button → slide-up menu sheet; center title; right notification bell). Bottom tab nav: Explore · Feed · center **＋ FAB** (Create) · Liked · Profile. The menu sheet holds secondary destinations (Users, Create Video, Sets, What's New, Admin — gated) + theme + an admin "preview as standard user" toggle.

### 3. Explore
- Page header (search field in actions, desktop). Filter toolbar: **Segmented** All/Images/Videos · **Select** model · **Select** sort (Trending/Most liked/Newest) · result count. Below: a single horizontally-scrollable **tag row** (All + 9 tags) — note: model and tag are deliberately separated controls, not one wall of pills.
- **Grid:** CSS columns masonry (`columns: 4 240px; gap 16` desktop / 2-col mobile). Cards: rounded, 1px border, hover lifts `translateY(-3px)` + `--shadow-lg` + accent outline. Hover overlay: gradient scrim, prompt (2-line clamp), author avatar+name, like count; quick-action buttons (heart, bookmark) top-right; "Video" badge top-left for video items.
- **Empty state** when filters match nothing (EmptyState + "Clear filters").

### 4. Create (image + video)
- **Two-column (388px composer + flexible model gallery).** This screen previously had a *duplicate* model selector (dropdown **and** card grid) — the redesign resolves it: the **right gallery is the single selection surface**; the left panel only **summarizes** the chosen model.
- **Left composer (sticky card):** prompt textarea first (with Enhance / Surprise me), selected-model summary row, aspect-ratio picker (4 visual options with px readout), image count stepper + style select, collapsible Advanced (negative prompt, seed), sticky footer = total cost (mono, `credits × count`) + **Generate**.
- **Right gallery:** provider filter chips + model cards (thumbnail, name, provider, one differentiated tag — Flagship/Pro/Fast/Value, NOT "Recommended" on everything — credit cost badge, description, selected check). "Compare models" mode in the header toggles multi-select checkboxes.
- **Generating flow (state machine `idle → generating → done`):** Generate replaces the right gallery with a results panel — header (spinner "Generating…" → green check "Generation complete"), prompt + model recap, a **progress bar**, and **N shimmer skeleton tiles** that resolve to the generated images (each with hover download/like/remix). "New generation" resets to idle.
- **Out-of-credits guard:** when `cost > balance`, an inline "Not enough credits — needs X, you have Y" banner appears, total cost turns red, and Generate disables ("Insufficient credits"). (Prototype has a dashed "Preview low balance" review toggle that forces balance to 6 — remove in production; gate on the real balance.)
- **Mobile Create:** same logic, single column, sticky Generate bar, model picker is a bottom sheet, results are a full-screen state.

### 5. Feed
- Page header + Following/For-you segmented. Masonry of post cards: header (avatar, author, time · model, ⋯), full-width image, action row (like with count, comment, remix, save), 2-line caption. Ends with a **"You're all caught up"** footer (success check + discover CTA).

### 6. Image Detail Modal
- Centered modal (max 1180px), blurred backdrop, Esc/click-out to close. **Left:** image on inset well. **Right panel (408px):** header (avatar, author, Follow button, ⋯ menu, close) — the ⋯ menu holds Open original / Copy link / Report / **Admin delete** (so admin actions don't crowd the main bar). Tabs **Info | Comments**. Info: prompt (+ Copy prompt) and a 2-col metadata grid (Model, Style, Size, Set, Created, Cost) — note the date no longer collides with action buttons. Bottom **action bar**: Like (count) / Remix / Download / Save / Share. Comments tab swaps in an input.
- **Mobile:** full-screen slide-up sheet version with the same content.

### 7. Profile
- Gradient banner; avatar (112² desktop / 84² mobile) overlapping it (give the header its own stacking context so it sits above the banner). Name + "Top Creator" badge, @handle, bio, meta row (location · link · streak), stats (posts/followers/following). Centered All/Images/Videos tabs over a uniform square gallery grid (hover shows like/comment counts). Actions: Edit profile / View sets (own profile) — swap for a Follow button on others' profiles.

### 8. Liked
- Page header + All/Images/Videos segmented + sort select. Same gallery grid. **Empty state**: "No liked creations yet" + "Browse Explore". (Prototype "Preview empty" toggle is a review aid — remove in production.)

### 9. What's New (changelog)
- Vertical timeline; each entry: colored type badge (Feature/Improvement/Fix), date, mono version tag, title, description, checklist of bullets. Newest entry highlighted with accent border.

### 10. Admin Dashboard (8 tabs)
- Page header (Live badge) + horizontally-scrollable tab strip: **Overview, Users, Credits, Tokens, Models, Engagement, External Services, Deletion Logs**.
- **Overview:** 6 stat cards (mono values, trend deltas) + 4 "today" tiles with sparklines + Quick Actions cards + a Model Usage bar list.
- **Users:** activity metric cards, a Signup Trends bar chart, Credit Distribution bars.
- **Credits:** time-range toggle, 8 metric cards, two grouped bar charts (Credit Flow, Generation Volume) with legends.
- **Tokens:** user search + Recent Admin Adjustments table (signed amounts, admin, reason).
- **Models:** metrics + a Model Rankings leaderboard (rank medals, deltas, success-rate pills) + usage bar chart.
- **Engagement:** social metrics + "Most Followed" highlight + follow-activity chart + Top-by-Followers / Top-by-Engagement lists.
- **External Services:** provider health grid (status dot, latency, uptime).
- **Deletion Logs:** moderation rows (prompt, model badge, deleted-by, reason, details).
- Charts are lightweight inline SVG/divs in the prototype — in production use the codebase's charting lib (or Recharts). Data shapes are visible in `redesign/screens-admin*.jsx`.

---

## Interactions & Behavior
- **Routing:** client-side screen switch in the prototype; in Remix use real routes. Landing is the logged-out entry; CTAs/Sign-in enter the app at Explore; account-menu Sign out / sidebar logo return to landing.
- **Theme:** persisted toggle; sets `data-theme` on the root; every color follows.
- **Notifications:** bell → popover (desktop) / sheet (mobile) listing likes, follows, comments, and system ("generation finished") with unread highlights + dots.
- **Admin role-gating:** an `isAdmin` flag controls (a) visibility of the Admin nav item, (b) an "Admin" badge by the user's name, (c) a route guard that bounces non-admins off the admin screen. The prototype's admin/standard toggles are **review aids** — in production derive `isAdmin` from the authenticated user's role.
- **Generation:** `idle → generating (progress + skeletons) → done (images)`; ~2.2s simulated in the prototype — wire to the real generation job/polling. Disable Generate while in flight and when under-credited.
- **Hover/active/focus:** cards lift + shadow on hover; focus-visible shows a 2px accent outline (offset 2px). Respect `prefers-reduced-motion`.
- **Responsive:** desktop and mobile are separate compositions here; in production, build responsively or per-platform per your stack.

---

## State Management
- `route` (current screen) · `theme` ('dark'|'light') · `isAdmin` (from auth) · `loggedIn` (derived) · `modalArt` (open image or null) · notifications open/unread.
- **Create:** `mode` (Image|Video), `model`, `aspect`, `count`/`duration`, `prompt`, `style`, `compare`, `provider` filter, `status` (idle|generating|done), `results[]`, `progress`, plus real `balance` for the credit guard.
- **Explore/Liked/Profile:** filter (type), tag, model, sort, search query.
- **Data fetching (real app):** Explore/Feed/Profile/Liked feeds, model catalog, user/credit balance, admin analytics, notifications — all currently mocked in `redesign/data.jsx`; replace with Remix loaders / API calls.

---

## Assets
- **Generated artwork (in-app grids, model cards, mobile landing marquee):** 30 real sample images live in `redesign/img/art-01…30.jpg`, sourced from the repo's `public/assets/model-thumbs` and `public/assets/preset-text-styles`. Mapped to prompts/tags in `redesign/data.jsx` (`ART_META`). In production these are user-generated images from your storage/CDN.
- **Desktop landing hero (5 images):** referenced by **public S3 URL** (the same assets the live landing uses), defined in `redesign/screens-landing.jsx` (`HERO`) and `redesign/mobile-screens.jsx` (`M_HERO`). ⚠️ These load via `<img>` but the bucket sends **no CORS headers**, so they will **not** bundle into an offline/standalone export and can't be canvas-captured. For a self-contained build, copy those 5 files into the repo (e.g. `public/assets/hero/`) and reference locally. The S3 keys are in those files.
- **Icons:** Lucide (`lucide-react`).
- **Fonts:** Onest + Geist Mono (Google Fonts) — self-host in production.

---

## Files (in this bundle)
Prototype entry points:
- `Pixel Studio Redesign.html` — desktop app shell (loads the `redesign/*.jsx` modules).
- `Pixel Studio Mobile.html` — mobile app shell.

Design system + modules (`redesign/`):
- `tokens.css` — **all design tokens** (colors, type, radius, shadow, keyframes). Start here.
- `primitives.jsx` — Icon set, Button, Badge, PageHeader, Segmented, Select, Avatar, EmptyState.
- `data.jsx` — mock data + `ArtTile` + `ART_META` (image↔prompt mapping) + credits constant.
- `sidebar.jsx` — desktop sidebar (nav groups, credits, account, admin gating).
- `desktop-shell.jsx` — desktop top bar, notifications popover, account menu.
- `screens-explore.jsx` · `screens-create.jsx` · `screens-feed.jsx` · `screens-profile.jsx` (Profile + Liked) · `screens-whatsnew.jsx` · `screens-landing.jsx`.
- `screens-admin.jsx` + `screens-admin-tabs.jsx` — admin dashboard + the 8 tabs.
- `modal-image.jsx` — image detail modal.
- `app.jsx` — desktop routing/state.
- `mobile-shell.jsx` · `mobile-screens.jsx` · `mobile-admin.jsx` · `mobile-app.jsx` — mobile composition.
- `ios-frame.jsx` — device bezel used only to present the mobile prototype (not part of the product).

**Recommended reading order:** `tokens.css` → `primitives.jsx` → `data.jsx` → `app.jsx`/`sidebar.jsx`/`desktop-shell.jsx` → individual `screens-*.jsx`.

---

## Screenshots
Reference renders are in `screenshots/desktop/` and `screenshots/mobile/`. They show the **app screens** (which use local sample images and render faithfully).

`screenshots/desktop/`: 01-explore · 02-create · 03-create-generating · 04-create-done · 05-feed · 06-profile · 07-admin (Overview) · 08-admin-credits · 09-liked-empty · 10-create-no-credits.

`screenshots/mobile/`: 01-explore · 02-feed · 03-create · 04-create-generating · 05-create-done · 06-profile · 07-liked-empty · 08-menu (slide-up nav) · 09-admin.

**Not screenshotted (capture tooling can't render them, but they work live — open the HTML files to see):**
- **Landing pages** — the 5 hero images are cross-origin S3 (canvas-tainted, so screenshots show gradient fallbacks). Open `Pixel Studio Redesign.html` / `Pixel Studio Mobile.html` in a browser to see the real hero, plus the pricing section and final CTA.
- **Image detail modal** and **notification/account popovers** — backdrop-filter/overlay layers don't capture; documented in full above. Click any Explore tile (modal) or the top-bar bell/avatar (popovers) in the live files.

