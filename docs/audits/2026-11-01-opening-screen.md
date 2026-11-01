# Opening screen audit — 2026-11-01

Input for a design-system plan. This records findings only; nothing here is implemented.

Evidence: `feat/0-4-0` @ `a1b08ca`, `/` at 1440×900 and 844×390 (phone landscape),
Chromium in the Claude desktop browser pane. Code: `FlightDeck.svelte` (MENU overlay),
`core/styles/{tokens,flight,buttons}.css`, `apps/web/src/styles.css`, `Layout.astro`.

## What the player sees

Header (`VOID·DRIFT`, `SURVIVAL / 0.4.4`, `Scores` `Settings`) above a glass overlay
with eyebrow, headline "Dance with gravity.", two lines of copy, a native `<select>`
labelled "Ship Chassis", a lime one-line ship description, two equal lime buttons
("Build your ship · 0.4.4", "TAP TO START"), and a key hint. HUD, engine touch buttons
and the dimmed scene show through behind the overlay.

## Findings

### Unclear or undecided

1. **Brand mark.** The game uses a `VOID·DRIFT` system-ui wordmark. `Logo.svelte`
   (∅·Δ) exists but appears only in the Lab. `design-system-core.md` says that the logo is shown in the
   HUD and that Noto Sans Math loads. Neither is true: `body` names Noto Sans Math, but
   nothing loads it anywhere. `LabLayout` has only a leftover `<!-- Google Fonts -->`
   comment, so both the game and the Lab fall back silently. **Resolved by D1.**
2. **Primary action.** Two filled lime buttons have equal weight. Is the opening about
   starting a run or about building a ship? The version number sits inside the Build label
   and is shown again in the header. **Resolved by D3 (revised).**
3. **Ship naming.** The dropdown says Fighter / Scout / Tank, the description says
   `FIGHTER` / `TANK`, the builder and design.md say Heavy Corvette, and the config ids are
   `balanced` / `tank`. There is no canonical display name.
4. **Ship choice has no picture.** The three silhouettes are an accepted, distinctive
   design, but the choice is a plain-text native dropdown (`appearance: auto`).
5. **Lime means everything.** The same accent is used for the eyebrow, the edition tag, the ship
   description, both CTAs, the active engine and the Pause link. Accent no longer signals "act here".
   **Resolved by D6.**
6. **Control hint.** "A + D / ← + → · Both engines thrust forward" doesn't explain that one
   engine turns the ship, and on phones it is hidden by `.flight-card p:not(.eyebrow)` →
   phone players get no instructions at all.
7. **Backdrop intent.** The live scene sits behind 91% glass. The ship is a grey smudge and
   the star a brown disc. It is neither a deliberate attract-mode scene nor a clean title
   backdrop. **Resolved by D5.**

### Ugly or broken

8. **Layering bleed.** HUD (`HULL 100%`, `POWER 200%`) and the LEFT/RIGHT ENGINE buttons
   render under the menu as ghosts. On phones the card overlaps the engine buttons.
   There is no z-index scale (`z-index: 2`, `5` literals); the overlay doesn't make the
   stage `inert`.
9. **`POWER 200%`.** The Fighter's extra pack shows as a percentage above 100. The meter has
   no capacity semantics, and both bars use the same lime `accent-color` although
   `--color-resource-hull` (cyan) exists.
10. **Three shape languages.** Buttons have cut corners, engine pads have a 12px radius, and inputs
    have a 2px radius. The card itself has no surface: text floats on glass.
11. **Typography is ad hoc.** It mixes a system-ui display face, monospace body text and an unloaded Noto Sans Math.
    It has four sizes plus one clamp, and letter-spacing literals (`0.12em`, `0.16em`,
    `-0.04em`). Casing comes from hand-typed strings (`TAP TO START` vs `Build your ship`),
    not a role. "TAP" also appears on desktop.
12. **Header nav.** `Scores` / `Settings` are 12px underlined grey text. They meet the 44px target
    but look like footnotes, and their style matches neither buttons nor the brand.
13. **Dialog semantics.** `role="dialog" aria-modal` but focus stays on `body`. The background
    stays interactive.
14. **Start is a hard cut.** There's no transition or ready beat; Pause is a lime text link.
15. **Token hygiene.** `#000` literals in `index.astro`, `Layout.astro` and `theme-color` (void is
    `#050510`). `--flight-border: #ffffff24` and `--flight-glow` hold hex literals.
    `--color-overlay` (0.9) and `--color-flight-glass` (0.91) duplicate each other. The legacy
    `--color-neon-blue` now holds lime. Global tokens are named `--flight-*`.
16. **`/lab/typography` misreports itself.** It is titled "Typography: Noto Sans Math", but no
    face is loaded (`document.fonts` is empty), so it renders the OS sans-serif. It also never
    shows the fonts the game actually uses (`--font-display`, `--font-flight`), has no
    size/role scale, and its swatches use hard-coded `#333` and inline styles.
17. **Specs are stale.** `menu-overlay.md` (logo, 0.1.0 layout, `.hud-overlay`) and
    `design-system-core.md` describe a screen that no longer exists.

## Owner decisions (all recorded 2026-11-01)

- **D1 Brand mark:** Decided 2026-11-01 — the logomark is ∅·Δ set in Noto Sans Math, shipped as vector outlines (no runtime font). Convert once and commit the SVG with a source/licence note; no new dependency
- **D2 Typefaces:** Decided 2026-11-01 — monospace for all game/UX text; long-form prose (studies, help) uses the system sans-serif; display headlines use that same sans-serif in a heavy weight. No webfonts.
  **Amended 2026-11-01 (owner):** the faces were chosen and only missing from the repo. Monospace means B612 Mono; prose and display use Noto Sans (display at 800); Noto Sans Math is the logotype face, shipped only as SVG outlines (D1). B612 Mono and Noto Sans are self-hosted woff2 files with OFL licences: no CDN and no npm dependency. "System sans-serif" and "No webfonts" are superseded.
- **D3 Opening primary:** Revised 2026-11-01 — the card is only the three ships, shown as visuals, plus a Go button; select a ship, then Go (see E4). The builder leaves the card for an extra entry in a top corner of the header, without the version number. The dropdown and the separate Start/Build buttons go
- **D4 Ship names:** Decided 2026-11-01 — Scout / Fighter / Corvette everywhere, from one shared name source. Ids `scout` / `balanced` / `tank` stay. Rename "Heavy Corvette" in `loadout.ts`, `design.md` and the builder; replace "Balanced"/"Tank" in `config.ts`, the Lab inspector and hand-written descriptions; the leaderboard shows names, not ids
- **D5 Backdrop:** Decided 2026-11-01 — a live, ship-less star system at the outermost zoom level. Planets and moons move slowly and the star radiates; it shows what a system looks like. The system is random, in line with star-system randomization (currently effectively off: see E12)
- **D6 Accent meaning:** Decided 2026-11-01 — lime is the brand colour, and the brand colour doubles as the action highlight. It is used for the logomark, actions (buttons, links, focus, active controls) and selection (selected outlines, occupied builder slots). Informational text (eyebrows, tags, descriptions) moves off lime
- **D7 Phone landscape:** Decided 2026-11-01 — simple and must fit an iPhone in landscape. The minimum is the logomark, three ship visuals in a row and a one-line control hint. The headline/eyebrow appear only where space allows

## Primitives to create

### Tokens (`core/styles/tokens.css`, demonstrated in `/lab`)

- **T1 Type roles:** `--font-family-{ui,prose,display}`. `ui` is the monospace currently in
  `--font-flight`. `prose` names the sans-serif that `StudyLayout` already uses implicitly via
  `--font-display`. `display` aliases the `prose` family and adds a
  `--font-weight-display` (800) and the display tracking. Add a global `.prose` class with measure, line height and heading rhythm,
  promoted from `StudyLayout`'s local 70ch / 1.65 rules. Also add the size steps
  `--font-size-{caption,label,body,lead,heading,display}`, matching line heights, and
  `--tracking-{eyebrow,wordmark,display}`. Retire `--font-small/body/large/title`
  through aliases.
- **T2 Semantic color:** `--color-brand` (lime) as the single source, with role aliases
  `--color-action` and `--color-selected` that point to it (D6). Components name the role
  they mean, so the mapping stays changeable later. Add `--color-on-brand`,
  `--color-text-{muted,subtle}`, `--color-border-{subtle,strong}`,
  `--color-surface-{base,raised,glass}`, `--color-scrim`. Map legacy `neon-*`,
  `--color-overlay` and `--color-flight-glass` as aliases. Move hex literals out of
  `--flight-border` and `--flight-glow`.
- **T3 Resource colors in use:** hull/power/warning/danger tokens wired into the meter.
- **T4 Layer scale:** `--layer-{scene,hud,controls,overlay,toast}`.
- **T5 Shape:** one corner language. `--cut-size-{sm,md}` for panels and pads, alongside
  the button cut, plus a documented exception for text inputs if one is kept.
- **T6 Glow and elevation:** `--glow-accent-{sm,md}` instead of `--flight-glow`.
- **T7 Motion:** `--duration-{fast,base,slow}`, `--ease-{enter,exit}`, plus reduced-motion
  rules for overlay entry and the start transition.
- **T8 Layout:** `--gutter`, safe-area insets (`env(safe-area-inset-*)`), and
  `--panel-width-{sm,md}` replacing page-named `--flight-card-width`.

### Elements and components

- **E1 Logomark:** ∅·Δ as committed SVG paths, converted once from Noto Sans Math (OFL),
  with a note on its source and how to redo the conversion. `Logo.svelte` renders it inline with the accessible
  name "Void Drift", with `currentColor` fill and size steps. It is used in the header, on the title card and as the
  favicon. Remove `"Noto Sans Math"` from `body` and from `/lab/typography`.
- **E2 Panel surface:** `.panel` with a glass surface, border and cut corners. It is shared by the menu,
  run-complete and pause screens.
- **E3 Text role classes:** global `.eyebrow`, `.lead`, `.caption`, `.field-label`, `.tag`.
- **E4 Ship launcher (D3, D7):** three ship cards replace the dropdown and the Start button. Each card has a
  canvas silhouette from the production renderer, the D4 name and one short trait line. Cards sit in one
  row at 844×390, each well above the 44px target. **Decided: select + Go.** The cards are a
  radio group: tapping selects, and selection shows as the lime selected outline (D6). One filled
  primary Go button sits below the row. The last-used ship (`selectedShipId`) is preselected, so Go
  is always enabled. Keyboard: arrows/1–3 change the selection, Enter = Go. Fit check: on a 390px
  phone, the mark, cards, Go and hint must fit below the header without scrolling. Verify this in the Lab.
  The builder's chassis choice may reuse the card visuals.
- **E5 Form fields:** styled `select` and text input with the shared focus ring and states, for
  the remaining selects and the initials field.
- **E6 Control hint:** a `<kbd>` key-cap style and a touch-pad hint variant. This lets the
  instructions survive on phones.
- **E7 Nav link:** a header/navigation link style distinct from body links and buttons.
- **E8 Resource meter:** label, value, unit and bar with a resource color. It handles capacity
  above the base (no `200%`).
- **E9 Modal scrim:** a layer token plus `inert` on the stage and focus moved into the dialog. The HUD
  and touch controls are hidden while the dialog is open.
- **E10 Tag/badge:** for `SURVIVAL / 0.4.4`, `UNRANKED`, `G CLASS / SHARED CHALLENGE`.
- **E11 Start transition:** an overlay exit plus a short ready beat before the clock runs.
- **E12 Attract scene (D5):** the opening backdrop. It is a ship-less, non-scoring simulation preview
  at zoom level 1 ("Whole system"). Planets advance along their orbits at a slow rate, and the star's
  radiance animates. It has no HUD and no input, and it uses a random seed per visit. Under reduced
  motion it shows a still frame. The full-screen 91% glass goes away; contrast comes from the E2 panel.
  Current constraints found in code:
  - `seed` is fixed at `CHALLENGE_SEED` (2026) and only shifts orbit phase.
  - `sunType` is hard-coded `"G"`.
  - Planets come from a fixed list in core `config.ts`, where "The Moon" is a planet entry,
    not a satellite.
    The owner ruled the fixed seed a bug (2026-11-01): systems are never static, so every run
    and every attract scene is random. Real variety beyond orbit phase is generator work outside
    the design system.

### Lab and docs

- `/lab/tokens` (color, layers, shape, motion) next to the existing `/lab/typography`.
- `/lab/opening` reference composing E1–E10 with fixed seed and viewports.
- Replace stale content in `menu-overlay.md` and `design-system-core.md`. Record decisions D1–D7
  in `design.md`.

## Suggested order

D1–D7 are decided. Work in this order: T1, T2, T4 → E2, E3, E9 (fixes bleed and hierarchy) →
E1, E4, E8 → E6, E7, E10 → E12, T7, E11 → Lab reference and spec cleanup.
