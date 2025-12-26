# PBI-022: Button Design System

**Status:** TODO  
**Priority:** MEDIUM  
**Estimate:** 3 Story Points  
**Phase:** 6 (Foundation)  
**Target Version:** v0.1.2

---

## User Story

**As a** developer  
**I want** unified button styles defined in the design system  
**So that** all buttons across the app look consistent and I don't duplicate CSS

---

## Context

Currently, button styles are duplicated across multiple components:
- `GameOver.svelte` - `.primary`, `.secondary` classes
- `MenuOverlay.svelte` - `.start-button` class
- `Settings.svelte` - `.back-button` class

Each has slightly different implementations of the same visual patterns (ghost button, filled button). This leads to:
- Inconsistent hover/focus states
- Duplicated CSS
- Maintenance burden when updating button styles

This PBI centralizes button styles into the design system.

---

## Acceptance Criteria

### Design Tokens
- [ ] Add button-specific tokens to `styles.css`:
  - `--button-padding-x`, `--button-padding-y`
  - `--button-font-size`
  - `--button-border-width`
  - `--button-min-height` (44px for touch targets)
  - `--button-transition`

### Button Variants
- [ ] **Ghost Button** (default): Transparent background, neon-blue border
  - Normal: transparent bg, neon-blue border + text
  - Hover: neon-blue bg, void text
  - Focus: 2px outline offset
- [ ] **Filled Button** (primary action): Solid neon-blue background
  - Normal: neon-blue bg, void text
  - Hover: brightness(1.2)
  - Focus: 2px outline offset
- [ ] **Link Button** (navigation): No border, just text
  - Normal: dim text
  - Hover: bright text
  - Focus: underline or outline

### Global Styles
- [ ] Add `.btn`, `.btn-ghost`, `.btn-filled`, `.btn-link` classes to `styles.css`
- [ ] All button classes include:
  - `cursor: pointer`
  - `font-family: inherit`
  - `min-height: var(--button-min-height)`
  - Proper transition timing
  - Focus-visible states

### Component Updates
- [ ] `GameOver.svelte`: Replace `.primary`/`.secondary` with `.btn-filled`/`.btn-ghost`
- [ ] `MenuOverlay.svelte`: Replace `.start-button` with `.btn-ghost`
- [ ] `Settings.svelte`: Replace `.back-button` with `.btn-ghost`
- [ ] Remove duplicated button CSS from all components

### Accessibility
- [ ] All buttons have visible focus indicators
- [ ] Focus indicators use `focus-visible` (not `focus`)
- [ ] Minimum touch target 44x44px maintained

---

## Technical Implementation

### New Design Tokens

```css
/* apps/web/src/styles.css */
:root {
  /* Button Tokens */
  --button-padding-x: var(--spacing-lg);
  --button-padding-y: var(--spacing-sm);
  --button-font-size: 1rem;
  --button-font-weight: 500;
  --button-border-width: 2px;
  --button-min-height: 44px;
  --button-border-radius: var(--radius-sm);
  --button-transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
```

### Global Button Classes

```css
/* Base button reset */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--button-padding-y) var(--button-padding-x);
  font-family: inherit;
  font-size: var(--button-font-size);
  font-weight: var(--button-font-weight);
  line-height: 1;
  min-height: var(--button-min-height);
  border-radius: var(--button-border-radius);
  cursor: pointer;
  text-decoration: none;
  transition: var(--button-transition);
}

.btn:focus-visible {
  outline: 2px solid var(--color-neon-blue);
  outline-offset: 2px;
}

/* Ghost variant (default) */
.btn-ghost {
  background: transparent;
  border: var(--button-border-width) solid var(--color-neon-blue);
  color: var(--color-neon-blue);
}

.btn-ghost:hover {
  background: var(--color-neon-blue);
  color: var(--color-void);
}

/* Filled variant */
.btn-filled {
  background: var(--color-neon-blue);
  border: var(--button-border-width) solid var(--color-neon-blue);
  color: var(--color-void);
}

.btn-filled:hover {
  filter: brightness(1.2);
}

/* Link variant */
.btn-link {
  background: transparent;
  border: none;
  color: var(--color-text-dim);
  padding: var(--spacing-sm);
  min-height: auto;
}

.btn-link:hover {
  color: var(--color-text);
}
```

### Component Migration Example

**Before (GameOver.svelte):**
```svelte
<button class="primary">Try Again</button>
<a href="/leaderboard" class="secondary">Leaderboard</a>

<style>
  .primary {
    background: var(--color-neon-blue);
    color: var(--color-void);
    /* ... 20+ lines of CSS */
  }
  .secondary {
    /* ... another 15+ lines */
  }
</style>
```

**After (GameOver.svelte):**
```svelte
<button class="btn btn-filled">Try Again</button>
<a href="/leaderboard" class="btn btn-ghost">Leaderboard</a>

<style>
  /* No button styles needed - uses global classes */
</style>
```

---

## Definition of Done

- [ ] Button tokens added to `styles.css`
- [ ] `.btn`, `.btn-ghost`, `.btn-filled`, `.btn-link` classes implemented
- [ ] All three components migrated to use global classes
- [ ] Duplicated button CSS removed from components
- [ ] Visual appearance unchanged (same look, unified code)
- [ ] All buttons pass accessibility check (focus visible, 44px touch target)
- [ ] Zero TypeScript errors (`pnpm -r check`)

---

## Testing Checklist

### Visual Regression
- [ ] GameOver buttons look identical to before
- [ ] MenuOverlay start button looks identical
- [ ] Settings back button looks identical
- [ ] Hover states work on all buttons
- [ ] Focus states visible on keyboard navigation

### Accessibility
- [ ] Tab through all buttons - focus ring visible
- [ ] Touch target at least 44x44px (inspect with DevTools)
- [ ] Works with keyboard (Enter/Space activates)

### Mobile
- [ ] Buttons tappable on mobile
- [ ] No layout issues on small screens

---

## Out of Scope

- [ ] Button loading states (spinner)
- [ ] Disabled button styles
- [ ] Icon buttons
- [ ] Button groups

---

## Related Documents

- [Design System Core Spec](../specs/design-system-core.md)
- [Phase 6 Roadmap](../PHASE-6-ROADMAP.md)
