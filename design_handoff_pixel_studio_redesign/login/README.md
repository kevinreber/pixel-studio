# Handoff: Pixel Studio — Login / Sign-in Page

## Overview
The authentication entry point for Pixel Studio AI. A single screen that handles **both sign-in and sign-up** through **Google OAuth only** — there is no email/password or magic-link option. First-time Google sign-ins create an account automatically.

The screen has two responsive layouts driven by one shared sign-in card:
- **Desktop (≥ 881px):** Two-column split — a branded art-showcase panel on the left, the sign-in card on the right.
- **Mobile (≤ 880px):** Single centered column — the showcase is hidden and a compact brand mark appears above the card.

## About the Design Files
The files in this bundle are **design references created in HTML/React (Babel-in-browser)** — a prototype showing the intended look and behavior. **They are not production code to ship directly.** The task is to **recreate this design in the target codebase's existing environment** (the real app is Next.js/React per the `/login` route) using its established components, auth library, and styling system. If a pattern already exists in the app (button, input, OAuth handler), prefer it over copying the prototype's inline styles.

All visual values below are given as **exact, final** numbers so the result can be matched precisely.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, radii, shadows, and interaction/loading states. Recreate pixel-perfectly using the codebase's libraries. The only "fake" part is the auth call itself (`fakeAuth` simulates a 2.2s spinner) — wire this to the real Google OAuth flow.

---

## Screens / Views

### 1. Desktop — Split layout (≥ 881px)

**Purpose:** Let a returning or new user authenticate with Google.

**Layout**
- Root: `display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); min-height: 100vh; background: var(--bg)`.
- Left column (`1.05fr`) = brand showcase. Right column (`1fr`) = sign-in card.
- A 1px right border on the left column divides the two: `border-right: 1px solid var(--border)`.

**Left column — Brand showcase** (`position: relative; overflow: hidden`)
- **Ambient background (layer 1):** two radial gradients —
  `radial-gradient(700px 540px at 30% 12%, var(--accent-soft), transparent 62%)`,
  `radial-gradient(620px 520px at 82% 88%, var(--accent-soft-2), transparent 66%)`.
- **Grid overlay (layer 2):** 60×60px line grid at `opacity: 0.45`, faded with
  `mask-image: radial-gradient(120% 110% at 35% 25%, #000 30%, transparent 78%)`.
  Built from `linear-gradient(var(--border) 1px, transparent 1px)` + the 90deg variant, `background-size: 60px 60px`.
- **Glow blob:** 360×360px radial `var(--accent-glow)` centered at `top:34% left:46%`, `filter: blur(38px)`, `opacity: 0.6`.
- **Floating art collage:** four image tiles, each `border-radius: var(--r-lg)` (18px), `box-shadow: var(--shadow-lg)`, `border: 1px solid var(--border-strong)`, `overflow: hidden`, image `object-fit: cover`. Each has an infinite float animation `ps-float <dur>s ease-in-out <delay>s infinite` (translateY 0 → -12px → 0). Positions (absolute, % within the panel):
  | Tile | Image | size (w×h) | top | left | z | delay | dur |
  |---|---|---|---|---|---|---|---|
  | 1 | art-04.jpg | 176×240 | 16% | 20% | 3 | 0.2s | 7.4s |
  | 2 | art-11.jpg | 160×214 | 8%  | 54% | 2 | 1.3s | 8.6s |
  | 3 | art-19.jpg | 168×232 | 44% | 13% | 2 | 0.7s | 7.9s |
  | 4 | art-23.jpg | 182×248 | 40% | 48% | 3 | 1.8s | 9.1s |
- **Bottom scrim (z 3):** full-width, 320px tall, `linear-gradient(to top, var(--bg) 18%, transparent)` — guarantees text legibility over the tiles. `pointer-events: none`.
- **Top brand row (z 4):** padding `34px 40px`, `display:flex; gap:12px; align-items:center` → LogoMark (32px) + wordmark "Pixel Studio" (18px / 700 / letter-spacing -0.02em).
- **Bottom copy block (z 5):** absolutely pinned to bottom, padding `0 48px 44px`:
  - Accent badge "1.9M creations and counting" (sparkles icon, `padding: 5px 12px`, `font-size: 12.5px`, `white-space: nowrap`).
  - Headline `<h2>`: "Where a sentence becomes a **masterpiece.**" — `font-size: clamp(26px, 3vw, 38px)`, weight 800, letter-spacing -0.03em, line-height 1.08, max-width 460px. The word "masterpiece." uses a gradient text fill: `linear-gradient(100deg, var(--accent), #c4a3ff 60%, #ff9ad1)` clipped to text.
  - Social proof row: four overlapping 30px avatars (−10px left margin overlap, `2px solid var(--bg)` ring) + "**12,000+** creators joined this week" (13.5px, muted).
  - All three elements use entrance animation `anim-fade-up` with staggered `animation-delay` 0 / 60ms / 130ms.

**Right column — Sign-in card** (`display: grid; place-items: center; padding: 40px 28px; position: relative`)
- Inner wrapper: `width: 100%; max-width: 392px`, entrance `anim-fade-up`.
- Compact brand mark: hidden on desktop (`display: none`), shown on mobile.
- See **Sign-in card contents** below.
- **Fine print** pinned to bottom of the column (`position: absolute; bottom: 22px`): "By continuing you agree to our **Terms** & **Privacy Policy**." — 12px, color `var(--fg-faint)`; links `var(--fg-subtle)`, no underline.

### 2. Mobile — Single column (≤ 880px)

**Purpose:** Same authentication, optimized for narrow viewports.

**Layout / responsive rules** (CSS `@media (max-width: 880px)`):
- `.login-showcase { display: none }` — left panel removed entirely.
- Root grid becomes single column: `grid-template-columns: 1fr`.
- `.login-compact-brand { display: flex }` — a LogoMark (34px) + "Pixel Studio" (19px/700) row appears **above** the heading, `margin-bottom: 30px`.
- The sign-in card keeps `max-width: 392px` and stays centered with `padding: 40px 28px`, so on a 390px phone it sits with ~28px side gutters. Heading, button, helper text, and footer stack in natural document flow.
- The bottom "Terms & Privacy" fine print remains pinned to the bottom of the viewport.

> Breakpoint: **880px**. At ≥881px show the split; at ≤880px show the stacked layout.

---

## Sign-in card contents (shared by both layouts)

In source order inside the 392px wrapper:

1. **Heading `<h1>`** — "Welcome to Pixel Studio"
   `font-size: 30px; font-weight: 700; letter-spacing: -0.025em; line-height: 1.1; color: var(--fg)`.
2. **Subtitle `<p>`** — "Sign in or create your account with Google to start creating."
   `margin-top: 9px; font-size: 15px; line-height: 1.55; color: var(--fg-muted)`.
3. **Google button** (primary CTA) — `margin-top: 30px`:
   - `width: 100%; height: 50px; display:flex; align-items:center; justify-content:center; gap: 11px`.
   - `background: var(--surface-2); border: 1px solid var(--border-strong); border-radius: var(--r-md)` (13px).
   - Label "Continue with Google" — `font-size: 15px; font-weight: 600; color: var(--fg); white-space: nowrap`.
   - Leading icon: the **official 4-color Google "G"** SVG at 19px (paths included in `screen-login.jsx` — `#EA4335 / #4285F4 / #FBBC05 / #34A853`).
   - **Hover:** `background → var(--surface-hover)`, `border-color → var(--fg-faint)`. Transition `background .16s, border-color .16s, transform .12s`.
   - **Focus:** visible focus ring via `.focusable` → `outline: 2px solid var(--accent); outline-offset: 2px`.
   - **Loading state:** icon swaps for an 18px spinner (`2px` border, `border-top: var(--fg)`, `animation: ps-spin .7s linear infinite`); label becomes "Signing in…"; button `disabled`.
4. **Helper text `<p>`** — "New accounts are created automatically on your first sign-in."
   `margin-top: 16px; font-size: 12.5px; line-height: 1.5; color: var(--fg-subtle); text-align: center`.
5. **Footer trust row** — `margin-top: 30px; padding-top: 22px; border-top: 1px solid var(--border)`; centered flex, `gap: 8px`: shield icon (15px, `var(--fg-subtle)`) + "Secure sign-in, powered by Google" (13px, `var(--fg-muted)`).

There is **no** email field, password field, magic-link, divider, or "create account" link — those were intentionally removed.

---

## Interactions & Behavior

- **Single action:** clicking the Google button triggers OAuth. In the prototype it's `fakeAuth('google')` → sets a `loading` state, shows the spinner for 2200ms, then resets. **Replace with the real Google OAuth redirect/popup.** Keep the button `disabled` and in its spinner/"Signing in…" state while the request is in flight.
- **Account creation:** first-time Google users are provisioned automatically — no separate sign-up screen or flow.
- **Theme toggle:** a fixed button (top-right, `top:22px; right:24px`, 38×38px, `var(--surface-2)` bg, `var(--border-strong)` border) toggles `data-theme` on `<html>` between `dark` (default) and `light`. Icon is `sun` in dark mode, `moon` in light. This is an app-shell concern — wire to the app's existing theme system if one exists; otherwise it can be omitted on the login route.
- **Entrance animations:** card + showcase copy use `anim-fade-up` (transform-only `translateY(13px → 0)` over 0.5s, `cubic-bezier(0.16,1,0.3,1)`). Note these are deliberately **transform-only** (not opacity) so content stays visible if the animation clock is paused. Tiles float infinitely (`ps-float`). All animations collapse to ~0ms under `prefers-reduced-motion: reduce`.
- **Hover:** Google button only (see above). Links have no hover treatment beyond color.
- **Error state:** not designed in the prototype — implement per the app's auth-error conventions (e.g. an inline alert above or below the button using `var(--danger)` / `var(--danger-soft)` tokens).

## State Management
- `loading: 'google' | null` — controls the button's spinner/disabled state. In production this is "OAuth request in flight."
- `theme: 'dark' | 'light'` — app-level; sets `document.documentElement[data-theme]`.
- No form state (no inputs). No data fetching beyond the OAuth call.

## Design Tokens
All tokens live in `redesign/tokens.css` (`:root` + `[data-theme='dark']` + `[data-theme='light']`). Login uses:

**Typography**
- Sans: `'Onest', system-ui, -apple-system, sans-serif` (Google Fonts; weights 300–800 loaded).
- Mono (not used on login but part of system): `'Geist Mono', ui-monospace, monospace`.

**Color (dark theme — the login default)**
| Token | Value | Used for |
|---|---|---|
| `--bg` | `#09090b` | page background |
| `--surface-2` | `#18181d` | Google button bg |
| `--surface-hover` | `#26252f` | Google button hover bg |
| `--border` | `rgba(255,255,255,0.07)` | dividers, grid lines |
| `--border-strong` | `rgba(255,255,255,0.13)` | button border |
| `--fg` | `#fafafa` | headings, button label |
| `--fg-muted` | `#a2a2ad` | subtitle, footer text |
| `--fg-subtle` | `#6e6e79` | helper text, links |
| `--fg-faint` | `#46464f` | fine print |
| `--accent` | `#6d5efc` | brand gradient start, focus ring |
| `--accent-soft` | `rgba(109,94,252,0.16)` | ambient glow, badge bg |
| `--accent-soft-2` | `rgba(109,94,252,0.09)` | ambient glow |
| `--accent-text` | `#b7adff` | badge text |
| `--accent-glow` | `rgba(109,94,252,0.5)` | logo/tile glow |
| `--shadow-lg` | `0 24px 60px -16px rgba(0,0,0,0.72)` | art tiles |

Light-theme equivalents are defined under `[data-theme='light']` — see `tokens.css`. (e.g. `--bg: #f6f6f8`, `--fg: #16161a`.)

**Literal (non-token) colors**
- Google "G": `#EA4335`, `#4285F4`, `#FBBC05`, `#34A853`.
- Brand mark gradient: `linear-gradient(140deg, var(--accent), #b388ff)`.
- Headline gradient word: `linear-gradient(100deg, var(--accent), #c4a3ff 60%, #ff9ad1)`.

**Radius scale:** `--r-xs 6 · --r-sm 9 · --r-md 13 · --r-lg 18 · --r-xl 24` (px).
**Key spacing used:** 8, 9, 11, 12, 16, 22, 28, 30, 40, 44, 48 (px).
**Button height:** 50px. **Card max-width:** 392px. **Breakpoint:** 880px.

**Animations (keyframes in tokens.css)**
- `ps-float`: `translateY(0 → -12px → 0)`.
- `ps-rise` (class `.anim-fade-up`): `translateY(13px → 0)`, 0.5s, `cubic-bezier(0.16,1,0.3,1)`.
- `ps-spin`: `rotate(360deg)`, 0.7s linear infinite.

## Assets
- **Brand mark / Logo:** generated in code (no image) — a gradient rounded tile with a `sparkles` stroke icon. See `LogoMark` in `screen-login.jsx`. Use the app's real logo asset if one exists.
- **Google "G":** inline SVG (in `screen-login.jsx`). Prefer your codebase's existing Google icon if available.
- **Icons:** Lucide-style stroke set defined as `ICON_PATHS` in `primitives.jsx` (login uses `sparkles`, `shield`, `sun`, `moon`). Substitute the app's icon library (e.g. `lucide-react`).
- **Showcase art tiles:** `redesign/img/art-04.jpg`, `art-11.jpg`, `art-19.jpg`, `art-23.jpg` — decorative sample creations. These are placeholders; swap for real curated community artwork (or a CMS-driven set). They are purely decorative (`alt=""`) and only appear on desktop.

## Files
Included in this bundle (under `design_handoff_login/`):
- `Pixel Studio Login.html` — runnable prototype entry (open in a browser to see both layouts; resize below 880px for mobile).
- `redesign/screen-login.jsx` — the login screen component (`LoginScreen`, `LogoMark`, `GoogleG`, `ShowTile`).
- `redesign/primitives.jsx` — shared `Icon`, `Button`, `Badge`, `Avatar` used by the screen.
- `redesign/tokens.css` — the full design-token system (colors, type, radii, shadows, keyframes).
- `redesign/img/*.jpg` — the four decorative showcase images.

To run the prototype: open `Pixel Studio Login.html` directly in a browser (it loads React + Babel from CDN). Drag the window narrower than 880px to preview the mobile layout.
