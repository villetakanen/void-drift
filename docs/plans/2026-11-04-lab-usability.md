# Lab usability: exploration, tuning and reference

**Status:** proposed, not started. Owner review needed before task 1.

The owner wants two things from the Lab. Developers should be able to use design
studies to explore, not only to record decisions. Small gameplay changes should be
possible in Lab tools. The Lab also remains the knowledge base for how the design
system looks and what the ships are. This file tracks the work. The rules belong to
the owning specs.

## Owning specs

- `docs/specs/lab-instrument.md`: document model, copy back, instrument scope.
- `docs/specs/design-studies.md` and `.agents/skills/design-study/`: study form and ending.
- `docs/specs/playable-alpha.md`: flight trials, trial import and export, stock-only scores.
- `docs/specs/design-system-core.md`: reference pages.
- `docs/specs/voice-led-factory.md`: any gate change (task 5).
- `docs/specs/gravity-field.md`: tuning file, `tuning:apply` and rules version.

## Concurrent work

`docs/plans/2026-11-04-gravity-field-lab.md` (specs committed in `c3c44be`) owns:

- the versioned tuning file and `pnpm tuning:apply <area>`
- the injectable `Simulation` options
- instrument document v2

This plan does not build a second version of any of them.

- G1 is gravity step 1: the tuning file with a `gravity` section.
- G2 is gravity step 2: `Simulation` options that accept a per-chassis patch. This plan defines the patch shape.
- G3 is gravity step 3: instrument v2 calculates through `Simulation` and passes each vehicle's `changes` through.
- G6 is gravity step 6: `tuning:apply` with one subcommand per section.

Gravity values change only through that plan's proposal flow. The rules version
changes once per release, never when a patch is applied (gravity-field.md, "Rules version").

## Assessment (2026-11-04)

This is a summary of `docs/factory-building-lessons/`, `docs/loop-evidence/`, the
study registry and components, and the Lab pages. Findings are evidence. They are
not adopted lessons.

1. **Tuned values are lost or miscopied.**
   - Playground settings were not saved (`loop-evidence/2026-10-31-ship-slot-language.md:85`).
   - Fiddler stabilizer values were miscopied, and no trace export was kept (`2026-11-03-lhi-fiddler.md:31,85`).
   - Fighter tuning reached code through chat edits (`2026-10-30-ship-silhouettes.md:122-130`).
   - Only the instrument and the mount planner have copy and paste with a schema check.
     Five fiddler studies save state under hand-versioned `localStorage` keys. No study
     or Lab page puts its state in the URL.
2. **The one gameplay tuning surface is narrow.** `/lab/flight` runs the real
   `Simulation`, but it edits only the global `ion.*` and camera values. Its per-ship
   multiplier sliders render only when no loadout is set. `labSettings()` always sets
   one (`packages/mode-a/src/lib/simulation.ts:60`), so the sliders are effectively dead.
   Even when shown, `thrustMultiplier` no longer drives fitted flight. Making the fighter
   10% stronger today means changing every ship's ion acceleration, then finding by hand
   which of `ION_DEFAULTS`, `PARTS`, `CHASSIS` or a new factor to edit. No tool compares
   the flight before and after.
3. **Studies record decisions; they do not support exploration.**
   - About 60% of the 166 study components are static galleries of hand-drawn variants.
   - Earlier sections are kept by copying whole components (`LabInstrument021/023/027` are
     700–800 lines each), which gives about 20 snapshot files.
   - 9 components are not imported anywhere.
   - About 9 studies lost rounds to rebuilt presentation or to reopened givens
     (utilities, ship-utility-language, plasma, path, energy-support, …).
   - Studies have nowhere to try things before committing a round to the page.
4. **The knowledge base is there but hard to find.**
   - `/lab` is an empty placeholder.
   - The nav is one flat list that mixes tools, entities and design-system pages.
   - `buttons`, `landing`, `utility-artwork`, reviews and the archive have no nav entry,
     and `buttons` is an alias of `inputs`.
   - No page says whether it shows the production system or a sketch.
   - Some pages are stale:
     - the ship entity page shows multipliers that no longer drive flight
     - the studies index still describes "exploratory → accepted → integrated"
     - `ship-lab-chassis-preview.md` uses retired ids
5. **Recurring evidence gaps that Lab tooling cannot fix:** physical-device review and
   unreliable dev servers. They are out of scope here, but every task must record its
   device evidence honestly.

## Acceptance contract

- A developer can open `/lab`, see where each topic lives, and tell production from sketch.
- A developer can change one ship's handling in the Lab, fly it against stock on the
  same seed, and turn the accepted change into a source diff with one command, with no
  hand copying.
- Any Lab bench or study bench state can be shared as a link or JSON and restored exactly.
- A study can hold free exploration that is kept apart from its decision record. Earlier
  sections stay historic without copying whole components.
- Scores still accept stock configuration only. Owner review of feel stays separate from
  automated checks.

## Tasks

Each task can land on its own.

- Tasks 1, 2 and 5 can start now. Task 5 needs task 2.
- Task 3 needs task 2, plus G2 and G3 from the gravity plan.
- Task 4 needs task 3, plus G1 and G6.

| #   | Task                             | Done when                                                                                                                                                                  |
| --- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Lab map and source labels        | `/lab` and the nav are generated from one registry. Every page shows its kind and source. Stale pages are fixed.                                                           |
| 2   | Shared bench state               | A helper using Zod, the URL and the clipboard is adopted by `/lab/flight` and one study bench. Links restore state exactly.                                                |
| 3   | Per-ship tuning patch with A/B   | A sparse per-chassis patch is compared against stock as two instrument vehicles through the real simulation, and can be flown in `/lab/flight`. The dead sliders are gone. |
| 4   | Ship section of the tuning file  | `pnpm tuning:apply ship <patch>` checks a patch and writes the `ship` section of the shared tuning file.                                                                   |
| 5   | Study sandbox and data snapshots | Each study has a sandbox area, frozen sections use config plus capture instead of copied components, and orphaned components are reported.                                 |

### 1. Lab map and source labels

- Add `apps/web/src/data/lab-pages.ts`, a Zod-checked list with these fields:
  - `href`, `title`, `purpose` (one line)
  - `kind`: `reference`, `tool`, `entity` or `study`
  - `source`: `production` or `sketch`
  - `group`: design system, ships and world, tools, studies
- `LabLayout` builds the grouped nav from this list. `/lab` becomes the knowledge-base
  index: groups, purpose lines, source badges, and the latest studies taken from
  `data/studies.ts`.
- Pages missing from the nav get entries or are removed. Make `buttons` a redirect to `inputs`.
- Fix stale content:
  - remove the dead multipliers from the ship entity page
  - correct the studies index text
  - mark `ship-lab-chassis-preview.md` as superseded or reconcile it
- Test: every routed `/lab/*.astro` page (studies excluded) has a registry entry, and the
  reverse. Do not test titles or order.
- Evidence: a desktop screenshot of `/lab` and a read of the nav at 1280px.
- **Done 2026-11-04.** Built as planned, with three differences:
  - `group` and `source` cover what `kind` would have said, so there is no `kind` field.
  - `/lab/buttons` stays a routable alias (`aliasOf`), not a redirect, because the
    browser test and external links use it.
  - Web unit tests now run in vitest (`apps/web/src/**/*.test.ts`). The root `tsc` check
    excludes them because it does not load `vite/client`; svelte-check covers them.

### 2. Shared bench state

- Add one shared module (for example `apps/web/src/lib/lab-state.ts`) that takes a Zod schema and provides:
  - encode/decode to a URL hash (versioned and size-checked; fall back to JSON when too long)
  - copy JSON to the clipboard and paste it back
  - "reset to stock"
  - if the input is invalid, keep the current state and show why (`playable-alpha.md:50`)
- Adopt it in `/lab/flight`. It replaces the textarea-only export, and `?trial=` keeps working.
- Adopt it in one interactive study bench, preferably `MovementBench`.
- Test: the round trip from schema to hash to schema is lossless, and invalid or old
  versions are rejected.
- Update the `lab-instrument.md` and `playable-alpha.md` text where it describes export.

### 3. Per-ship tuning patch with A/B flight

- Define a sparse `ShipTuningPatchSchema` in `packages/mode-a/src/lib/schemas/`. This is
  the per-chassis patch that G2's `Simulation` options accept.
  - Keys are per-chassis overrides: chassis mass, part thrust and limit by part, and ion
    parameters scoped to the chassis, with global as the default.
  - The patch never changes stock objects; it is applied when the simulation is built.
  - There are no gravity or friction keys; gravity belongs to `field.changes`.
- A/B for analysis: an instrument document with two vehicles, stock and patched, on
  G3's `Simulation` path. The patch goes in the patched vehicle's `changes`. Add
  instrument starters for "stock vs patched" per chassis. Do not build new charts
  (`lab-instrument.md`).
- Feel: `/lab/flight` accepts the same patch through task 2's state helper, so the owner
  can fly the patched ship.
  - Remove or rewire the profile multiplier sliders so that every visible control changes flight.
- Patched runs stay unranked.
- Test: an empty patch behaves the same as stock. A thrust override changes only the target chassis.

### 4. Ship section of the tuning file

- Add a `ship` section to G1's tuning file.
  - Move the values the patch can touch (`PARTS` thrust and limit, `CHASSIS` mass,
    `ION_DEFAULTS`) into that section.
  - `PARTS`, `CHASSIS` and `ION_DEFAULTS` read their values from it.
  - Before the move and after it, stock settings must produce identical simulation output.
- Add the `ship` subcommand to G6's `pnpm tuning:apply`. It checks the patch with
  `ShipTuningPatchSchema`, rewrites only the changed values, prints the diff, and follows
  the same refusals as `gravity`.
- The instrument's Copy proposal and the flight panel both produce an input this command
  accepts. The agent or developer runs it, reviews the diff, and commits.
- Test: applying an exported patch and then flying stock reproduces the patched flight on
  the same seed.
- Applying a patch does not bump the rules version (`CHALLENGE`). Value edits happen
  all the time in parallel worktrees. The release bumps the rules version once, when
  the tuning differs from the previous release (owner decision, 2026-11-04).
- Update `gravity-field.md`'s tuning handoff section (or the spec that owns ship
  tuning) and `docs/architecture.md` with where ship tuning lives.

### 5. Study sandbox and data snapshots

- Add a sandbox area to the `StudyLayout` convention.
  - It has a live bench and the task 2 state, with no round numbering and no requirement
    to decide.
  - "Promote to 02.x" saves the current state as a named example on the page.
  - The study skill and `design-studies.md` describe the sandbox as a place to explore,
    separate from the decision record.
  - Focus and "one decision per study" still apply to the numbered rounds.
- Data snapshots: a frozen section stores its config JSON, the git revision, and a
  captured SVG or PNG, plus an "explore from here" link that opens the live bench. Later
  sections can then change shared components without rewriting history.
- Apply this to new studies only. Existing frozen copies stay as they are, because study
  sections stay historic.
- Add optional `date`, `reviews` and `related` fields to the registry schema in
  `data/studies.ts`. The index shows the review links.
- Report study components that no page imports, at first as a warning in
  `check:contracts`; this is a gate change under `voice-led-factory.md`. The owner decides
  whether to delete the 9 orphans found on 2026-11-04.
- Evidence: one new or open study (`in-game-controllers` is the only open one) uses the
  sandbox for at least one promoted example.

## Open decisions (owner)

1. Ship tuning in its own spec, or as a section of `gravity-field.md`'s tuning handoff?
2. Should the 9 orphaned study components be deleted, or kept as unlinked history?
3. Contradiction: `docs/specs/gallery_and_assets.md:43-44,59` says the Lab is kept out of
   production builds and does not load GameLoop. The release smoke test and `/lab/flight`
   do both. Should that spec be retired?

## Boundaries

- No new npm dependencies. Task 2 uses the platform URL, Clipboard and `CompressionStream` APIs.
- No changes to stock gravity, friction or tuning values as part of this plan. Task 4
  moves values without changing them. Gravity changes only through the gravity plan's
  proposal flow.
- Production code and tests do not import from `components/studies/`. Tests check
  relations, not design values.
- Keyboard support stays on every changed bench. The Lab targets 1280px and up;
  no task checks or fixes narrower layout.
- Each task updates its owning spec and records skipped device checks explicitly.
