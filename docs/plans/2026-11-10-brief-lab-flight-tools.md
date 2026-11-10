# Brief: Lab tools that run game flight

Handoff brief, written 10 November 2026 at the end of the 0.6.0 spec session
(commit `c7c22e7` on `feat/0-5-0`). Everything below comes from that session's
context; nothing was researched again for this brief, so check it against the
code before relying on it.

## Your task

Plan, with the person guiding you, how to remove from the Lab every tool that
runs the game's live flight shell, or retire it gracefully where that takes no
big effort. Plan first and discuss details; do not start deleting before the
plan is agreed.

## Why

- The [Lab spec](../specs/lab/spec.md), added 10 November 2026, says the Lab is
  not part of the game. It holds demos, presentations, examples and
  instruments, never a game mode, and nothing in it submits a score.
- Earlier agents drifted and built playable game modes inside the Lab. Those
  are historical artefacts, not intent.
- It becomes urgent with 0.6.0. Today `FlightDeck.svelte` reaches Save Score
  only for `mode === "survival" && !loadout && chosen !== "fiddler"`, so Lab
  pages are safe only because they pass a loadout. Deliverable 3 of the
  [0.6.0 plan](2026-11-08-ion-storm-0-6-0.md) makes ranking follow the
  Experimental toggle instead ([Experimental mode](../specs/game/experimental/spec.md)).
  After that, nothing keeps a Lab page that mounts `FlightDeck` away from Save
  Score.

## What is known

Found with a quick grep, not a full audit; the lists were cut short, so expect
more.

- **`/lab/builder`** (`apps/web/src/pages/lab/builder.astro`) mounts
  `ShipBuilder.svelte`, the whole Hangar, which mounts `FlightDeck`. It also
  reads and writes the player's stored builds (`localStorage`
  `void-drift-builds-v3`), so today the Lab shares the player's saved ships.
- **`FlightDeck` or `ShipBuilder` mounted directly** by `/lab/landing` and, at
  least, these studies under `apps/web/src/pages/lab/studies/`:
  `run-countdown-2026-11-05`, `heavy-cruiser-slots`,
  `ion-point-defence-2026-11-08`, `scout-firefly`, `ion-engines-2026-10-31`,
  `light-ion-cannon-2026-11-08`, `ship-slot-language`, `lhi-wasp`.
- **Lab components that use game fittings or simulation** (they may be fine
  instruments, or may be game modes; to be judged):
  `components/lab/IonCannonEncounter.svelte`,
  `PointDefenceEncounter.svelte`, `LabDerelict.svelte`,
  `LabDerelictDamage.svelte`, `FxBench.svelte`, `LabShipMain.svelte`; and in
  `components/studies/`: `WaspSideSlotPositioner`, `GravityFoldFlight`,
  `PointDefenceTurning`, `IonCannonFitting`, `fiddler/FlightReady`,
  `in-game-controllers/PadUxBench`, `gilded/*Glass`,
  `derelict-three/Comparison`, `MovementBench`, `GravityFxFizzles`.
- `/hangar` and `/lab/builder` share `ShipBuilder`. The
  [Hangar spec](../specs/game/hangar/spec.md) still says shared opening changes
  "remain inspectable in the Lab at `/lab/builder`"; that line is a game spec
  placing a rule on the Lab, and the spec session will remove it.

## What to keep in mind

- **The line to draw** is game mode versus instrument. Running the real
  simulation to show or measure something (motion instrument, gravity tuning,
  FX benches, study comparisons) can be a legitimate Lab instrument. A page
  that lets you fly a run with an ending, a score or a launch flow is a game
  mode. Agree that line with the person before classifying pages.
- **Lab still reuses real game systems.** `CLAUDE.md` asks to "reuse real game
  systems in the Lab" and to demonstrate shared visual definition changes
  there. Removing game modes must not remove the ability to show components.
- **Studies are historic.** A study section is a record of what was decided
  then. Retired studies move to `apps/web/src/pages/lab/studies/archive/`;
  `apps/web/src/data/studies.ts` is the registry. The
  [design studies spec](../specs/lab/design-studies/spec.md) owns that process.
  Freeze an earlier section's example before changing a shared component it
  uses.
- **Lab specs to update with the change:** [Lab](../specs/lab/spec.md) (its two
  Definition of Done items are unchecked and are this work's acceptance),
  [workbench](../specs/lab/workbench/spec.md) (old, says "Do NOT load the full
  GameLoop in the Lab"), [motion instrument](../specs/lab/motion-instrument/spec.md),
  [gravity tuning](../specs/lab/gravity-tuning/spec.md).
- **Tests:** browser suites touch Lab pages; removing a page means removing or
  moving its tests. Tests assert relations, not design values.
- **Viewport:** the Lab targets 1280px wide and up; never test or fix it below.
- **Authority:** local commits within the agreed scope; ask before adding
  dependencies; never push without explicit authorisation. Every session
  shares this checkout; a commit saves the whole tree.
- **Plans stay:** never delete or offer to delete files in `docs/plans/`.

## Done looks like

An agreed plan, in `docs/plans/`, that lists each affected Lab page and
component with its fate (delete, retire to archive, keep as instrument), the
tests and specs that change with it, and how the Lab spec's two criteria get
checked.
