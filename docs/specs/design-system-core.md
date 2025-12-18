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
- **Font:** Noto Sans Math (Google Fonts, loaded via CDN).
- **Logo Symbolism:** ∅·Δ (Void × Drift).
- **Implementation:** Zero hardcoded colors in components; all use `var(--token-name)`.

### Anti-Patterns
- **Do NOT** use hardcoded hex values in components (e.g., `#00f0ff`); always use `var(--color-neon-blue)`.
- **Do NOT** use Tailwind or other utility classes; use semantic CSS.
- **Do NOT** use image assets for the logo; use HTML entities for sharp scaling.
- **Do NOT** use `var(--color-primary)` - this token does not exist. Use `var(--color-neon-blue)` for primary accent color.

## Contract

### Definition of Done
- [x] Global CSS file exists at `apps/web/src/styles.css`.
- [x] CSS Variables for all defined colors are present in `:root`.
- [x] Font "Noto Sans Math" loads correctly via Google Fonts.
- [x] Logo component renders ∅·Δ glyphs correctly using Noto Sans Math.
- [x] All UI components use design tokens (no hardcoded hex values).

### Regression Guardrails
- **Performance:** No Layout Thrashing from heavy CSS effects.
- **Accessibility:** Text colors must meet AA contrast ratio against `--color-void`.
- **Consistency:** All new UI components must use the defined design tokens.

### Scenarios
**Scenario: Logo Rendering** ✅
- Given the Logo component in `apps/web/src/components/Logo.svelte`
- When rendered in the HUD
- Then it displays ∅·Δ using Noto Sans Math font
- And it uses `var(--color-neon-blue)` for color
- And it has a subtle text-shadow glow effect
- **Status:** VERIFIED - Logo visible in game HUD (top-left)

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

## Current Implementation

### Design Tokens (`apps/web/src/styles.css`)

#### Color Palette
```css
:root {
  --color-void: #050510;           /* Deep space background */
  --color-neon-blue: #00f0ff;      /* Primary accent (cyan) */
  --color-neon-pink: #ff00ff;      /* Secondary accent (magenta) */
  --color-acid-lime: #d4ff00;      /* Tertiary accent (lime) */
  --color-text: #e0e0e0;           /* Primary text (light gray) */
  --color-text-dim: #808080;       /* Secondary text (mid gray) */
  --color-warning: #ff6600;        /* Warning state (orange) */
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

#### Typography
```css
:root {
  --font-primary: 'Noto Sans Math', sans-serif;
  --font-size-small: 12px;
  --font-size-base: 16px;
  --font-size-large: 24px;
  --font-size-logo: 48px;
}
```

### Logo Component (`apps/web/src/components/Logo.svelte`)
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

## Font Loading

### Google Fonts CDN
```html
<!-- apps/web/src/layouts/Layout.astro -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Math&display=swap" rel="stylesheet">
```

### Performance
- **Font Display:** `swap` strategy prevents FOIT (Flash of Invisible Text)
- **Preconnect:** Reduces DNS lookup time for Google Fonts
- **Subset:** Full Unicode math symbols loaded for logo rendering

## Future Enhancements
- [ ] Add animation tokens (duration, easing curves)
- [ ] Add shadow/glow effect tokens for consistent visual effects
- [ ] Add breakpoint tokens for responsive design
- [ ] Consider self-hosting fonts for offline support

---

**Design System Status: OPERATIONAL** 🎨  
**Token Count:** 15+ defined variables  
**Coverage:** 100% of UI components
