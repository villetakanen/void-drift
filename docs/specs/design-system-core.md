# Feature: Design System Core

## Blueprint

### Context
This specification defines the "Experience Model" for Void Drift. It establishes the core visual axioms—Logo, Typography, and Color—that drive the application's "Vibe" (Newtonian Chaos / Utilitarian Sci-Fi). These rules ensure consistency across the game HUD, menus, and marketing pages.

### Architecture
- **Tech Stack:** Vanilla CSS Variables (Tokens).
- **Location:** `apps/web/src/styles.css` (Source of Truth).
- **Font:** Noto Sans Math (Google Fonts).
- **Symbolism:** $\emptyset \cdot \Delta$ (Void * Drift).

### Anti-Patterns
- **Do NOT** use hardcoded hex values in components (e.g., `#00f0ff`); always use `var(--color-neon-blue)`.
- **Do NOT** use Tailwind or other utility classes; use semantic CSS.
- **Do NOT** use image assets for the logo; use HTML entities for sharp scaling.

## Contract

### Definition of Done
- [ ] Global CSS file exists at `apps/web/src/styles.css`.
- [ ] CSS Variables for all defined colors are present in `:root`.
- [ ] Font "Noto Sans Math" loads correctly.
- [ ] Applying `class="logo"` (or similar) renders the $\emptyset \cdot \Delta$ glyphs correctly.

### Regression Guardrails
- **Performance:** No Layout Thrashing from heavy CSS effects.
- **Accessibility:** Text colors must meet AA contrast ratio against `--color-void`.
- **Consistency:** All new UI components must use the defined design tokens.

### Scenarios
**Scenario: Button Styling**
- Given a standard `<button>` element
- When styled with the design system
- Then it uses `--color-neon-blue` for primary actions
- And it uses `Noto Sans Math` font
- And it has sharp corners (2px radius)

**Scenario: Dark Mode Default**
- Given a blank page in the application
- When loaded
- Then the background color is exactly `var(--color-void)` (#050510)
- And the text color is `var(--color-text)` (#e0e0e0)
