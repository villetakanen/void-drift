# Design system

## Blueprint

### Context

The design system is Void Drift's shared visual language: identity, typography,
colour, elevation, surfaces, layers and inputs. It keeps the game HUD, menus and
the Lab consistent in one register, utilitarian sci-fi neon on the void, so a
screen composes shared definitions instead of inventing its own.

### Architecture and boundaries

- `packages/core/src/lib/styles/tokens.css` is the single source of tokens.
  `packages/core/src/lib/ui/colors.ts` mirrors the colours canvas needs;
  `scripts/check-contracts.mjs` keeps them equal.
- Shared CSS lives beside the tokens: `buttons.css`, `surfaces.css` and
  `flight.css`. Shared input components live in `apps/web/src/components/inputs/`.
- `apps/web/src/components/Logo.svelte` draws the logomark from SVG outlines;
  fonts are self-hosted.
- The design system has one home in the Lab, `/lab/ds`. Each shared part has
  one canonical page at `/lab/ds/<name>`, and the overview at `/lab/ds` lists
  every page with the files that define the part and the section of this
  contract that describes it. The list is the Design system group in
  `apps/web/src/data/lab-pages.ts`.
- A part that is not on the overview does not exist. Work that needs one
  says so; it does not build the part in place.
- `scripts/check-contracts.mjs` keeps the home true: a design-system page is
  at `/lab/ds/<name>`, names its files and its section, and every shared
  input and stylesheet is named by a page. Pages at an earlier address
  (`/lab/tokens`, `/lab/typography`, `/lab/surfaces`, `/lab/inputs`,
  `/lab/logomark`, `/lab/graphs`, `/lab/instrument-parts`) are listed in that
  check and move to `/lab/ds/<name>` in the change that next touches them.
- Feature specs consume the system. Changing a definition is design work,
  recorded here and demonstrated on its Lab page in the same change.

### Rules

- Components and canvas take colours, fonts, spacing, sizes, cuts and layers
  from tokens, named by role. A missing token is added deliberately, with a Lab
  example.
- Basic HTML elements use native CSS and global classes; larger interactions
  are components.
- Informational text uses the text roles; brand, action and selected mark
  identity, what can be acted on, and selection.
- Procedural drawing lives in `packages/core/src/lib/assets/` and effects in
  `packages/core/src/lib/effects/`; canvas geometry and simulation values live
  in their typed configuration, not CSS.

## Contract

### Definition of Done

- Global CSS file exists at `apps/web/src/styles.css`.
- CSS Variables for all defined colors are present in `:root`.
- [DEPRECATED 2026-11-01] ~~Font "Noto Sans Math" loads correctly via Google Fonts.~~ The CDN link was removed on 2026-10-28 (`3041a80`); nothing has loaded it since.
- [DEPRECATED 2026-11-01] ~~Logo component renders ∅·Δ glyphs correctly using Noto Sans Math.~~ Replaced by SVG outlines in opening-screen S2.
- `Logo.svelte` draws ∅·Δ from committed SVG outlines and appears in every shared header, the Lab rail and the favicon.
- All UI components use design tokens (no hardcoded hex values).
- Shared UI takes every `z-index` from a `--layer-*` token, and every cut corner from a `--cut-size-*` token (S6).
- Menu, pause and run complete sit on one `.panel`; the flight status message on `.panel--flat` (S6).
- Thrust pad tokens and `ThrustPads` exist as specified, and `/lab/inputs`
  demonstrates both sides in every lit state over a starfield.
- `Tabs` exists as specified in [Tabs](#tabs), and `/lab/ds/tabs`
  demonstrates facts, a row without them, an unavailable tab, both
  activation modes, a row that overflows its host and a stretched row.

### Regression Guardrails

- **Performance:** No Layout Thrashing from heavy CSS effects.
- **Accessibility:** Text roles must meet AA on the surfaces they are used on; `/lab/tokens` measures each pair.
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
- Then the background color is exactly `var(--color-void)` [DEPRECATED 2026-11-01] ~~(#050510)~~ (`lch(1.57% 4.76 285.25)`)
- And the text color is `var(--color-text)` [DEPRECATED 2026-11-01] ~~(#e0e0e0)~~ (`lch(99.7% 7.45 104.72)`)
- **Status:** VERIFIED - All pages use dark theme by default

**Scenario: Token Enforcement** ✅
- Given a new UI component is created
- When it needs a color value
- Then it MUST use `var(--color-*)` tokens
- And NOT use hardcoded hex values like `#00f0ff`
- **Status:** [DEPRECATED 2026-11-01] ~~ENFORCED - Biome linting checks for hardcoded colors~~ No lint rule
  checks colours. `pnpm check:contracts` keeps canvas `COLOR` equal to the tokens; CSS literals are caught in review.

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

## Colour

**Status:** Implemented 2026-11-01 (opening-screen S3, decision D6).
**Source of truth:** `packages/core/src/lib/styles/tokens.css` and
`packages/core/src/lib/ui/colors.ts`. **Lab:** `/lab/tokens`.

Every colour value is written in `lch()`. Components, layouts and canvas name a role, never a
literal and never the palette name behind it.

### Brand and its aliases

| Token              | Value                      | Use                                                                                                                        |
| ------------------ | -------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `--color-brand`    | `lch(96.42% 84.18 104.87)` | The logomark and identity (the lime, sRGB `#eeff41`)                                                                       |
| `--color-action`   | `var(--color-brand)`       | What you can act on: buttons, links, toggles, sliders, inspector inputs                                                    |
| `--color-selected` | `var(--color-brand)`       | What is selected: pressed buttons, active engines, Lab nav, installed builder parts and occupied slots, selection outlines |
| `--color-on-brand` | `var(--color-void)`        | Text and marks on a lime fill                                                                                              |
- Lime is one colour with two jobs: it is the brand, and it marks what is interactive or selected.
  Use the alias that says which job a use does, so the jobs can be told apart in code even though
  they render the same.
- Informational text never uses brand: eyebrows, tags, captions, descriptions, headings, values and
  feedback messages use the text roles.
- Hover and selection tints mix the role with transparent (`color-mix(in lch, var(--color-selected)
  10%, transparent)`); there are no separate tint tokens.

### Text, border, surface and scrim

| Role    | Token                               | Value                                  | Use                                                                             |
| ------- | ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------- |
| Text    | `--color-text`                      | `lch(99.7% 7.45 104.72)`               | Headings, values, body, descriptions                                            |
| Text    | `--color-text-muted`                | `lch(56.7% 0 0)`                       | Eyebrows, tags, captions, secondary labels                                      |
| Border  | `--color-border`                    | `lch(100% 0 0 / 0.141)`                | Panel, header and table edges                                                   |
| Border  | `--color-border-subtle`             | `lch(100% 0 0 / 0.094)`                | Dividers inside panels; resource bar track                                      |
| Border  | `--color-border-faint`              | `lch(100% 0 0 / 0.051)`                | Lab stage grids                                                                 |
| Border  | `--color-grid`                      | `lch(45.22% 12.57 223.2)`              | Builder blueprint grid                                                          |
| Surface | `--color-void`                      | `lch(1.57% 4.76 285.25)`               | The page and the canvas clear (elevation 0)                                     |
| Surface | `--color-elev-1`..`-3`              | see [Elevation](#elevation-and-inputs) | Panels, displays, overlay panes                                                 |
| Surface | `--color-glass`                     | `lch(1.57% 4.76 285.25 / 0.91)`        | The void over the live stage. (see [Surfaces and layers](#surfaces-and-layers)) |
| Surface | `--color-surface-hover`             | `lch(100% 0 0 / 0.051)`                | Hover tint on any surface                                                       |
| Scrim   | `--color-backdrop`                  | `lch(0% 0 0 / 0.11)`                   | Dims what a Lab overlay pane covers                                             |
| Scrim   | `--scrim-filter`, `--scrim-surface` | see [Scrim](#scrim-the-offline-feed)   | Shades the stage behind a dialog                                                |
| Surface | `--panel-fill`                      | elev-2 at 65%                          | Panels; see [Panels](#panels)                                                   |
- Panels sit on `--color-elev-1`; `--color-void-light` now aliases it (panels rose from L 3.3 to
  5.5).
- Borders are white at fixed strengths so one token reads on every surface.
- `theme-color` in `Layout.astro` is `#050510`, the void in sRGB, because a meta tag cannot read
  a token; `pnpm check:contracts` fails if either side changes alone.

### Contrast on each surface

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

### Canvas

Canvas cannot read custom properties. Renderers import `COLOR` from `@void-drift/core`, whose values
mirror the resolved tokens; `pnpm check:contracts` resolves each token through its aliases and fails
on drift. The builder passes `COLOR.selected`, `COLOR.void` and `COLOR.text` as its slot palette.

### Game and status colours

Planets, stars, particles, ion beams, plumes, ship and engine art, orbits and the arena keep their
own values in the renderers; they are game data, not roles. Engine identity colours live in
`ENGINE_ACCENT` (`@void-drift/mode-a`). Token-defined game colours are `--color-resource-hull`,
`-power`, `-warning`, `-danger` and the status colours `--color-android-green`,
`--color-caution-tape` and `--color-red`. `--color-resource-power` aliases brand until S8 gives it its
own colour, and the Fighter ship tint (`#D4FF00`) is ship data in `SHIP_PROFILES`; S4 renamed the ship and left the tint unchanged.

### Deprecated names

These alias a role and remain only while preserved studies use them (preserved studies follow the
aliases, as they do for type): `--color-acid-lime` → brand, `--color-neon-blue` → action,
`--color-neon-orange` → caution-tape, `--color-neon-green` → android-green, `--color-text-dim` →
text-muted, `--color-void-light` → elev-1, `--color-overlay` → glass (0.9 became 0.91),
`--color-flight-glass` → glass, `--color-flight-trail` → border-subtle, `--flight-border` →
`1px solid var(--color-border)`, `--flight-glow` → a 15% selected mix.

## Elevation and inputs

**Status:** Toggle and RingSlider implemented 2026-11-01; square Switch accepted and
implemented 2026-11-03.
**Source of truth:** `packages/core/src/lib/styles/tokens.css`,
`apps/web/src/components/inputs/Toggle.svelte`, `apps/web/src/components/inputs/RingSlider.svelte`,
`apps/web/src/components/inputs/Switch.svelte`.
**References:** `/lab/surfaces`, `/lab/inputs`.

| Token               | Value                                              | Use                       |
| ------------------- | -------------------------------------------------- | ------------------------- |
| `--color-elev-1`    | `lch(5.5% 10 290)`                                 | Console                   |
| `--color-elev-2`    | `lch(11% 15 290)`                                  | Display                   |
| `--color-elev-3`    | `lch(16.5% 20 290)`                                | Overlay pane              |
| `--surface-display` | elevation 2 with 4px scanlines and a darkened edge | Display background        |
| `--shadow-display`  | 1px dark bezel; 0 8px 24px black at 70%            | Display edge              |
| `--color-backdrop`  | black at 11%                                       | Behind a Lab overlay pane |
- Each elevation step keeps the background's hue, 290, and raises lightness by 5.5
  and chroma by 5.
- The elevation steps are the surface roles and `--color-backdrop` is the scrim role;
  see [Colour](#colour).
- `Toggle` takes `options`, a bindable `value` and a group `label`; `compact` sets
  8px side padding and `stretch` fills the width. Native radios give arrow keys.
  `disabledOptions` keeps unavailable options visible, disables their native
  radios, skips them during keyboard selection and suppresses hover treatment.
  A selected option can remain selected while disabled; the control does not
  silently change its value. An optional `optionSuffix` snippet receives the
  option label and supplies supporting content; it leaves the native radio's
  accessible name intact. The Hangar's ship chooser uses this control.
  `/lab/inputs` demonstrates disabled options and suffix composition.
- `RingSlider` wraps a native range input (keys, touch and forms unchanged) at a
  44px touch height; `compact` hides its label line where the host shows it. Its
  value is announced through the input, not a live region.
- Use `Switch` for enabling or disabling one setting, including Playground,
  Ion stabilizers and Linked engines. Use `Toggle` to choose one value from a
  set, such as a ship or Plan/View; two labels alone do not make a binary setting
  a segmented choice.
- `Switch` is a binary on/off setting, distinct from the multi-option `Toggle`.
  It binds `checked` and optionally accepts `disabled`; a surrounding label supplies
  its accessible name. The native checkbox preserves checkbox semantics and
  Space-key behavior.
- The switch hit area is 88×44px. Its visible track is 80×30px with the small
  top-left and bottom-right cuts and no border. A cut-corner marker moves between
  explicit `OFF` and `ON` states. The selected marker uses `--color-selected`;
  its text uses `--color-on-brand`. Focus, hover, disabled and reduced-motion states
  use the shared control foundations.
- `/lab/inputs` demonstrates the switch in off, on and disabled states. The Hangar
  uses it for Playground, Ion stabilizers and Linked engines.
- The toggle is one button-shaped control split into equal parts: cut corners
  outside, a straight split inside, the selected part filled lime, the others on
  `--color-elev-2`, the surface the switch track and tabs share, taking a faint
  lime tint under a pointer.
- The detailed selector variant adds optional `details` keyed by option label.
  Each segment lays out its name and supporting facts with wrapping inline flex.
  `stretch` fills the host width with equal segments. Facts use caption text,
  muted when unselected and on-brand when selected. Native radio names remain
  the option labels; facts are accessible descriptions. `/lab/inputs` demonstrates
  this variant with ship slot counts and chassis mass; the Hangar consumes it.
- The ring slider is a faint 2px track, lime to the value, and a lime ring knob;
  label and value stay neutral, and the unfilled track takes the same tint on hover.
- Lime marks the selection and the knob; hover borrows it at low strength. Data and
  values stay neutral.

### Tabs

**Source of truth:** `apps/web/src/components/inputs/Tabs.svelte`.
**Reference:** `/lab/ds/tabs`. Behaviour follows the WAI-ARIA Authoring
Practices tabs pattern.

Choose the control by what it does:

| Control  | Use for                                          | Owns content        | Semantics                    |
| -------- | ------------------------------------------------ | ------------------- | ---------------------------- |
| `Tabs`   | Sibling views of one area, one visible at a time | Yes: one panel each | `tablist`, `tab`, `tabpanel` |
| `Toggle` | One value from a small set                       | No                  | Native radio group           |
| `Switch` | Enabling or disabling one setting                | No                  | Native checkbox              |
- Tabs are not for form values, commands or page navigation. A control that
  swaps the whole area beneath it is tabs, however few options it has; a control
  whose value the host merely reads is a toggle. Tabs share the toggle's look
  and differ in what they do; tab roles are never put on a radio group.
- `Tabs` takes `tabs` (each an `id`, a `label`, optional `facts` and
  `unavailable`), a bindable `value` holding the selected id, a `label` naming
  the row, `activation`, `stretch` and a `panel` snippet that receives the
  selected tab. The component renders the panel element and links tab and panel
  to each other; the host supplies the panel's content.
- The row is the toggle's shape: one cut button split into parts, straight
  splits inside. The selected part is filled with the selected colour; the
  others sit on `--color-elev-2`, the switch track's surface, and take a faint
  action tint under a pointer. Focus is the shared inset ring. The component
  draws no surface around the panel.
- A tab holds its name and up to two short facts. The name leads the part and
  the facts close it: caption text, stacked, muted when unselected and on-brand
  when selected. Facts are the default; a row may omit them. The row is exactly
  one button tall with or without facts, and text never wraps. Anything richer
  belongs in the panel. The label is the tab's accessible name; the facts are
  its description.
- An unavailable tab stays in the row as an empty frame: no fill, an
  `--color-elev-2` edge and muted text at full strength. It takes no hover
  treatment, keeps keyboard focus so its facts can be read, and is never
  selected by pointer or key. A selected tab that becomes unavailable stays
  selected; the component never changes `value` on its own.
- The row is one tab stop, entered at the selected tab. Left and Right move
  between tabs and wrap; Home and End reach the ends. With `automatic`
  activation, the default, focusing a tab selects it; with `manual`, Enter or
  Space selects. Use `manual` when showing a panel is slow or consequential.
  The panel is the next tab stop.
- Tabs size to their content and never shrink. A row wider than its host
  scrolls sideways inside itself and brings the focused tab into view; neither
  the host nor the page widens. `stretch` shares the host width between tabs.
  A row that scrolls at its normal host width has too many tabs or too much in
  them.

### Thrust pads

The flight thrust pads are translucent glass over the live stage. Their
arrangement, actions and lighting rules belong to the
[controls contract](../../game/controls/spec.md); this section owns their look.

| Token                  | Value                     | Use              |
| ---------------------- | ------------------------- | ---------------- |
| `--color-pad-turn`     | `--color-elev-3` at 22%   | Turn pad at rest |
| `--color-pad-burn`     | `--color-elev-3` at 36%   | Burn pad at rest |
| `--color-pad-turn-lit` | `--color-selected` at 9%  | Lit turn pad     |
| `--color-pad-burn-lit` | `--color-selected` at 16% | Lit burn pad     |
- Pads are borderless and uncut: two disjoint panes per gutter, so tints never
  stack, and stars stay visible through them at rest and lit.
- Markings are `--color-text` in the UI type family; Android green stays
  reserved for the world HUD, the arrival countdown and title-screen
  information.
- `apps/web/src/components/inputs/ThrustPads.svelte` draws one gutter's
  assembly: its `side`, the pads to light, and pointer presses reported per pad.
  Drawing and hit-testing share one geometry, so what lights is what was
  touched.
- `/lab/inputs` demonstrates both sides in every lit state (none, `L`, `R`,
  `LR`, `LF`, `RF`) over a starfield, and lets a pointer press them.

## Surfaces and layers

**Status:** Implemented 2026-11-02 (opening-screen S6).
**Source of truth:** `packages/core/src/lib/styles/tokens.css`,
`packages/core/src/lib/styles/surfaces.css`, `apps/web/src/components/Dialog.svelte`.
**Reference:** `/lab/surfaces`. Dialog behaviour: [dialogs.md](../../game/dialogs/spec.md).

### Corner cuts

One corner language: every surface and control cuts its **top-left and bottom-right**
corners, as buttons do.

| Token           | Value | Use                 |
| --------------- | ----- | ------------------- |
| `--cut-size-sm` | 6px   | Small controls      |
| `--cut-size-md` | 10px  | Buttons, the toggle |
| `--cut-size-lg` | 16px  | Panels              |
- `--button-cut-size` aliases `--cut-size-md`.
- `--radius-sm` (2px) is for text fields only. Circles (knobs, swatches) stay round.

### Cut surfaces

`.cut-surface` (and `.panel`, which builds on it) draws its fill and edge behind its content, so a
fill can be translucent while the edge and shadow follow the cut:

- `::before` is the fill (`--_fill`), clipped to the cut shape.
- `::after` is the 1px edge (`--_edge`) and the shadow (`--_shadow`) outside the shape: it
  paints the shape, takes its drop shadow, then a clip with a hole removes everything inside the
  edge, so the shadow never shows through a translucent fill.
- The element is isolated (`isolation: isolate`) and unclipped, so the shadow can spill.
- Private properties: `--_cut`, `--_fill`, `--_edge`, `--_edge-width`, `--_shadow`.
  Defaults: `md`, glass, `--color-border`, 1px, no shadow.

### Panels

| Class          | Fill                    | Edge             | Corners | Shadow                             | Use                              |
| -------------- | ----------------------- | ---------------- | ------- | ---------------------------------- | -------------------------------- |
| `.panel`       | `--panel-fill` (elev-2) | `--color-border` | `lg`    | `--panel-shadow` (0 8px 24px, 70%) | Dialogs over the stage           |
| `.panel--flat` | the same                | `--color-border` | `lg`    | none                               | Status messages on the live game |
- The panel is elevation 2 on the console form: the instrument display's edge and shadow (decided
  2026-11-02). [DEPRECATED 2026-11-02] ~~A frosted translucent shade~~.
- Consumers: the game menu, pause and run complete (`.flight-card` on the panel) and the flight
  status message (`.flight-message`, flat).

### Scrim (the offline feed)

The shared `.scrim-stage` class applies the stage filter and tint independently of modality;
`.dialog-scrim` supplies the overlay surface. A non-modal screen may compose both.

While a dialog is open, the stage it covers reads as an offline feed: the game, seen on a
console display rather than live.

- `--scrim-filter` on the stage: `brightness(0.85) blur(2px)`.
- `--scrim-tint` inside the stage: elevation 2 at 27%, blended with `mix-blend-mode: hue`. It
  shifts the stage's hues toward 290 and keeps each pixel's saturation and lightness, so colours
  stay recognisable, only cooler; the void stays black. It sits inside the stage
  because the dialog layer is its own group, where a blend would have nothing to mix with. A stage
  paints an opaque background, or the tint shows as flat colour where it is transparent.
- [DEPRECATED 2026-11-02] ~~`grayscale(0.85) brightness(0.7)` and a flat elev-2 overlay at 35%~~: the
  first version stacked four darkening layers and removed the system's colours (designer review).
  [DEPRECATED 2026-11-02] ~~`mix-blend-mode: color`~~: it takes chroma from the low-chroma tint
  and so desaturated heavily instead of moving hues toward 290.
- `--scrim-surface` on the scrim layer over it: a darkened edge (30% black, from 55% out) and
  2px-on/2px-off scanlines in `--color-void` at 35%.
- Both ease in over `--duration-fast`; with reduced motion they appear at once.
- The panel is clean: scanlines belong to the feed, not to the pane in front of it.
- `--color-backdrop` (black at 11%) stays the dim behind a Lab overlay pane; game dialogs use
  the scrim.

### Layers

The only `z-index` values in shared UI. Gaps leave room for a later layer.

| Token             | Value | Use                                                      |
| ----------------- | ----- | -------------------------------------------------------- |
| `--layer-toast`   | 200   | Status messages over everything                          |
| `--layer-overlay` | 100   | Dialogs and their scrim                                  |
| `--layer-hud`     | 10    | Deck                                                     |
| `--layer-raised`  | 1     | Sticky footers; a Lab pane over its backdrop             |
| `--layer-base`    | 0     | The stage and page content                               |
| `--layer-under`   | -1    | Behind content inside an isolated part (a button's fill) |
- A part that orders its own pieces (a button's fill behind its label, a cut surface's layers)
  isolates itself with `isolation: isolate` rather than taking a `z-index`.
- Inventory before S6: 7 literals in shared UI (`buttons.css` 1, -1, -1; `flight.css` 2, 5; the
  builder footer 2; the Lab overlay pane 1). Preserved studies keep theirs.

## Identity

**Status:** Implemented 2026-11-01 (opening-screen S2, decision D1).
**Source of truth:** `apps/web/src/components/Logo.svelte`, `apps/web/src/components/logomark.ts`
and the `--logomark-height-*` tokens. **Lab:** `/lab/logomark`.

### Logomark

- The mark is ∅·Δ: U+2205 empty set, U+22C5 dot operator, U+0394 Greek capital delta (void · drift).
  It is the only brand mark. The title screen also displays “VOID DRIFT” as an
  ordinary heading beneath it; this is not a separate mark. “Void Drift” is the
  accessible name and the page-title text.
- The glyphs come from Noto Sans Math 3.000 (SIL OFL 1.1), converted once by
  `scripts/convert-logomark.py` into `logomark.ts` (paths cropped to the ink box, 180 font units
  between advance boxes). `logomark-OFL.txt` sits beside it. The font is never committed or served;
  the script's docstring says how to download it and rerun the conversion, which also regenerates
  the favicon. Do not edit the paths by hand.
- `Logo.svelte` renders inline SVG with `role="img"` and `aria-label` (default "Void Drift"). It
  fills with `currentColor`; the operator is at 70% opacity. Props: `size` (`sm` | `md` | `lg`) and
  `label`.

### Sizes

| Token                  | Height | Used for                                                                            |
| ---------------------- | ------ | ----------------------------------------------------------------------------------- |
| `--logomark-height-sm` | 1rem   | Page headers (game, builder, scores, settings, study shell) and the game menu title |
| `--logomark-height-md` | 1.5rem | Lab nav rail                                                                        |
| `--logomark-height-lg` | 3rem   | Title cards (reserved for opening-screen S12)                                       |

Width follows the 2.62:1 aspect ratio.

### Placement and colour

- The mark is `--color-brand` (D6). On a lime surface it is `--color-on-brand`.
  [DEPRECATED 2026-11-01] ~~lime (`--color-acid-lime`)~~ renamed in S3. Consumers set the colour; shared headers use `.brand` in `flight.css`.
- Every shared page header links home with the mark: `FlightDeck`, `ShipBuilder`, `Leaderboard` and
  `Settings`. The Lab rail links it to `/lab` with the name "Void Drift Lab". `StudyLayout` shows it
  in the nav beside "/ RESEARCH". Preserved study pages keep their local values.
- `public/favicon.svg` is the mark in lime on `--color-void` with a rounded square. Every layout
  (`Layout`, `LabLayout`, `StudyLayout`) links it.
- Page titles read "{Page} | Void Drift" (Lab: "{Page} | Void Drift Lab"); the game is "Void Drift".

## Current Implementation

### Design Tokens (`apps/web/src/styles.css`)

#### Color Palette [DEPRECATED 2026-11-01]

This block predates the PBI-022 lime and the S3 roles; see [Colour](#colour).

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

### Logo Component (`apps/web/src/components/Logo.svelte`)[DEPRECATED 2026-11-01]

Superseded by [Identity](#identity).

- **Glyphs:** ∅ (U+2205 Empty Set) · (U+00B7 Middle Dot) Δ (U+0394 Greek Delta)
- **Font:** Noto Sans Math ensures mathematical symbols render correctly
- **Styling:** Neon blue color with text-shadow glow
- **Responsive:** Scales down on mobile (32px)

### Usage Examples [DEPRECATED 2026-11-01]

The examples use `--color-neon-blue`; read it as `--color-action`.

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

Shared definitions live in `packages/core/src/lib/styles/buttons.css` and
`tokens.css`; `/lab/ds/actions` demonstrates the action language. The
accepted reference is `/lab/studies/buttons-2026-11-11#whole`.

- Actions command; links belong in sentences. Use a single filled call to
  action alongside normal actions. Buttons have cut corners, a minimum 44px
  target, and 8px vertical and 16px horizontal padding.
- `.btn.btn-normal` has a regular label and a pane at elevation 2 on the
  void or elevation 3 on a panel, supplied by `--button-ground`. Its 1px
  brackets leave the middle 40% open across top and bottom. Brackets use
  `--color-bracket` at rest, action lime on hover and keyboard focus.
  Held, the pane takes a 28% action tint.
- `.btn.btn-filled` retains its lime fill and pointer brightness; held it
  dims to 0.85 brightness. Keyboard focus draws dark 2px brackets inset 3px.
- Unavailable normal and filled buttons have no fill, a muted label and
  full-opacity brackets; the filled button's brackets remain lime. This frame
  is the one exception to lime marking what can be acted on or selected.
  Unavailable controls do not respond visually to a pointer.
- `.text-link` uses lime text and a 1px underline at 20% lime; hover,
  focus and held brighten the line to full lime. Unavailable links have muted
  text and no line. Owners must suppress activation of aria-disabled links.
- Bracket and underline changes ease over the fast duration; reduced motion
  removes transitions. Focus brackets have not been measured against focus
  visibility guidelines; the design has not been checked on a touch screen.
- The red button is unsettled. Existing ghost, danger and link-button
  variants remain available, as do the shared focus ring, disabled fade and
  pressed indicator for their existing consumers.
- Vertical groups retain 8px gaps. Existing strip groups remain on a void
  surface and stack below 580px of host width. Preserve DOM and tab order.

## Future Enhancements

- Add animation tokens (duration, easing curves)
- Add shadow/glow effect tokens for consistent visual effects
- Add breakpoint tokens for responsive design
- Self-host fonts (2026-11-01, opening-screen S1)

---

**Design System Status: OPERATIONAL** 🎨  
**Token Count:** 15+ defined variables  
**Coverage:** 100% of UI components

Survival countdown uses Saira Stencil 700 outlines (SIL OFL), in Android green, as transient run-status information.
