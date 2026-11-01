# Opening screen and design-system remediation plan

**Status:** PLANNED. Nothing here is implemented yet.
**Source:** [opening screen audit](../audits/2026-11-01-opening-screen.md), owner decisions D1–D7 (2026-11-01).

## Context

The audit started at the opening screen, but most of its findings are application-wide
design-system gaps. Examples: fonts are declared in 12 shared files and 4 canvas renderers;
lime is used 46 times outside preserved studies; there are 33 hex literals in shared UI and 8 `z-index`
literals; and the Lab's own typography page shows a font that never loads. Fixing these only on the
opening screen would leave the rest of the app inconsistent and the Lab misleading.

So this plan is organised **by concern, not by screen.** Each slice takes one concern through
the whole system, and the opening screen is composed from the results at the end.

## How every slice works

Each slice is complete only when all five steps are done:

1. **Investigate.** Find how the concern is defined, loaded and used across `apps/web`,
   `packages/core` and `packages/mode-a`, including canvas renderers. Record the inventory in
   the slice's commit or spec.
2. **Spec.** Update the spec that owns the concern (named per slice) to state the rule as
   implemented, and mark stale text `[DEPRECATED 2026-11-01]`.
3. **Lab.** The canonical Lab page shows the rule using production code.
4. **Apply everywhere.** Migrate every shared consumer: game, builder, leaderboard, settings,
   Lab shell, study shell, and canvas. Preserved study pages under `components/studies/` and
   `pages/lab/studies/` are decision records and keep their local values; only the shared
   `StudyLayout` shell migrates.
5. **Verify.** `pnpm verify` passes, with skipped or unavailable stages reported. Show browser
   evidence at 1440×900 and 844×390 for affected screens, and list what still needs human review.

A slice may take several commits, but each commit leaves the app working. Slices are done in order
unless marked independent.

## Slices

### S1 — Fonts (D2, D1 font part)

- Investigate: CSS `font-family`/`font` declarations, the `--font-*` tokens, `body` in
  `styles.css`, layouts, and canvas `ctx.font` (`build-renderer.ts`, `resource-bar.ts`, Lab
  inspectors). Confirm that nothing loads Noto Sans Math.
- Spec: `design-system-core.md` (type section rewritten). Roles: `ui` = monospace for all game and
  interface text; `prose` = system sans-serif for studies, help and docs; `display` = the prose family
  at weight 800. Add size steps, line heights and tracking tokens, plus a global `.prose` class
  promoted from `StudyLayout`. No webfonts.
- Lab: rebuild `/lab/typography` to show the three roles, every size step and `.prose`.
- Apply: replace every literal family with a role token, including canvas fonts through a
  shared TS constant. Remove `"Noto Sans Math"` from runtime CSS. Keep the old `--font-*` names as
  aliases until their last consumer moves.

### S2 — Logomark (D1)

- Investigate: `Logo.svelte`, the `VOID·DRIFT` text wordmarks, the favicon, the Lab nav rail and page titles.
- Spec: `design-system-core.md` (identity section).
- Lab: a logomark section with size steps on the brand colour and on surfaces.
- Apply: convert ∅ ⋅ Δ from Noto Sans Math once into committed SVG paths, with a source and OFL note
  and no dependency. Use it in `Logo.svelte` (`role="img"`, name "Void Drift", `currentColor`), every
  header, the Lab nav rail and the favicon.

### S3 — Colour roles (D6)

- Investigate: uses of `--color-acid-lime` / `--color-neon-*`, hex literals in shared UI,
  `--color-overlay` vs `--color-flight-glass`, `#000` page backgrounds and `theme-color`.
- Spec: `design-system-core.md` (colour section). `--color-brand` is the single lime, with
  `--color-action` and `--color-selected` aliased to it. Add text, border, surface and scrim roles.
  Informational text never uses brand.
- Lab: `/lab/tokens` colour roles with contrast against each surface.
- Apply: every shared consumer names a role. Eyebrows, tags and descriptions move off lime. Builder
  slot occupancy uses `--color-selected`. Hex literals leave shared UI; `neon-*` becomes an alias.

### S4 — Ship names (D4)

- Investigate: `config.ts`, `loadout.ts`, `FlightDeck`, `ShipBuilder`, `Leaderboard`,
  `LabShipInspector`, design.md and other specs.
- Spec: `ship-builder.md` and `ship-select-ui-persistence.md` (names), design.md headings.
- Apply: one Zod-parsed display-name and trait source: Scout / Fighter / Corvette. Ids
  `scout`/`balanced`/`tank` are unchanged. The leaderboard shows names. Hand-written descriptions
  and the `balanced → Fighter` override are removed.

### S5 — Random star system every run (bug fix; independent of S1–S4)

- Investigate: `CHALLENGE_SEED` and its users, the `CHALLENGE` name, and tests and baselines relying
  on seed 2026.
- Spec: `playable-alpha.md` and `architecture.md`. Drop the "seed 2026, G-class" ranked rule and fix
  the `gravity-1`/`ion-1` drift. The owner rules that static systems are a bug.
- Apply: every game run (start and Try Again) gets a fresh random seed. Lab trials, `?trial=` URLs and
  fixed replays keep explicit seeds. Tests pass explicit seeds without weakening assertions.
  Score, rule and saved-data compatibility is kept. No gravity/friction changes.

### S6 — Surfaces, layers and dialogs

- Investigate: overlays, banners, toasts and `z-index` literals across the game, builder and Lab;
  dialog focus handling.
- Spec: `design-system-core.md` (surfaces and layers) and a new `docs/specs/dialogs.md`.
- Lab: panel variants, the layer scale and dialog behaviour.
- Apply: `--layer-*` scale; `.panel` (glass surface, border, `--cut-size-*` corners) for menu,
  run-complete and pause. Dialogs make the stage `inert`, hide HUD and engine pads, move focus in and
  return it on close. One corner language: engine pads move from the 12px radius to cut corners.

### S7 — Text roles, tags and navigation

- Spec: `design-system-core.md`.
- Lab: text roles, `.tag` and `.nav-link`.
- Apply: global `.eyebrow`, `.lead`, `.caption`, `.field-label` and `.tag` replace local
  equivalents. Headers use `.nav-link`, with Builder joining Scores and Settings. The version
  leaves button labels.

### S8 — Resource meter

- Spec: an update to the existing resource/HUD spec, or a new `docs/specs/resource-meter.md`.
- Lab: `/lab/resources` uses the production meter.
- Apply: the HUD and the canvas `resource-bar.ts` share one meter definition. Hull and power use
  distinct resource colours. Capacity above base never shows as `200%`.

### S9 — Control hints

- Spec: `controls-system.md`.
- Lab: key caps and touch hint.
- Apply: `.kbd` and a touch variant chosen by `(pointer: coarse)`. The text matches actual mappings,
  including inverted-controls defaults. Hints are never hidden on phones.

### S10 — Ship launcher (D3, D7)

- Spec: `ship-select-and-camera-zoom-v0.4.0.md` / `ship-select-ui-persistence.md`, updated.
- Lab: `/lab/ship-launcher` at 1440×900 and 844×390 with each ship selected.
- Apply: a radio group of three cards (production silhouette, S4 name, trait) plus one filled Go.
  The last-used ship is preselected; arrows and 1–3 select; Enter is Go. Browser tests move from "TAP TO
  START" to select + Go; add keyboard-only and phone no-scroll tests.

### S11 — Attract scene and motion (D5; requires S5)

- Spec: `camera-system.md` and `architecture.md` for the menu preview mode; `design-system-core.md`
  for motion tokens.
- Lab: the preview at a fixed seed for evidence.
- Apply: ship-less, input-less, non-scoring preview at zoom level 1 with slow orbits and a radiating
  star; random seed per visit. Motion tokens; the panel exits, then a ready beat before the clock runs.
  Reduced motion gives a still frame and an instant start. Report 60 FPS on the reference laptop.

### S12 — Opening screen composition

- Spec: this file shrinks to the composition contract below. `menu-overlay.md` is marked deprecated.
- Lab: `/lab/opening` composes the real opening with a fixed seed as the reviewed visual baseline.
- Apply: `FlightDeck` MENU becomes logomark, ship launcher, Go and control hint in a panel over the
  attract scene. The dropdown, "TAP TO START" and the in-card builder button are removed.
- Human review: attract-scene pace, readability over the scene, ship card clarity, Go on a real phone.

## Target opening experience (S12 contract)

1. On load, a ship-less random star system shows at whole-system zoom. Planets move slowly and the
   star radiates. There is no HUD and no engine pads.
2. A panel shows the ∅·Δ logomark, three ship cards (Scout / Fighter / Corvette) with real
   silhouettes, one Go button and a one-line control hint.
3. The last-used ship is preselected. Tapping a card selects it; Go starts the run in a new random
   system. Keyboard: arrows or 1–3 select, Enter goes.
4. The header holds the logomark, a run tag, and nav: Builder, Scores, Settings.
5. At 844×390 everything in step 2 fits below the header without scrolling. The headline and eyebrow
   appear only where there is room.

## Boundaries

- No new npm dependencies, webfonts or paid services.
- No changes to gravity, friction or ship tuning.
- Star systems are never static (owner, 2026-11-01).
- Stored ids, saved builds, settings and score documents stay compatible.
- Real system variety (star types, generated planets, true moons) is generator work outside this plan.

## Contract

### Definition of Done

- [ ] Every slice's owning spec describes the implemented rule; stale text is marked deprecated.
- [ ] `/lab/typography`, `/lab/tokens`, `/lab/ship-launcher` and `/lab/opening` render from production code.
- [ ] No literal font family, brand hex or `z-index` remains in shared UI or shared canvas renderers.
- [ ] Each game run and each attract scene uses a fresh random seed; Lab trial seeds still reproduce.
- [ ] Ship names read Scout / Fighter / Corvette everywhere; stored ids are unchanged.
- [ ] Dialogs isolate the stage on every screen that has them.
- [ ] The S12 contract holds at 1440×900 and 844×390, with reduced motion respected.
- [ ] `pnpm verify` passes; skipped or unavailable stages are reported as such.

### Scenarios

```gherkin
Scenario: Start a run from the opening
  Given a returning player whose last ship was Corvette
  When the opening loads
  Then a ship-less star system animates at whole-system zoom
  And the Corvette card is selected
  When the player selects Scout and activates Go
  Then the run starts with Scout and the HUD appears

Scenario: Every run is a new system
  Given a player finishes a run
  When they choose Try Again
  Then the new run starts with a different seed than the previous run

Scenario: Keyboard-only start
  Given the opening has loaded
  When the player presses 1 then Enter
  Then the run starts with Scout

Scenario: Phone landscape fit
  Given an 844×390 touch viewport
  When the opening loads
  Then the logomark, three ship cards, Go and the touch hint are visible without scrolling

Scenario: Dialog isolation
  Given any dialog is open
  When the player presses Tab repeatedly
  Then focus never reaches the HUD, the engine pads or the canvas

Scenario: Prose stays readable
  Given a design study page
  When it renders
  Then body text uses the prose role, not monospace
```

## Open questions

- **Corvette code names.** `cruiser.ts` and the "Heavy cruiser silhouette" heading predate D4.
  S4 renames displayed names only; renaming code identifiers is optional cleanup.
