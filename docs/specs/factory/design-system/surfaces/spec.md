---
generated:
  by: "openai-codex/gpt-6.2-sol"
  at: "2026-11-22T08:54:39Z"
verified: []
---

# Surfaces and layers

## Blueprint

### Context

Shared cut surfaces, panels and scrims give game and Lab interfaces consistent containment and depth.

### Architecture

**Source of truth:** `packages/core/src/lib/styles/tokens.css`,
`packages/core/src/lib/styles/surfaces.css`, `apps/web/src/components/Dialog.svelte`.
**Reference:** `/lab/surfaces`. Dialog behaviour: [dialog behavior](../../../game/dialogs/spec.md).

#### Corner cuts

One corner language: every surface and control cuts its **top-left and bottom-right**
corners, as buttons do.

| Token           | Value | Use                            |
| --------------- | ----- | ------------------------------ |
| `--cut-size-sm` | 6px   | Small controls                 |
| `--cut-size-md` | 10px  | Buttons, the segmented control |
| `--cut-size-lg` | 16px  | Panels                         |
- `--button-cut-size` aliases `--cut-size-md`.
- `--radius-sm` (2px) is for text fields only. Circles (knobs, swatches) stay round.

#### Cut surfaces

`.cut-surface` (and `.panel`, which builds on it) draws its fill and edge behind its content, so a
fill can be translucent while the edge and shadow follow the cut:

- `::before` is the fill (`--_fill`), clipped to the cut shape.
- `::after` is the 1px edge (`--_edge`) and the shadow (`--_shadow`) outside the shape: it
  paints the shape, takes its drop shadow, then a clip with a hole removes everything inside the
  edge, so the shadow never shows through a translucent fill.
- The element is isolated (`isolation: isolate`) and unclipped, so the shadow can spill.
- Private properties: `--_cut`, `--_fill`, `--_edge`, `--_edge-width`, `--_shadow`.
  Defaults: `md`, glass, `--color-border`, 1px, no shadow.

#### Panels

| Class          | Fill                    | Edge             | Corners | Shadow                             | Use                                   |
| -------------- | ----------------------- | ---------------- | ------- | ---------------------------------- | ------------------------------------- |
| `.panel`       | `--panel-fill` (elev-2) | `--color-border` | `lg`    | `--panel-shadow` (0 8px 24px, 70%) | Game menus and dialogs; Design system page asides |
| `.panel--flat` | the same                | `--color-border` | `lg`    | none                               | Status messages on the live game      |
- Panels give game menus and dialogs the same surface treatment. The host
  owns content and arrangement; using a panel or scrim does not make a menu
  modal.
- The panel is elevation 2 on the console form: the instrument display's edge and shadow.
- Consumers: the title and Options menus, pause and run complete (`.flight-card` on the panel) and the flight
  status message (`.flight-message`, flat).
- In `DesignSystemLayout`, a plain authored `<aside>` that is a direct child of the
  main content container automatically gets the shared standard `.panel` treatment,
  including its fill, cut edge, shadow and padding. Authors supply only the aside
  and its content. The [Documents grid](../documents-grid/spec.md) owns placement:
  the treatment is the same in the wide gutter and the narrow source-order stack.
- Shell navigation and inspector rails retain their shell styling. Asides nested
  inside live examples retain their component's styling.

#### Scrim (the offline feed)

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
- `--scrim-surface` on the scrim layer over it: a darkened edge (30% black, from 55% out) and
  2px-on/2px-off scanlines in `--color-void` at 35%. An elevation-2 layer at 35% opacity uses
  `screen` blending to lift the feed into the surface family without tinting the panel. The lift
  tapers to 70% of its centre strength at the edges.
- Both ease in over `--duration-fast`; with reduced motion they appear at once.
- The panel is clean: scanlines belong to the feed, not to the pane in front of it.
- `--color-backdrop` (black at 11%) stays the dim behind a Lab overlay pane; game dialogs use
  the scrim.

#### Layers

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

### Constraints

- Surfaces and controls use token-defined top-left and bottom-right cuts.
- Shared UI layers take their ordering from layer tokens.
- Hosts own content and modality; surfaces own their fill and edge.

## Contract

### Definition of Done

- Cut fills, edges and shadows follow one geometry.
- Game panels and flat status messages use the specified shared treatments.
- Dialog and stage scrims compose independently of modality.
- `/lab/surfaces` demonstrates cut surfaces and layer order, and includes a direct
  authored `<aside>` showing the automatic standard panel treatment.

### Regression guardrails

- A translucent fill retains its exterior shadow without painting it through the content.
- Reduced motion removes scrim transitions.

### Scenarios

```gherkin
Scenario: Compose a translucent panel
  Given a panel over a visible stage
  When it renders
  Then its edge and shadow follow its cut outline
  And its shadow stays outside the panel interior

Scenario: Cover the stage without changing modality
  Given a screen composes a stage scrim and panel
  When the scrim is shown
  Then the stage receives the shared offline-feed treatment
  And the screen's interaction owner determines modality

Scenario: Render the canonical authored aside as a panel
  Given /lab/surfaces has a plain aside authored directly in DesignSystemLayout's main content
  When the document has room for three columns
  Then the aside sits in the gutter with the standard panel fill, cut edge, shadow and padding
  When the content container switches to the narrow stack at a supported Lab viewport width
  Then the aside keeps the same treatment in its source-order position

Scenario: Keep automatic panel styling inside the authored document
  Given a Design system page has shell navigation and inspector rails and a live example with a nested aside
  When the page renders
  Then the rails keep their shell styling
  And the nested aside keeps its component styling
```
