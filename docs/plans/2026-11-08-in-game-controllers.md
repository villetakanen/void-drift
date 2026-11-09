# In-game controllers: gutters, camera box and thrust pads

Plan from the accepted
[in-game controllers study](../../apps/web/src/pages/lab/studies/in-game-controllers.astro),
agreed in conversation on 8 November 2026. Status: S1–S5 done; S6 open.

## Decisions (2026-11-08)

- **The stage fills the viewport at any aspect ratio of 4:3 or wider,** ultra-wide
  included. There is no 16:9 upper clamp and no letterboxing. The logical height
  stays 1080; the logical width follows the viewport.
- **Below 4:3 flight pauses** and shows the rotate gate (tilt to continue). This
  replaces today's `width <= height` portrait test.
- **Gutters are fixed CSS pixels:** 180 px at each side, 48 px at top and bottom.
  The active camera box is `(width − 360) × (height − 96)` CSS px, centred.
- **Only the pad boxes in the side gutters take thrust touches.** The central
  fly area does not thrust.
- **Phones are out of scope for now.** No phone-specific sizing, fly-width or
  safe-area work in these slices; landscape phone keeps working as it does.
- From the study: corner-nested `F` pad at 84% gutter width and 54% height,
  disjoint borderless panes, 22% / 36% resting `--color-elev-3`, 9% / 16% active
  `--color-selected`, white labels 72 CSS px from the screen edge. No
  `docs/design.md` change.

## Spec updates

Every slice that touches a spec (S1, S2, S3, S6) first polishes the spec's
intent part (Blueprint: context, boundaries, rules) and prunes it with a human
in conversation. The Contract and the implementation follow only after that
review.

## Slices

### S1. Screen geometry (web, small)

- `apps/web/src/lib/game-screen.ts`: logical width from the viewport ratio,
  clamped at 4:3 only; gutters converted from CSS px to logical units each
  resize; expose the active rectangle in both units and a below-4:3 flag.
- `FlightDeck.svelte`: the orientation gate uses the below-4:3 flag.
- Rewrite the stage, gutter, gate, Definition of Done and scenario text in
  `docs/specs/game/game-screen/spec.md`, keeping its Blueprint / Contract form.
  Restate boundaries as current rules, without delta wording ("a separate camera
  change", "adds no separate top/bottom gutter"). Move the trailing
  "Standard-Sun field HUD — 2026-11-07" section's content into the
  [star spec](../specs/game/world/star/spec.md) and remove it here.
- Checks: the active rectangle is the viewport less the gutters at 4:3, 16:9 and
  ultra-wide; a 4:3-minus ratio blocks flight and clears input.

### S2. Camera fits the active box (core and web, small; needs S1)

- The production camera fits ship and star inside the active rectangle; the
  render surface stays full size and centred on the same point.
- Rewrite `docs/specs/game/camera/spec.md` as a living spec (Blueprint /
  Contract): drop the historical header, code samples, status lines, "Future
  Enhancements" and the strict-16:9 "Viewport Container" section; bring in the
  stepped-zoom behaviour now written in `docs/specs/game/spec.md`. Fold
  `docs/specs/game/camera/viewport.md` into it and remove that file.
- Ultra-wide showing more of the arena at the same zoom is acceptable for
  leaderboard runs (decided 2026-11-08), provided the starfield background is
  visible across the whole stage at every width. The camera spec states that
  rule instead of the old ultra-wide prevention.
- The unmerged `claude/camera-trial-2-49384a` branch uses a 220 / 64 logical px
  box; if that trial is ever adopted, it consumes this box instead.
- Checks: the framed subjects stay inside the active rectangle across ratios;
  replays and scoring are unchanged.

### S3. Input zones (core, small)

- `packages/core/src/lib/entities/Input.ts`: pointer zones `L`, `R`, `F`
  (either side's `F` fires both engines, as `W` / `↑` do); per-pad active flags
  for the upper turn pads and the lower burn pads; remove the canvas half-split.
- Rewrite `docs/specs/game/controls/spec.md` as the current contract (the file
  is a 2024 historical document).
- Checks: `L`, `R`, `F`, `F + L`, two simultaneous pointers, inversion, and reset
  on release, cancel, lost capture, blur and pause.

### S4. Thrust pad component and Lab page (core styles and web, medium; needs S3 zone names)

- Pad colour tokens in `packages/core/src/lib/styles/tokens.css`, named for the
  pad (for example `--color-pad-rest`, `--color-pad-active`), not "glass":
  `--color-glass` already means the void overlay.
- Shared `ThrustFlapPair` component: SVG panes, labels, and a full-width
  touch area per gutter split on the 30° seam.
- Demonstrate it on `/lab/inputs` with every pad state.

### S5. FlightDeck wiring (web, medium; needs S1, S3, S4)

- Replace the bottom `.engine` buttons with `ThrustFlapPair` in both side
  gutters.
- Move Pause, the mode label and engine feedback out of the bottom bar into the
  top/bottom gutters or the HUD, clear of the pads.
- Checks: browser tests for pad highlighting and hit-testing across the gutter,
  keyboard play unchanged, no touch thrust from the fly area.
- Decided 2026-11-09: the Pause and Weapons deck buttons above the pads are
  placeholders, as the bottom engine buttons were before the pads; their final
  design needs its own study.

### S6. Game spec as a living spec (docs, small; after S2 and S3)

- Rewrite `docs/specs/game/spec.md` from its dated and patch-numbered sections
  into the current contract (Blueprint / Contract): no status line, "supersedes"
  wording or pending human review. Behaviour owned by child specs (camera,
  controls, game screen) is linked, not repeated.

## Order

S1, S3 and S4 can run in parallel. S2 follows S1; S5 follows S1–S4; S6 follows
S2 and S3, whose rewrites take over parts of it.
