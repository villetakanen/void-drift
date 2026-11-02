# Opening screen and design-system remediation plan

**Status:** IN PROGRESS. S1 done and owner-approved 2026-11-01; S2 done and owner-approved
2026-11-01; S3 done and owner-approved 2026-11-01; S4 done and owner-approved 2026-11-02;
S5 moved out to the [random star systems plan](../plans/random-star-systems.md)
(owner, 2026-11-02); S6 done and owner-approved 2026-11-02; the menu panel and ship selector
were delivered early by an owner-led spike on 2026-11-02 (0.4.8, see
[Spike — title menu](#spike--title-menu-and-ship-selector)); S7–S12 planned for what remains.
**Scope note (owner, 2026-11-01):** phone landscape is temporarily out of scope. 844×390 checks
are not required until it returns; D7 and the S12 phone contract stay as targets.
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

**Done 2026-11-01, owner-approved.** B612 Mono (ui) and Noto Sans (prose; display at 800 with
0.03em tracking) are self-hosted. Owner decisions: preserved studies follow the aliases and render
B612 Mono; ui text that requests weight 500 renders at 400. Verification: 7 of 9 `pnpm verify`
stages passed; `test:rules` and `test:competition` did not run (no Java runtime on the machine).

- Investigate: CSS `font-family`/`font` declarations, the `--font-*` tokens, `body` in
  `styles.css`, layouts, and canvas `ctx.font` (`build-renderer.ts`, `resource-bar.ts`, Lab
  inspectors). Confirm that nothing loads Noto Sans Math.
- Spec: `design-system-core.md` (type section rewritten). Roles: `ui` = B612 Mono for all game and
  interface text; `prose` = Noto Sans for studies, help and docs; `display` = the prose family
  at weight 800. Add size steps, line heights and tracking tokens, plus a global `.prose` class
  promoted from `StudyLayout`. ~~No webfonts.~~ [DEPRECATED 2026-11-01] B612 Mono and Noto Sans are
  self-hosted with OFL licences (D2 as amended).
- Lab: rebuild `/lab/typography` to show the three roles, every size step and `.prose`.
- Apply: replace every literal family with a role token, including canvas fonts through a
  shared TS constant. Remove `"Noto Sans Math"` from runtime CSS. Keep the old `--font-*` names as
  aliases until their last consumer moves.

### S2 — Logomark (D1)

**Done 2026-11-01, owner-approved.** Verification: 7 of 9 `pnpm verify` stages passed;
`test:rules` and `test:competition` did not run (no Java runtime on the machine). The rule is in `design-system-core.md`
(Identity). Inventory: `Logo.svelte` drew text glyphs in fallback fonts and appeared only in the Lab
rail; game, builder and scores headers used a `VOID·DRIFT` text wordmark; Settings had no mark;
the favicon was the Astro starter icon; Lab titles read "Void·Drift". No canvas draws the brand.

- Investigate: `Logo.svelte`, the `VOID·DRIFT` text wordmarks, the favicon, the Lab nav rail and page titles.
- Spec: `design-system-core.md` (identity section).
- Lab: a logomark section with size steps on the brand colour and on surfaces.
- Apply: convert ∅ ⋅ Δ from Noto Sans Math once into committed SVG paths, with a source and OFL note
  and no dependency. Use it in `Logo.svelte` (`role="img"`, name "Void Drift", `currentColor`), every
  header, the Lab nav rail and the favicon.

### S3 — Colour roles (D6)

**Done 2026-11-01, owner-approved.** The rule is in `design-system-core.md` (Colour);
`/lab/tokens` shows every role with contrast measured against each surface. Owner decisions: every
colour token is written in `lch()`; the brand lime is `#eeff41` (the token since PBI-022), not the
older `#d4ff00`; the elevation steps and `--color-backdrop` from the Lab instrument are the surface
and scrim roles. Verification: 6 of 9 `pnpm verify` stages passed; `test:browser` could not start
because another checkout's dev server held port 4322, and the same 25 browser tests passed on port
4342; `test:rules` and `test:competition` did not run (no Java runtime on the machine).

Inventory: 45 lime/neon uses outside preserved studies (brand 6, action 15, selected 7, text 15,
border 1, game data 1 for the HUD bars); about 40 hex/rgb literals in shared CSS; a second lime,
`#d4ff00`, in 7 hard-coded places (builder canvas, death icon, Lab nav and resources, the Lab planet
ring, the Balanced ship tint); `--color-overlay` (0.9) had no shared consumer and duplicated
`--color-flight-glass` (0.91); `#000` backgrounds on the page, the stage canvas and `theme-color`
against the `#050510` void elsewhere; and a Lab planet ring set to `var(...)`, which canvas ignores.

- Investigate: uses of `--color-acid-lime` / `--color-neon-*`, hex literals in shared UI,
  `--color-overlay` vs `--color-flight-glass`, `#000` page backgrounds and `theme-color`.
- Spec: `design-system-core.md` (colour section). `--color-brand` is the single lime, with
  `--color-action` and `--color-selected` aliased to it. Add text, border, surface and scrim roles.
  Informational text never uses brand.
- Lab: `/lab/tokens` colour roles with contrast against each surface.
- Apply: every shared consumer names a role. Eyebrows, tags and descriptions move off lime. Builder
  slot occupancy uses `--color-selected`. Hex literals leave shared UI; `neon-*` becomes an alias.

### S4 — Ship names (D4)

**Done 2026-11-02, owner-approved.** The rule is in `ship-builder.md` (Ship names and ids).
`SHIP_IDENTITY` in `@void-drift/mode-a` is the single Zod-parsed source of each ship's short name,
long name and trait; `/lab/entities/ship` shows all three. Owner decisions (2026-11-02): every ship
has a short and a long name; the short name is the id, and `balanced` and `tank` are retired; saved
data is purged rather than migrated (alpha). Names: Wasp / LHI Wasp, Scout / Daehan Scout No.7,
Fighter / Aegis XF-1 Interceptor, Corvette / Mark II Escort Frigate. Verification at `1bbeef8`: 7 of 9 `pnpm verify` stages
passed (25 browser tests); `test:rules` and `test:competition` did not run (no Java runtime on the
machine), so the new Firestore rule ids and the leaderboard name assertion are unverified. Browser
evidence at 1440×900 is in `artifacts/evidence/s4/` (git-ignored); the local leaderboard has no Firebase, so it
shows its unavailable state, not names.
Released as 0.4.6 on 2026-11-02: merge `894818e` on `feat/0-4-0` (verify `2026-11-02T06-49-15.877Z-Qfbz5q`:
7 of 9 stages, `test:rules` and `test:competition` not run for lack of Java) was pushed and deployed
(`firebase deploy --only firestore,hosting`, project `void-drift-alpha`). On
`https://void-drift-alpha.web.app`: the menu showed 0.4.6, short-name options and the Fighter's long
name and trait; the builder showed short-name buttons and the "Aegis XF-1 Interceptor" heading; the
Lab inspector showed the Identity group; the leaderboard loaded and showed "Scout" in the Ship column.
Old scores with retired ids are skipped by the leaderboard rather than deleted.

Inventory: two disagreeing name sources: `SHIP_PROFILES.name` (LHI Wasp / Scout / Balanced /
Tank; the Lab inspector and flight menu) and `CHASSIS.name` (LHI Wasp / Scout / Fighter / Heavy
Corvette; the builder). The flight menu overrode `balanced` to "Fighter" outside the Lab, and its
trait lines were hand-written. The leaderboard showed raw ids. A Lab instrument-parts legend
hard-coded "Heavy corvette". Two preserved studies read production chassis names; they now keep
the names they showed as local literals. Browser tests asserted "Heavy Corvette". Ids were stored
in builds (`void-drift-builds-v2`), settings, Firestore rules and score document ids.

- Investigate: `config.ts`, `loadout.ts`, `FlightDeck`, `ShipBuilder`, `Leaderboard`,
  `LabShipInspector`, design.md and other specs.
- Spec: `ship-builder.md` and `ship-select-ui-persistence.md` (names), design.md headings.
- Apply: one Zod-parsed display-name and trait source: Scout / Fighter / Corvette. ~~Ids
  `scout`/`balanced`/`tank` are unchanged.~~ [DEPRECATED 2026-11-01] Ids equal short names: `wasp`, `scout`,
  `fighter`, `corvette` (owner, 2026-11-02). The leaderboard shows names. Hand-written descriptions
  and the `balanced → Fighter` override are removed.

### S5 — Moved out

Random star systems for game runs are world-generation work, not opening-screen work. They now live
in the [random star systems plan](../plans/random-star-systems.md) (owner, 2026-11-02).

### S6 — Surfaces, layers and dialogs

**Done 2026-11-02, owner-approved.** The rules are in `design-system-core.md` (Surfaces
and layers) and the new `dialogs.md`; `/lab/surfaces` shows the cut scale, `.panel` and
`.panel--flat`, the layer scale read from production CSS, and a live dialog on the real
`Dialog.svelte`. Owner decisions (2026-11-02): the scrim is an _offline feed_: a 27% hue shift toward
290 (`mix-blend-mode: hue`, so colours keep their saturation), a light dim, a 2px blur, scanlines
in the void colour at 35% and a darkened edge. The first version (grayscale under a dark overlay)
was too black, and a `color` blend desaturated instead of shifting hue (owner review). The panel
is opaque elevation 2 on the console form (the display's cut edge and drop shadow), chosen over
a frosted translucent shade; only the stage is inert, so the header and Lab inspector
stay usable and dialogs drop `aria-modal`; pause becomes a dialog; Settings groups only fix their
border role. Verification at `5ca350f`, in a clean worktree: `pnpm verify` itself crashed before any stage
(its fingerprint reads the `.claude/skills` symlink added in `d72f127`; a fix is in uncommitted
work from another session), so its stages were run one by one: 7 of 9 passed (27 browser tests,
2 new); `lint` failed only on this file's formatting, fixed in the commit recording approval;
`test:rules` and `test:competition` did not run (no Java runtime). Browser evidence at 1440×900 is in `artifacts/evidence/s6/` (git-ignored).

Released as 0.4.7 on 2026-11-02: `9669a7d` on `feat/0-4-0` (verify `2026-11-02T10-03-03.588Z-PSecRS`
at `e4a890b`, run as one command now that the verify fix is in: 7 of 9 stages, 27 browser tests;
`test:rules` and `test:competition` not run for lack of Java) was pushed, built in a clean worktree
and deployed (`firebase deploy --only firestore,hosting`, project `void-drift-alpha`; no rules
changes since 0.4.6). On `https://void-drift-alpha.web.app`: the header showed 0.4.7; the menu
opened as a dialog with focus on Start and the stage inert; Escape during a run opened Paused with
focus on Resume; Lab run complete showed the scrim and panel; the leaderboard loaded scores;
`/lab/surfaces` and the in-game controllers study rendered. No page errors. Evidence is in
`artifacts/evidence/release-0.4.7/` (git-ignored).

Inventory: menu and run complete were full-stage `--color-glass` overlays (`z-index: 2`) marked
`aria-modal` with no surface on the card; pause was an unlabelled glass banner; the toast was
elev-1 at `z-index: 5`; engine pads used `--flight-radius: 12px`; Settings groups had a muted-text
border. 7 `z-index` literals in shared UI (the audit counted 8): `buttons.css` 1, -1, -1;
`flight.css` 2, 5; the builder footer 2; the Lab overlay pane 1. Keyboard-only: no dialog took focus
on open, Tab reached both engine pads from every dialog, Escape did nothing on the menu or run
complete, resuming left focus on the right engine pad, nothing was `inert`, and the HUD and pads
stayed visible. Radii: `--radius-sm` on fields, Settings and Lab nav; 4px, 2px and 6px literals in
Lab panes. The Lab overlay pane already moved focus and closed on Escape; it stays a disclosure.

- Investigate: overlays, banners, toasts and `z-index` literals across the game, builder and Lab;
  dialog focus handling.
- Spec: `design-system-core.md` (surfaces and layers) and a new `docs/specs/dialogs.md`.
- Lab: panel variants, the layer scale and dialog behaviour.
- Apply: `--layer-*` scale; `.panel` (glass surface, border, `--cut-size-*` corners) for menu,
  run-complete and pause. Dialogs make the stage `inert`, hide HUD and engine pads, move focus in and
  return it on close. One corner language: engine pads move from the 12px radius to cut corners.

### Spike — Title menu and ship selector

**Done 2026-11-02, owner-approved; released as 0.4.8.** The owner reworked the game menu live,
directly in `FlightDeck.svelte`, and documented it afterwards. It delivers the S12 panel and the
S10 selector in a different form from the one planned below, and part of S7's navigation.
**Source of truth:** `apps/web/src/components/FlightDeck.svelte` (MENU dialog, header nav),
`packages/core/src/lib/styles/flight.css` (`.title-frame`, `.ship-select`), the design-system
`apps/web/src/components/inputs/Toggle.svelte`.

The menu panel, top to bottom:

1. The ∅·Δ logomark at `sm` in the brand colour, then **VOID DRIFT** in the display role.
2. **SELECT YOUR SHIP** (eyebrow), then the design-system `Toggle` numbered `01 | 02 | 03 | 04`.
   Launcher order: 01 Scout, 02 Wasp, 03 Fighter, 04 Corvette. Clicking or tapping a part, arrow
   keys inside the toggle, or keys 1–4 anywhere on the menu (except while typing in a field) select
   a ship. Selection is immediate; there is no confirm step.
3. The selected ship's short name in display caps, then the ship drawn by the production
   `drawBuild` at 2× (scale 3.2 on a 480×340 canvas shown at 240×170), from the loadout that flies.
4. Small and secondary: the long name, then an equipment line counted from that loadout, for
   example "Equipped: 5× Light ion · 2× Energy storage". It replaces the hand-written trait in the
   menu; the Lab's flight menu shows the same line.
5. **PRESS START**, the only filled button. It takes focus when the menu opens.
6. The web package version, small and muted.

Owner decisions (2026-11-02):

- One primary button. "Build your ship · version" leaves the panel; the builder moves to the
  header nav.
- Wording follows old arcade and pinball machines: PRESS START replaces TAP TO START.
- The eyebrow ("KEEP THE ENGINES ALIVE"), headline ("Dance with gravity."), rules paragraph and
  keyboard hint are removed from the menu. The owner judged them unneeded.
- The Wasp is a launcher ship (02). This reverses the earlier decision that the launcher had
  three ships.
- The switch is the existing design-system `Toggle`, not a new control.
- Header nav: **HANGAR** (`/builder`), **HIGH SCORES**, **OPTIONS**, in caps; the Lab's link
  reads **PLAY**. The builder header reads `HANGAR / <version>` (was `SHIPYARD`), and the settings
  page heading reads "Options". The owner considers the header itself poor design, but removing it
  was out of scope.

Inventory before the spike: an eyebrow, headline and two-line rules paragraph; a native
`<select>` labelled "Ship Chassis" listing four ships in profile order; a long-name/trait line;
two filled buttons with the version-stamped builder link first; TAP TO START; and a fixed
keyboard hint that ignored the invert-controls setting.

Known gaps:

- The toggle's options are named only "01"–"04" for assistive technology: `Toggle` has no
  per-option label. The group is named "SELECT YOUR SHIP" and the visible ship name changes
  with the selection.
- The game menu always opens on Fighter (03); only the flight Lab restores the last ship
  (S12 contract item 3 is still a target).
- The ship on the stage still shows through the scrim beside the panel.
- At 2× the Corvette's nose nearly reaches its name.

Release evidence: see the 0.4.8 note below.

### S7 — Text roles, tags and navigation

- Spec: `design-system-core.md`.
- Lab: text roles, `.tag` and `.nav-link`.
- Apply: global `.eyebrow`, `.lead`, `.caption`, `.field-label` and `.tag` replace local
  equivalents. Headers use `.nav-link`, ~~with Builder joining Scores and Settings~~
  [DEPRECATED 2026-11-02] with the spike's HANGAR, HIGH SCORES and OPTIONS. ~~The version
  leaves button labels.~~ [DEPRECATED 2026-11-02] Done in the spike.

### S8 — Resource meter

- Spec: an update to the existing resource/HUD spec, or a new `docs/specs/resource-meter.md`.
- Lab: `/lab/resources` uses the production meter.
- Apply: the HUD and the canvas `resource-bar.ts` share one meter definition. Hull and power use
  distinct resource colours. Capacity above base never shows as `200%`.

### S9 — Control hints

- Spec: `controls-system.md`.
- Lab: key caps and touch hint.
- Apply: `.kbd` and a touch variant chosen by `(pointer: coarse)`. The text matches actual mappings,
  including inverted-controls defaults. Hints are never hidden on phones. The menu no longer
  carries a hint (owner, 2026-11-02); where hints appear instead is part of this slice.

### S10 — Ship launcher (D3, D7)

- Spec: `ship-select-and-camera-zoom-v0.4.0.md` / `ship-select-ui-persistence.md`, updated.
- Lab: `/lab/ship-launcher` at 1440×900 and 844×390 with each ship selected.
- Apply: ~~a radio group of three cards (production silhouette, S4 name, trait) plus one filled Go.
  The last-used ship is preselected; arrows and 1–3 select; Enter is Go. Browser tests move from "TAP TO
  START" to select + Go; add keyboard-only and phone no-scroll tests.~~ [DEPRECATED 2026-11-02] The
  spike delivered the selector as the design-system toggle 01–04 with one ship shown at a time, and
  browser tests select through it. Remaining: preselect the last-used ship, add a `/lab/ship-launcher`
  page, and add keyboard-only and phone no-scroll tests.

### S11 — Attract scene and motion (D5)

The backdrop is a star system shown for its own sake, like the star and planet Lab pages. It is not
the game world: no simulation, no ship, no spawn, no score, and nothing in it carries into the run
that Go starts (owner, 2026-11-02). It draws the current system until the random star systems plan
delivers a generator, then shows a fresh system per visit with no further opening-screen work.

- Spec: `design-system-core.md` for the scene element and motion tokens; `architecture.md` for where
  the scene lives.
- Lab: a star-system scene page built from the real star and planet renderers.
- Apply: the opening shows that scene at whole-system zoom with slow orbits and a radiating star.
  Motion tokens; the panel exits, then a ready beat before the clock runs. Reduced motion gives a
  still frame and an instant start. Report 60 FPS on the reference laptop.

### S12 — Opening screen composition

- Spec: this file shrinks to the composition contract below. `menu-overlay.md` is marked deprecated.
- Lab: `/lab/opening` composes the real opening with a fixed seed as the reviewed visual baseline.
- Apply: ~~`FlightDeck` MENU becomes logomark, ship launcher, Go and control hint in a panel over the
  attract scene. The dropdown, "TAP TO START" and the in-card builder button are removed.~~
  [DEPRECATED 2026-11-02] The panel and removals are done (spike). Remaining: place the panel over
  the S11 attract scene and add `/lab/opening`.
- Human review: attract-scene pace, readability over the scene, ship card clarity, Go on a real phone.

## Target opening experience (S12 contract)

1. On load, a star-system scene (not the game world) shows at whole-system zoom. Planets move slowly and the
   star radiates. There is no HUD and no engine pads.
2. ~~A panel shows the ∅·Δ logomark, three ship cards (Scout / Fighter / Corvette) with real
   silhouettes, one Go button and a one-line control hint.~~ [DEPRECATED 2026-11-02] A panel shows
   the ∅·Δ logomark, VOID DRIFT, SELECT YOUR SHIP with the 01–04 toggle (Scout / Wasp / Fighter /
   Corvette), the selected ship's name, production drawing, long name and equipment, one PRESS START
   button and the version. No control hint. Implemented (spike), except the attract scene behind it.
3. The last-used ship is preselected. ~~Tapping a card selects it; Go starts the run. Keyboard: arrows or
   1–3 select, Enter goes.~~ [DEPRECATED 2026-11-02] Tapping a toggle part selects it; PRESS START
   starts the run. Keyboard: arrows or 1–4 select, Enter on PRESS START goes. Preselection is not yet
   implemented; the rest is.
4. The header holds the logomark, a run tag, and nav: ~~Builder, Scores, Settings~~
   [DEPRECATED 2026-11-02] HANGAR, HIGH SCORES, OPTIONS. Implemented.
5. At 844×390 everything in step 2 fits below the header without scrolling. ~~The headline and eyebrow
   appear only where there is room.~~ [DEPRECATED 2026-11-02] The menu has no headline or eyebrow
   copy. Not yet checked (phone landscape is out of scope for now).

## Boundaries

- No new npm dependencies or paid services. Fonts are self-hosted files, never a CDN (D2 as amended).
- No changes to gravity, friction or ship tuning.
- Random systems for game runs are out of scope here; see the
  [random star systems plan](../plans/random-star-systems.md).
- ~~Stored ids, saved builds, settings and score documents stay compatible.~~ [DEPRECATED 2026-11-01] Ship ids changed
  in S4; old builds, settings and scores are purged in alpha (owner, 2026-11-02).

## Contract

### Definition of Done

- [ ] Every slice's owning spec describes the implemented rule; stale text is marked deprecated.
- [ ] `/lab/typography`, `/lab/tokens`, `/lab/ship-launcher` and `/lab/opening` render from production code.
- [ ] No literal font family, brand hex or `z-index` remains in shared UI or shared canvas renderers.
- [ ] Ship names read Scout / Fighter / Corvette everywhere; ~~stored ids are unchanged~~ [DEPRECATED 2026-11-01] ids
  equal the short names.
- [ ] Dialogs isolate the stage on every screen that has them.
- [ ] The S12 contract holds at 1440×900 and 844×390, with reduced motion respected.
- [ ] `pnpm verify` passes; skipped or unavailable stages are reported as such.

### Scenarios

```gherkin
Scenario: Start a run from the opening
  Given a returning player whose last ship was Corvette
  When the opening loads
  Then a star-system scene animates at whole-system zoom
  And 04 (Corvette) is selected in the ship toggle
  When the player selects 01 (Scout) and activates PRESS START
  Then the run starts with Scout and the HUD appears
  # Updated 2026-11-02 (spike): cards and Go became the toggle and PRESS START.

Scenario: Keyboard-only start
  Given the opening has loaded
  When the player presses 1 then Enter
  Then the run starts with Scout

Scenario: Phone landscape fit
  Given an 844×390 touch viewport
  When the opening loads
  Then the logomark, the ship toggle, the selected ship and PRESS START are visible without scrolling
  # Updated 2026-11-02 (spike): no cards and no hint in the menu.

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
  S4 renames displayed names only; renaming code identifiers is optional cleanup. S4 renamed the
  design.md heading to "Corvette silhouette"; `cruiser.ts`/`CRUISER`, `fighter.ts`, `scout.ts` and
  "cruiser" in test names remain.
- ~~**Wasp in the launcher.** S10 and the S12 contract assume three cards and keys 1–3. The Wasp is a
  fourth flyable ship; whether it is a launcher card is undecided (asked 2026-11-02).~~ Resolved
  (owner, 2026-11-02): the Wasp is not a launcher ship yet. S10 keeps three cards (Scout / Fighter /
  Corvette) and keys 1–3; the Wasp stays selectable in the builder and the Lab. Reversed (owner,
  2026-11-02, spike): the Wasp is launcher ship 02 of four.
