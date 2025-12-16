# PBI-006: Base Design Tokens

**Status:** Done
**Priority:** High
**Parent:** Phase 1 (Foundation)

## 1. Goal
Establish the core design tokens (Typography & Colors) to align the "Void Drift" aesthetic with the "Raw Material / Industrial" design spec, adapted for a dark sci-fi setting.

## 2. Requirements

### 2.1. Typography
Import fonts from Google Fonts:
- **Headings / Labels**: `Archivo` (Variable, Heavy weights). Usage: Uppercase, spacing, industrial feel.
- **Body / Code**: `Chivo Mono`. Usage: UI data, logs, general text.

### 2.2. Color Palette (Dark Mode Adaptation)
Implement CSS variables in `apps/web/public/styles.css` (or a dedicated `tokens.css`).

**Theme: Void Industrial**
- **Background (Void)**: `#050510` (Existing) or Deep Black.
- **Foreground (Starlight)**: `#FFFFFF` (Main Text).
- **Surface (Panels/UI)**: `#111111` to `#222222` (Charcoal).
- **Border/Structure**: `#333333`.

**Functional Colors (Raw Material Spec)**
- **Accent (Acid Lime)**: `#D4FF00` -> Primary interactive elements / Highlights.
- **Success (Android Green)**: `#3DDC84`.
- **Warning (Caution Tape)**: `#FFE600`.
- **Error (Red)**: `#FF3333`.

## 3. Implementation Tasks
- [ ] Update `apps/web/public/styles.css` with `@import` for Google Fonts.
- [ ] Define `:root` variables for all colors.
- [ ] Map semantic variables (e.g., `--color-primary` -> `--color-acid-lime`).
- [ ] Apply fonts to `body` and `h1-h6` global styles.

## 4. Acceptance Criteria
- [ ] The app fonts change to Archivo/Chivo Mono.
- [ ] The color palette is available as CSS variables.
- [ ] The Gallery UI reflects these new colors.
- [ ] **Visualize Tokens**: The Gallery has a "Design System" or "Typography" tab that displays the fonts and color swatches.
