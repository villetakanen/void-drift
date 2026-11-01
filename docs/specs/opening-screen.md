# Opening screen and design-system foundations

**Status:** PLANNED. Nothing here is implemented yet.
**Source:** [opening screen audit](../audits/2026-11-01-opening-screen.md), owner decisions D1–D7 (2026-11-01).
**Supersedes on completion:** [menu-overlay.md](menu-overlay.md); the logo, font and token
sections of [design-system-core.md](design-system-core.md).

## Context

The opening screen is the player's first contact. Today it mixes three type stacks, an
unloaded logo font, lime on everything, a native ship dropdown, two competing primary
buttons, and a HUD that bleeds through the menu. This plan builds the missing design-system
primitives and recomposes the opening from them. Run-complete and pause screens also benefit,
because they share the panel, scrim and text roles.

## Target experience

1. On load, a ship-less star system shows at the whole-system zoom level. Planets move slowly
   along their orbits and the star radiates. There is no HUD and no engine pads.
2. A panel shows the ∅·Δ logomark, three ship cards (Scout / Fighter / Corvette) with real
   silhouettes, one Go button and a one-line control hint.
3. The last-used ship is preselected. Tapping or clicking a card selects it; Go starts the run.
   Keyboard: arrows or 1–3 select, Enter goes.
4. The header holds the logomark, a run tag, and nav: Builder, Scores, Settings.
5. On an iPhone in landscape (844×390) everything in step 2 fits below the header without
   scrolling. The headline and eyebrow appear only where there is room.

## Boundaries

- No new npm dependencies, webfonts or paid services. The logomark is a committed SVG.
- No changes to gravity, friction or ship tuning.
- Star systems are never static (owner, 2026-11-01). The fixed `CHALLENGE_SEED` (2026) is a
  bug, tracked and fixed separately; every run and every attract scene gets a fresh random seed.
  P7 depends on that fix.
- Stored ids `scout` / `balanced` / `tank`, saved builds, settings and score documents are unchanged.
- Real star-system variety (star types, generated planets, true moons) is generator work
  **outside this plan**. The attract scene uses what the simulation offers today:
  a random orbit phase from the seed.
- Design-system definitions change only with a Lab demonstration in the same change (design.md).

## Phases

Each phase is one bounded change that passes `pnpm verify` and is shown in the Lab and the game.

### P1 — Foundation tokens (T1, T2, T4, T5, T6, T8)

Files: `packages/core/src/lib/styles/tokens.css`, `apps/web/src/styles.css`,
`apps/web/src/layouts/{Layout,LabLayout,StudyLayout}.astro`, `apps/web/src/pages/index.astro`.

- Type roles: `--font-family-ui` (monospace), `--font-family-prose` (system sans),
  `--font-family-display` (= prose) with `--font-weight-display: 800`. Add the size steps
  `--font-size-{caption,label,body,lead,heading,display}`, matching line heights, and
  `--tracking-{eyebrow,wordmark,display}`.
- Colour roles: `--color-brand` (lime) with `--color-action` and `--color-selected` aliased to
  it. Add `--color-on-brand`, `--color-text-{muted,subtle}`, `--color-border-{subtle,strong}`,
  `--color-surface-{base,raised,glass}` and `--color-scrim`.
- Layers: `--layer-{scene,hud,controls,overlay,toast}`.
- Shape: `--cut-size-{sm,md}`; glow: `--glow-brand-{sm,md}`.
- Layout: `--gutter`, `--safe-{top,right,bottom,left}` from `env(safe-area-inset-*)`, and
  `--panel-width-{sm,md}`.
- Keep `--font-flight`, `--font-display`, `--font-small/body/large/title`, `--color-neon-*`,
  `--color-overlay`, `--color-flight-glass`, `--flight-border` and `--flight-glow` as aliases
  of the new tokens, with no hex literals in them.
- `body` uses `--font-family-ui`; `"Noto Sans Math"` is removed. `#000` literals become
  `--color-surface-base`; `theme-color` matches it.
- Add a global `.prose` class (70ch measure, 1.65 line height, heading rhythm) promoted from
  `StudyLayout`, and use it there.
- Lab: rebuild `/lab/typography` to show the three real families, every size step, text roles
  and `.prose`. Add `/lab/tokens` for colour roles (with contrast against surfaces), layers,
  shapes, glow and spacing.

Done when existing screens look unchanged except for the font fallback fix, and both Lab pages
render only from tokens.

### P2 — Logomark (E1)

Files: `apps/web/src/components/Logo.svelte`, a new committed SVG asset, `apps/web/public/favicon.svg`.

- Convert ∅ ⋅ Δ from Noto Sans Math to paths once, with no dependency added. Commit the SVG with a
  comment naming the source font, its OFL licence and how to redo the conversion.
- `Logo.svelte` renders the SVG inline with `role="img"` and the accessible name "Void Drift".
  It uses `fill: currentColor` (brand by default) and size steps sm/md/lg.
- Replace the `VOID·DRIFT` text in the flight header and the Lab nav rail with the logomark.
  Derive the favicon from the same paths.

Done when the mark renders identically regardless of installed fonts, and is shown in the Lab.

### P3 — Opening shell (E2, E3, E7, E9, E10)

Files: `packages/core/src/lib/styles/flight.css` (or new `panel.css` / `text.css`),
`apps/web/src/components/FlightDeck.svelte`.

- `.panel`: `--color-surface-glass`, `--color-border-subtle`, cut corners `--cut-size-md`.
  The menu, run-complete and pause screens all use it. Pause stops using the `inset: 40% 25%` banner.
- Global text roles `.eyebrow`, `.lead`, `.caption`, `.field-label` and `.tag`. They never use
  `--color-brand` (D6).
- `.nav-link` for header navigation: legible size, a 44px target and a brand colour on hover/focus.
  The header becomes logomark, run tag (`.tag`), then nav: **Builder**, Scores, Settings.
  The builder link leaves the card, and the version leaves its label.
- Modal behaviour: while a dialog is open, the HUD and engine pads are not rendered and the
  stage is `inert`. Focus moves to the first control in the dialog and returns when it closes.
  Z-order comes from `--layer-*`.
- The full-screen `--color-flight-glass` overlay is removed from MENU. The panel carries contrast.

Done when no HUD or engine pad is visible or focusable behind any dialog, at 1440×900 and
844×390.

### P4 — Ship launcher and names (E4, D4)

Files: `packages/mode-a/src/lib/config.ts`, `packages/mode-a/src/lib/schemas/loadout.ts`,
`apps/web/src/components/{FlightDeck,ShipBuilder,Leaderboard}.svelte`,
`apps/web/src/components/lab/LabShipInspector.svelte`, `docs/design.md`.

- One display-name source: Scout / Fighter / Corvette, plus a one-line trait per ship. Data
  stays in typed, Zod-parsed config. The `FlightDeck` override and the hand-written descriptions
  are removed. The builder, Lab inspector and leaderboard (which shows names, not ids) read
  from the same source.
- The ship launcher is a radio group of three cards. Each card has a canvas silhouette drawn by the
  production renderer, the name and the trait line. The selected card uses `--color-selected`
  and `--cut-size-sm` corners. The last-used `selectedShipId` is preselected and selection persists
  as now. Keyboard: arrows and 1–3 select; Enter triggers Go.
- One filled **Go** button starts the run with the selected ship. The `<select>`,
  "TAP TO START" and "Build your ship" are removed from the card.
- Fit: at 844×390 the logomark, cards, Go and hint fit in the space below the header without
  scrolling. The eyebrow and headline hide on short viewports by a named rule, not by
  `p:not(.eyebrow)`.
- Browser tests that click "TAP TO START" (`tests/browser/{alpha,control-default,local-session}.spec.ts`,
  `tests/firebase/competition.spec.ts`) move to select-ship + Go. Add a keyboard-only start test
  and a phone-landscape no-scroll test.

### P5 — Resource meter (E8, T3)

- A meter with label, value, unit and a bar coloured by `--color-resource-*`. Hull and power are
  distinct. Capacity above the base reads as an absolute value or a segmented bar, never `200%`.
- Shown in `/lab/resources` and used by the flight HUD.

### P6 — Control hint (E6)

- `.kbd` key caps and a touch variant ("Hold both pads to thrust · one to turn"). The device
  variant is chosen by `(pointer: coarse)` / `(hover: none)`.
- The hint stays visible on phones. Its text matches the actual control mapping, including
  inverted-controls defaults.

### P7 — Attract scene and motion (E12, E11, T7)

Files: `packages/mode-a/src/lib/simulation.ts` (preview mode), `FlightDeck.svelte`,
`packages/core` renderer and camera, and `docs/architecture.md` if the simulation surface changes.

- A menu-only preview: no ship, no input, no scoring and no death. Planets advance at a reduced
  time scale and the star's radiance animates. The camera is fixed at zoom level 1 (whole system).
  The seed is random per visit. When Go is pressed, the run starts in a new random system. The attract
  scene is a preview of what a system looks like, not of the run's system.
- Motion tokens `--duration-{fast,base,slow}` and `--ease-{enter,exit}`. On Go, the panel exits,
  then a short ready beat runs before the survival clock starts.
- Under `prefers-reduced-motion`, the preview shows a still frame and the transition is instant.
- Performance: hold 60 FPS on the reference laptop. Report device and scenario.

### P8 — Lab reference, docs and evidence

- `/lab/opening` composes the real opening with a fixed seed, at 1440×900 and 844×390, showing
  each card selected. It is the visual baseline for review. Baselines are reviewed, never refreshed silently.
- `design.md` records D1–D7 under a new opening-screen section. `menu-overlay.md` and the stale
  sections of `design-system-core.md` are marked `[DEPRECATED 2026-11-01]` and point here.
- The human experience review covers feel separately: attract-scene pace, readability over the
  scene, ship card clarity, and Go on a real phone.

## Contract

### Definition of Done

- [ ] No `"Noto Sans Math"` reference remains in runtime CSS; the logomark renders from SVG.
- [ ] Opening-screen CSS uses only tokens; no hex, rgba or z-index literals in the touched files.
- [ ] `--color-brand` appears only through brand, action and selected roles. Eyebrows, tags and
  descriptions use text roles.
- [ ] MENU shows no HUD, engine pads or ship. Nothing behind the dialog is focusable.
- [ ] Ship names read Scout / Fighter / Corvette in the opening, builder, Lab inspector and
  leaderboard; stored ids are unchanged.
- [ ] Select + Go works by mouse, touch and keyboard. The last-used ship is preselected.
- [ ] At 844×390 the opening needs no scrolling, and every target is at least 44px.
- [ ] Reduced motion gives a still attract scene and an instant start.
- [ ] `/lab/tokens`, the rebuilt `/lab/typography` and `/lab/opening` exist and use production components.
- [ ] `pnpm verify` passes; skipped or unavailable stages are reported as such.

### Regression guardrails

- No code path produces a fixed star system. The attract scene never writes scores or settings.
- Existing settings, saved builds and Firestore score documents parse without migration.
- Engine touch controls keep simultaneous multi-touch, cancel and lost-focus handling.

### Scenarios

```gherkin
Scenario: Start a run from the opening
  Given a returning player whose last ship was Corvette
  When the opening loads
  Then a ship-less star system animates at whole-system zoom
  And the Corvette card is selected
  When the player selects Scout and activates Go
  Then the run starts with Scout and the HUD appears

Scenario: Keyboard-only start
  Given the opening has loaded
  When the player presses 1 then Enter
  Then the run starts with Scout

Scenario: Phone landscape fit
  Given an 844×390 touch viewport
  When the opening loads
  Then the logomark, three ship cards, Go and the touch hint are visible without scrolling

Scenario: Dialog isolation
  Given the opening dialog is open
  When the player presses Tab repeatedly
  Then focus never reaches the HUD, the engine pads or the canvas

Scenario: Reduced motion
  Given prefers-reduced-motion is set
  When the opening loads and the player activates Go
  Then the backdrop is still and the run starts without transition
```

## Open questions

- **Corvette art name.** design.md and `cruiser.ts` say "Heavy cruiser silhouette". P4 renames
  the displayed ship only; renaming code identifiers is optional cleanup.
