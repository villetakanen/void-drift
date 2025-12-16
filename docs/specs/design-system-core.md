# Design System Core Spec

**Target Agent:** @[# 1.2. Experience Designer / Asset Lead (@Designer)]
**Status:** Draft
**Context:** PBI-005, Monorepo Setup

## 1. Overview
This specification defines the foundational "Experience Model" for Void Drift. It establishes the core visual axioms—Logo, Typography, and Color—that will drive the "Vibe" of the application.

## 2. Brand Axioms

### 2.1. The Logo
The logo is a mathematical expression representing the core game loop: *Nothingness (Void) multiplied by Change (Drift)*.

**Symbol:** $\emptyset \cdot \Delta$

- **$\emptyset$ (Empty Set):** Represents the Void.
- **$\cdot$ (Dot Operator):** Represents the interaction/multiplier.
- **$\Delta$ (Delta):** Represents difference, change, or drift.

**Implementation:**
- Render as text using the core font.
- Do not use an image; use the semantic characters:
  - `\emptyset` (U+2205) Ø or ∅
  - `\cdot` (U+22C5) ⋅
  - `\Delta` (U+0394) Δ
- *HTML Entity String:* `&empty; &sdot; &Delta;`

### 2.2. Typography
A strict single-font policy is in effect to maintain a "utilitarian academic sci-fi" aesthetic.

- **Family:** [Noto Sans Math](https://fonts.google.com/noto/specimen/Noto+Sans+Math)
- **Usage:** Exclusive. Headlines, body, UI, code.
- **Rationale:** The game deals with physics vectors and celestial mechanics; the UI should feel like a navigation computer's raw output.

## 3. Design Tokens (CSS Variables)

The @Designer must establish these tokens in `apps/web/src/styles.css` (or `app.css`).

### 3.1. Color Palette ("The Void")
The palette should rely on deep space contrasts—infinite black backgrounds with high-intensity vector colors.

| Token Name | Value (Reference) | Usage |
| :--- | :--- | :--- |
| `--color-void` | `#050510` | Main Background (Deepest Space) |
| `--color-void-light` | `#0a0a1f` | Surface / Panels (Slightly lighter) |
| `--color-text` | `#e0e0e0` | Primary Text |
| `--color-text-dim` | `#808090` | Secondary / Labels |
| `--color-neon-blue` | `#00f0ff` | Primary Action / Player Ship |
| `--color-neon-orange` | `#ff4000` | Alert / Enemy |
| `--color-neon-green` | `#00ff80` | Success / Energy |

### 3.2. Spacing & Shape
- **Grid Unit:** 4px
- **Border Radius:** `2px` (Sharp, but not jagged. Industrial.)
- **Borders:** `1px solid var(--color-text-dim)`

## 4. Implementation Tasks (@Designer)

1.  **Font Loading:**
    - Import `Noto Sans Math` via Google Fonts or bundled asset in `apps/web/src/styles.css`.
    - Apply globally: `body { font-family: 'Noto Sans Math', sans-serif; }`

2.  **Define Variables:**
    - Update `:root` in `apps/web/src/styles.css` with the full palette above.

3.  **Logo Component:**
    - Create a reusable Svelte component or snippet for the Logo to ensure consistent character usage.

## 5. references
- `AGENTS.md` (Persona Guidelines)
- `apps/web/src/styles.css` (Current Stylesheet)
