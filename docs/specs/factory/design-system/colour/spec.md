---
generated:
  by: "openai-codex/gpt-6.2-sol"
  at: "2026-11-23T14:50:01+02:00"
verified: []
---

# Colour roles

## Blueprint

### Context

Colour roles distinguish identity, action, selection and information across CSS and Canvas.

### Architecture

**Source of truth:** `packages/core/src/lib/styles/tokens.css` and
`packages/core/src/lib/ui/colors.ts`. **Lab:** `/lab/tokens`.

Every colour value is written in `lch()`. Components, layouts and canvas name a role, never a
literal and never the palette name behind it.

#### Brand and its aliases

| Token              | Value                      | Use                                                                                                                        |
| ------------------ | -------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `--color-brand`    | `lch(96.42% 84.18 104.87)` | The logomark and identity (the lime, sRGB `#eeff41`)                                                                       |
| `--color-action`   | `var(--color-brand)`       | What you can act on: buttons, links, segmented choices, switches, sliders, inspector inputs                                |
| `--color-selected` | `var(--color-brand)`       | What is selected: pressed buttons, active engines, Lab nav, installed builder parts and occupied slots, selection outlines |
| `--color-on-brand` | `var(--color-void)`        | Text and marks on a lime fill                                                                                              |
- Lime is one colour with two jobs: it is the brand, and it marks what is interactive or selected.
  Use the alias that says which job a use does, so the jobs can be told apart in code even though
  they render the same.
- The shared [Tray](../tray/spec.md) is a scoped exception for resting navigation
  links: `--color-text` on `--color-void`, with `--color-selected` for current-page
  text and edge. Other navigation, links and controls retain their existing
  colour contracts.
- Informational text never uses brand: eyebrows, tags, captions, descriptions, headings, values and
  feedback messages use the text roles.
- Hover and selection tints mix the role with transparent (`color-mix(in lch, var(--color-selected)
  10%, transparent)`); there are no separate tint tokens.

#### Text, border, surface and scrim

| Role    | Token                               | Value                                | Use                                                                            |
| ------- | ----------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------ |
| Text    | `--color-text`                      | `lch(99.7% 7.45 104.72)`             | Headings, values, body, descriptions                                           |
| Text    | `--color-text-muted`                | `lch(56.7% 0 0)`                     | Eyebrows, tags, captions, secondary labels                                     |
| Border  | `--color-border`                    | `lch(100% 0 0 / 0.141)`              | Panel, header and table edges                                                  |
| Border  | `--color-border-subtle`             | `lch(100% 0 0 / 0.094)`              | Dividers inside panels; resource bar track                                     |
| Border  | `--color-border-faint`              | `lch(100% 0 0 / 0.051)`              | Lab stage grids                                                                |
| Border  | `--color-grid`                      | `lch(45.22% 12.57 223.2)`            | Builder blueprint grid                                                         |
| Surface | `--color-void`                      | `lch(1.57% 4.76 285.25)`             | The page and the canvas clear (elevation 0)                                    |
| Surface | `--color-elev-1`..`-3`              | see [Elevation](../inputs/spec.md)   | Panels, displays, overlay panes                                                |
| Surface | `--color-glass`                     | `lch(1.57% 4.76 285.25 / 0.91)`      | The void over the live stage. (see [Surfaces and layers](../surfaces/spec.md)) |
| Surface | `--color-surface-hover`             | `lch(100% 0 0 / 0.051)`              | Hover tint on any surface                                                      |
| Scrim   | `--color-backdrop`                  | `lch(0% 0 0 / 0.11)`                 | Dims what a Lab overlay pane covers                                            |
| Scrim   | `--scrim-filter`, `--scrim-surface` | see [Scrim](#scrim-the-offline-feed) | Shades the stage behind a dialog                                               |
| Surface | `--panel-fill`                      | elev-2                               | Panels; see [Panels](../surfaces/spec.md#panels)                               |
- Console surfaces use `--color-elev-1`; `--color-void-light` aliases it.
- Borders are white at fixed strengths so one token reads on every surface.
- `theme-color` in `Layout.astro` is `#050510`, the void in sRGB, because a meta tag cannot read
  a token; `pnpm check:contracts` fails if either side changes alone.

#### Contrast on each surface

Measured in the browser on `/lab/tokens` (WCAG 2.1; glass over the void):

| Surface          | `--color-text` | `--color-text-muted`   | `--color-action` | Borders (border / subtle / faint / grid) |
| ---------------- | -------------- | ---------------------- | ---------------- | ---------------------------------------- |
| `--color-void`   | 20.1:1         | 5.7:1                  | 18.4:1           | 1.4 / 1.2 / 1.1 / 3.8                    |
| `--color-elev-1` | 18.5:1         | 5.3:1                  | 16.9:1           | 1.5 / 1.3 / 1.1 / 3.5                    |
| `--color-elev-2` | 16.5:1         | 4.7:1                  | 15.1:1           | 1.5 / 1.3 / 1.2 / 3.1                    |
| `--color-elev-3` | 14.4:1         | **4.1:1** (large only) | 13.1:1           | 1.6 / 1.3 / 1.2 / 2.7                    |
| `--color-glass`  | 20.1:1         | 5.7:1                  | 18.4:1           | 1.4 / 1.2 / 1.1 / 3.8                    |

`--color-on-brand` on `--color-brand` is 18.4:1.

- Text and action pass AAA on every surface. Muted text passes AA everywhere except elevation 3,
  where it is large-text only; use `--color-text` for body-size text there.
- Borders are decorative separators and sit below the 3:1 non-text minimum. Controls get their
  edge from `--color-action`, not from a border role.

#### Canvas

Canvas cannot read custom properties. Renderers import `COLOR` from `@void-drift/core`, whose values
mirror the resolved tokens; `pnpm check:contracts` resolves each token through its aliases and fails
on drift. The builder passes `COLOR.selected`, `COLOR.void` and `COLOR.text` as its slot palette.

#### Game and status colours

Planets, stars, particles, ion beams, plumes, ship and engine art, orbits and the arena keep their
own values in the renderers; they are game data, not roles. Engine identity colours live in
`ENGINE_ACCENT` (`@void-drift/mode-a`). Token-defined game colours are `--color-resource-hull`,
`-power`, `-warning`, `-danger` and the status colours `--color-android-green`,
`--color-caution-tape` and `--color-red`. `--color-resource-power` aliases brand for its current power role.

The semantic `--color-alert` role aliases `--color-red` for error-blocked
controls and their status feedback. Background tints mix this role with
transparent; the Actions contract owns their strength. Canvas mirrors this role
as `COLOR.alert`.

#### Deprecated names

These alias a role and remain only while preserved studies use them (preserved studies follow the
aliases, as they do for type): `--color-acid-lime` → brand, `--color-neon-blue` → action,
`--color-neon-orange` → caution-tape, `--color-neon-green` → android-green, `--color-text-dim` →
text-muted, `--color-void-light` → elev-1, `--color-overlay` → glass,
`--color-flight-glass` → glass, `--color-flight-trail` → border-subtle, `--flight-border` →
`1px solid var(--color-border)`, `--flight-glow` → a 15% selected mix.

### Constraints

- Interface colors name semantic roles from shared tokens.
- Canvas uses the checked role mirror.
- Game artwork retains its own material and effect palettes.

## Contract

### Definition of Done

- CSS roles and their Canvas mirror agree.
- Informational text uses text roles; interaction and selection use their respective roles.
- Text contrast meets the documented requirements on each surface.

### Regression guardrails

- Token changes retain Canvas parity and theme-color parity.
- Muted body text on elevation 3 uses the full-strength text role.

### Scenarios

```gherkin
Scenario: Identify a correctable blocking condition
  Given an action is error-blocked by a prerequisite
  When its alert tint and status feedback render
  Then both use the shared alert role rather than a screen-local palette colour

Scenario: Keep neutral navigation scoped to Tray
  Given the shared Tray in a live rail or its framed demo at /lab/ds/tray
  When its navigation renders
  Then resting links use the text role on the void
  And current-page text and edge use the selected role
  And other navigation, links and controls retain their existing colour contracts

Scenario: Preserve role parity
  Given a shared color role changes in tokens
  When repository contracts are checked
  Then a mismatched Canvas mirror fails the check

Scenario: Read information on raised surfaces
  Given body text on elevation 3
  When the interface renders
  Then it uses the full-strength text role rather than the lower-contrast muted role
```
