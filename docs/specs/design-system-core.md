# Feature: Design System Core

**Status:** ✅ COMPLETED (2024)  
**Current Version:** 0.0.4

## Blueprint

### Context

This specification defines the "Experience Model" for Void Drift. It establishes the core visual axioms—Logo, Typography, and Color—that drive the application's "Vibe" (Newtonian Chaos / Utilitarian Sci-Fi). These rules ensure consistency across the game HUD, menus, and marketing pages.

**Achievement:** Full design token system operational with CSS variables defining all colors, spacing, and typography.

### Architecture

- **Tech Stack:** Vanilla CSS Variables (Tokens).
- **Location:** `apps/web/src/styles.css` (Single Source of Truth).
- **Font:** [DEPRECATED 2026-11-01] ~~Noto Sans Math (Google Fonts, loaded via CDN).~~ See [Typography](#typography); fonts are self-hosted.
- **Logo Symbolism:** ∅·Δ (Void × Drift). See [Identity](#identity).
- **Implementation:** Zero hardcoded colors in components; all use `var(--token-name)`.

### Anti-Patterns

- **Do NOT** use hardcoded hex values in components (e.g., `#00f0ff`); always use `var(--color-neon-blue)`.
- **Do NOT** use Tailwind or other utility classes; use semantic CSS.
- [DEPRECATED 2026-11-01] ~~**Do NOT** use image assets for the logo; use HTML entities for sharp scaling.~~ The logomark is inline SVG outlines; see [Identity](#identity).
- **Do NOT** use `var(--color-primary)` - this token does not exist. Use `var(--color-neon-blue)` for primary accent color.

## Contract

### Definition of Done

- [x] Global CSS file exists at `apps/web/src/styles.css`.
- [x] CSS Variables for all defined colors are present in `:root`.
- [ ] [DEPRECATED 2026-11-01] ~~Font "Noto Sans Math" loads correctly via Google Fonts.~~ The CDN link was removed on 2026-10-28 (`3041a80`); nothing has loaded it since.
- [ ] [DEPRECATED 2026-11-01] ~~Logo component renders ∅·Δ glyphs correctly using Noto Sans Math.~~ Replaced by SVG outlines in opening-screen S2.
- [x] `Logo.svelte` draws ∅·Δ from committed SVG outlines and appears in every shared header, the Lab rail and the favicon.
- [x] All UI components use design tokens (no hardcoded hex values).

### Regression Guardrails

- **Performance:** No Layout Thrashing from heavy CSS effects.
- **Accessibility:** Text colors must meet AA contrast ratio against `--color-void`.
- **Consistency:** All new UI components must use the defined design tokens.

### Scenarios

**Scenario: Logo Rendering** [DEPRECATED 2026-11-01]
~~Displays ∅·Δ in Noto Sans Math, neon blue with a text-shadow glow; "VERIFIED - Logo visible in
game HUD".~~ The audit found it only in the Lab, drawn by fallback fonts. Replaced by:

**Scenario: Logomark in headers**
- Given the game, builder, scores or settings page
- When it renders
- Then its header links home with an image named "Void Drift" drawn from SVG paths
- And the mark uses the brand colour and no font is requested for it

**Scenario: Dark Mode Default** ✅
- Given a blank page in the application
- When loaded
- Then the background color is exactly `var(--color-void)` (#050510)
- And the text color is `var(--color-text)` (#e0e0e0)
- **Status:** VERIFIED - All pages use dark theme by default

**Scenario: Token Enforcement** ✅
- Given a new UI component is created
- When it needs a color value
- Then it MUST use `var(--color-*)` tokens
- And NOT use hardcoded hex values like `#00f0ff`
- **Status:** ENFORCED - Biome linting checks for hardcoded colors

## Typography

**Status:** Implemented 2026-11-01 (opening-screen S1, decision D2 as amended).
**Source of truth:** `packages/core/src/lib/styles/{fonts,tokens,typography}.css` and
`packages/core/src/lib/ui/typography.ts`. **Lab:** `/lab/typography`.

### Typefaces

| Role      | Face                                | Used for                                                                                          | Shipped as                                         |
| --------- | ----------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `ui`      | B612 Mono 400/700, roman and italic | All game and interface text: HUD, menus, builder, settings, leaderboard, Lab shell, canvas labels | Self-hosted woff2 (latin)                          |
| `prose`   | Noto Sans, variable 100–900         | Studies, help and docs                                                                            | Self-hosted woff2 (latin subset: English, Finnish) |
| `display` | Noto Sans at weight 800             | Headlines                                                                                         | Same file as `prose`                               |
| Logotype  | Noto Sans Math                      | ∅·Δ only; see [Identity](#identity)                                                               | SVG outlines; the font is never served             |

"Monospace" in this project means B612 Mono. Fonts live in
`packages/core/src/lib/styles/fonts/` with their SIL OFL 1.1 licences; there is no CDN and no npm
font package. Each family falls back to the OS face (`ui-monospace`, `system-ui`) while loading
(`font-display: swap`) or for characters outside the subset.

### Tokens

| Group        | Tokens                                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Families     | `--font-family-ui`, `--font-family-prose`, `--font-family-display`                                                                           |
| Weights      | `--font-weight-regular` 400, `--font-weight-medium` 500, `--font-weight-bold` 700, `--font-weight-display` 800                               |
| Sizes        | `--font-size-caption` 0.75rem, `-label` 0.875rem, `-body` 0.95rem, `-lead` 1.2rem, `-heading` 1.5rem, `-display` clamp(1.75rem, 4vw, 3.5rem) |
| Line heights | `--line-height-display` 1.05, `-heading` 1.1, `-ui` 1.5, `-prose` 1.65                                                                       |
| Tracking     | `--tracking-eyebrow` 0.16em, `-display` 0.03em (`-wordmark` removed with the text wordmark, 2026-11-01)                                      |
| Measure      | `--measure-prose` 70ch                                                                                                                       |

B612 Mono has no 500 or 800; `--font-weight-medium` resolves to 400 in the ui role. Use 400 or 700
there. Deprecated aliases remain until their last consumer migrates: `--font-flight` → ui,
`--font-display` → display, `--font-small` → caption, `--font-body` → body, `--font-large` → heading,
`--font-title` → display size. Preserved studies keep using these aliases.

### Rules

- Page roots set the role: game pages (`body`, `.flight-page`) and the Lab shell use `ui`;
  `StudyLayout` puts `.prose` on its `main`.
- `.prose` is global: family, line height, measure on section paragraphs, heading rhythm and link
  colour. Its descendant rules have zero specificity, so local component styles win.
- Components name role tokens. Literal families are not allowed in shared CSS, layouts or canvas.
- Canvas uses `canvasFont(size, weight)` from `@void-drift/core`, which mirrors `--font-family-ui`
  (`pnpm check:contracts` keeps them equal). One-shot canvas drawings redraw after `loadCanvasFonts()`.
- Preserved study components keep their local values.

## Identity

**Status:** Implemented 2026-11-01 (opening-screen S2, decision D1).
**Source of truth:** `apps/web/src/components/Logo.svelte`, `apps/web/src/components/logomark.ts`
and the `--logomark-height-*` tokens. **Lab:** `/lab/logomark`.

### Logomark

- The mark is ∅·Δ: U+2205 empty set, U+22C5 dot operator, U+0394 Greek capital delta (void · drift).
  It is the only brand mark. There is no text wordmark; "Void Drift" is the accessible name and the
  page-title text.
- The glyphs come from Noto Sans Math 3.000 (SIL OFL 1.1), converted once by
  `scripts/convert-logomark.py` into `logomark.ts` (paths cropped to the ink box, 180 font units
  between advance boxes). `logomark-OFL.txt` sits beside it. The font is never committed or served;
  the script's docstring says how to download it and rerun the conversion, which also regenerates
  the favicon. Do not edit the paths by hand.
- `Logo.svelte` renders inline SVG with `role="img"` and `aria-label` (default "Void Drift"). It
  fills with `currentColor`; the operator is at 70% opacity. Props: `size` (`sm` | `md` | `lg`) and
  `label`.

### Sizes

| Token                  | Height | Used for                                                    |
| ---------------------- | ------ | ----------------------------------------------------------- |
| `--logomark-height-sm` | 1rem   | Page headers (game, builder, scores, settings, study shell) |
| `--logomark-height-md` | 1.5rem | Lab nav rail                                                |
| `--logomark-height-lg` | 3rem   | Title cards (reserved for opening-screen S12)               |

Width follows the 2.62:1 aspect ratio.

### Placement and colour

- The mark is lime (`--color-acid-lime`, the brand colour under D6). On a lime surface it is
  `--color-void`. Consumers set the colour; shared headers use `.brand` in `flight.css`.
- Every shared page header links home with the mark: `FlightDeck`, `ShipBuilder`, `Leaderboard` and
  `Settings`. The Lab rail links it to `/lab` with the name "Void Drift Lab". `StudyLayout` shows it
  in the nav beside "/ RESEARCH". Preserved study pages keep their local values.
- `public/favicon.svg` is the mark in lime on `--color-void` with a rounded square. Every layout
  (`Layout`, `LabLayout`, `StudyLayout`) links it.
- Page titles read "{Page} | Void Drift" (Lab: "{Page} | Void Drift Lab"); the game is "Void Drift".

## Current Implementation

### Design Tokens (`apps/web/src/styles.css`)

#### Color Palette

```css
:root {
	--color-void: #050510; /* Deep space background */
	--color-neon-blue: #00f0ff; /* Primary accent (cyan) */
	--color-neon-pink: #ff00ff; /* Secondary accent (magenta) */
	--color-acid-lime: #d4ff00; /* Tertiary accent (lime) */
	--color-text: #e0e0e0; /* Primary text (light gray) */
	--color-text-dim: #808080; /* Secondary text (mid gray) */
	--color-warning: #ff6600; /* Warning state (orange) */
}
```

#### Spacing System

```css
:root {
	--spacing-xs: 4px;
	--spacing-sm: 8px;
	--spacing-md: 16px;
	--spacing-lg: 24px;
	--spacing-xl: 32px;
}
```

#### Typography [DEPRECATED 2026-11-01]

Superseded by [Typography](#typography).

```css
:root {
	--font-primary: "Noto Sans Math", sans-serif;
	--font-size-small: 12px;
	--font-size-base: 16px;
	--font-size-large: 24px;
	--font-size-logo: 48px;
}
```

### Logo Component (`apps/web/src/components/Logo.svelte`) [DEPRECATED 2026-11-01]

Superseded by [Identity](#identity).

- **Glyphs:** ∅ (U+2205 Empty Set) · (U+00B7 Middle Dot) Δ (U+0394 Greek Delta)
- **Font:** Noto Sans Math ensures mathematical symbols render correctly
- **Styling:** Neon blue color with text-shadow glow
- **Responsive:** Scales down on mobile (32px)

### Usage Examples

**Component Styling:**
```svelte
<style>
  .game-hud {
    background: var(--color-void);
    color: var(--color-text);
    padding: var(--spacing-md);
  }
  
  .accent-button {
    color: var(--color-neon-blue);
    border: 2px solid var(--color-neon-blue);
  }
</style>
```

**NO Magic Numbers:**
```css
/* ❌ BAD - Hardcoded values */
.element {
	color: #00f0ff;
	margin: 16px;
}

/* ✅ GOOD - Using tokens */
.element {
	color: var(--color-neon-blue);
	margin: var(--spacing-md);
}
```

## Font Loading [DEPRECATED 2026-11-01]

Superseded by [Typography](#typography): fonts are self-hosted and no CDN is used.

### Google Fonts CDN

```html
<!-- apps/web/src/layouts/Layout.astro -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link
	href="https://fonts.googleapis.com/css2?family=Noto+Sans+Math&display=swap"
	rel="stylesheet"
>
```

### Performance

- **Font Display:** `swap` strategy prevents FOIT (Flash of Invisible Text)
- **Preconnect:** Reduces DNS lookup time for Google Fonts
- **Subset:** Full Unicode math symbols loaded for logo rendering [DEPRECATED 2026-11-01]: the logomark is SVG outlines

## Button System

### Button Tokens

**Token Location:** `apps/web/src/styles.css` (in `:root`)

```css
:root {
  /* Button sizing - values tunable */
  --button-padding-x: <spacing-token>;
  --button-padding-y: <spacing-token>;
  --button-min-height: <size>;          /* Minimum 44px for touch targets */
  --button-border-width: <size>;
  --button-border-radius: <size>;
  
  /* Button transitions - values tunable */
  --button-transition: <transition>;
}
```

**Note:** Actual values defined in styles.css, not in specs. Design tokens reference existing spacing tokens where possible.

### Button Classes

#### Base Button (`.btn`)

All buttons share common styles:
```css
.btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: var(--button-padding-y) var(--button-padding-x);
	min-height: var(--button-min-height);
	font-family: var(--font-primary);
	font-size: var(--font-size-base);
	text-decoration: none;
	cursor: pointer;
	transition: var(--button-transition);
	border-radius: var(--button-border-radius);
}

.btn:focus-visible {
	outline: 2px solid var(--color-neon-blue);
	outline-offset: 2px;
}
```

#### Ghost Button (`.btn-ghost`)

Transparent background with neon border - primary interactive style:
```css
.btn-ghost {
	background: transparent;
	color: var(--color-neon-blue);
	border: var(--button-border-width) solid var(--color-neon-blue);
}

.btn-ghost:hover {
	background: rgba(0, 240, 255, 0.1);
	box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
}
```

#### Filled Button (`.btn-filled`)

Solid background for primary actions:
```css
.btn-filled {
	background: var(--color-neon-blue);
	color: var(--color-void);
	border: var(--button-border-width) solid var(--color-neon-blue);
}

.btn-filled:hover {
	background: transparent;
	color: var(--color-neon-blue);
}
```

#### Link Button (`.btn-link`)

Text-only style for navigation:
```css
.btn-link {
	background: transparent;
	color: var(--color-text);
	border: none;
	padding: var(--spacing-sm);
	min-height: auto;
}

.btn-link:hover {
	color: var(--color-neon-blue);
}
```

### Usage Guidelines

- **Ghost buttons:** Default for most UI actions (Start Game, Settings)
- **Filled buttons:** Primary calls-to-action (Try Again after death)
- **Link buttons:** Navigation and secondary actions (Back to Game)
- **Minimum touch target:** 44x44px for accessibility

### Migration Status

- [ ] Add button tokens to `apps/web/src/styles.css`
- [ ] Add global `.btn` classes to `apps/web/src/styles.css`
- [ ] Refactor `MenuOverlay.svelte` to use `.btn .btn-ghost`
- [ ] Refactor `GameOver.svelte` to use `.btn .btn-filled`
- [ ] Refactor `Settings.svelte` to use `.btn .btn-link`

## Future Enhancements

- [ ] Add animation tokens (duration, easing curves)
- [ ] Add shadow/glow effect tokens for consistent visual effects
- [ ] Add breakpoint tokens for responsive design
- [x] Self-host fonts (2026-11-01, opening-screen S1)

---

**Design System Status: OPERATIONAL** 🎨  
**Token Count:** 15+ defined variables  
**Coverage:** 100% of UI components
