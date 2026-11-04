# Camera trial 2: zoom from the gravity field

**Status:** approved 2026-11-04; building in a worktree session.

A limited, throwaway trial in the real game, built in its own worktree and flown by
the owner. It is not a design study, because it changes the whole game's camera.
It is not a release candidate either: nothing is merged unless the owner asks after
flying it.

## Background

- **Trial 1** ([record](../loop-evidence/2026-11-04-camera-framing-trial.md), branch
  `claude/camera-framing-impl-5bd4f9`, commit `90c79e4`) framed the ship, the closest
  gravity source's centre and a target. The owner flew it: "It clearly shows this
  idea does not work at all."
- **Reported symptoms:** constant zoom motion, the ship too small or far away, and
  jumps on subject switch. Even in a sun-only field the view never zoomed close.
- **Star Control 2 Super Melee** frames only the two ships. It has a 4:1 zoom range,
  and its widest view still shows only half the arena, with wrap doing the rest.

## Question this trial answers

Does a camera feel right when the zoom comes from the local gravity pull instead of
from fitting objects, with wells outside the view shown on the HUD?

One question only. Targets, enemies and derelict framing are out of scope.

## Behaviour under trial

- **The ship's outline stays inside the active camera box** (220 / 64 logical px) on
  every frame. This reuses trial 1's hard constraint.
- **Zoom is driven by the field.**
  - The zoom follows the magnitude of the summed gravity acceleration at the ship,
    using the production `starPull`, `planetPull` and `wellAcceleration`.
  - The mapping runs on a log scale: from the widest zoom at weak pull or below, to
    the closest zoom at strong pull or above.
  - Zoom eases on a log scale, with separate in and out rates.
  - No object is chosen, so nothing switches.
- **The widest zoom no longer fits the whole arena.** It is a tunable value,
  starting near SC2's proportion: about half the arena across the box.
- **The camera centres on the ship,** with the box constraint as its only limit.
- **Wells outside the view** (star, planets, moons, Lab wells) get HUD edge markers at
  the box edge, pointing towards each well, drawn at constant screen width. They are
  HUD, not world art.
- **Comparison in the same build.** A key switches between today's production camera
  (ship + star, stepped zoom) and the trial camera during flight. The HUD shows which
  one is active.
- **A live tuning panel** is enabled by a query flag in the trial build only. It
  covers:
  - the pull thresholds and the widest and closest zoom
  - the in and out rates, and the padding
  - marker on/off

  Copy exports the current values as JSON. This covers trial 1's gap, where only the
  first tuning was ever flown.
- **Framing doesn't affect the simulation.** Replays stay deterministic and scoring
  is unaffected.

## Flight script

The owner flies each scenario with both cameras, switching with the key:

1. **Sun-only field:** skim the sun's surface, then climb away.
2. **Default system:** transit between two planets' wells.
3. **Open space:** cruise between orbits, away from every well.
4. **Arena wrap.**
5. **Test flight:** a derelict pass, to see how the trial camera behaves with salvage
   present even though it doesn't frame targets.

## Capturing the experience

The loop record is written during the flight, not reconstructed afterwards.

- **The record starts before the first flight** at
  `docs/loop-evidence/2026-11-04-camera-trial-2.md` in the main checkout, so it
  survives worktree removal.
- **After each scenario the agent asks the same short question set**, using the
  question tool, so the answers can be compared:
  - Is the zoom calm or busy?
  - Is the ship a comfortable size?
  - Can you read where the wells are?
  - Is the trial camera better, worse or the same as production here?
  - A free-text note.
- **Each answer is appended at once,** with the scenario and the exact tuning JSON
  flown at that moment. Quotes stay verbatim.
- **Tuning changes the owner makes mid-flight** are recorded as values against the
  scenario they were made in. The owner's verdict on them is recorded as they gave it.
- **Agent observations go in a separate section**, labelled as agent-side:
  - scripted `data-*` samples, such as ship screen position and zoom against pull
  - profile numbers
- **Artifacts are copied into the main checkout's `artifacts/camera-trial-2/`**
  before the worktree is removed: verification reports, profiles and the tuning JSON.
  The record links that run directory.
- **At the end the agent runs the `close-loop` skill** on the record. Interpreting
  the results is a separate step.

## Gates for the trial build

- **Relation tests:**
  - In scripted flights through the five scenarios, every frame keeps the ship inside
    the box.
  - The target zoom never decreases as pull increases.
  - A marker shows exactly when its well is outside the view.
  - Switching cameras doesn't change the simulation state.
  - Coordinates round-trip between world and screen.
- **`pnpm verify`** on the committed trial revision, with `JAVA_HOME` set to the
  local Java 21. Note: lint currently fails on `feat/0-5-0` because of
  `tsconfig.check.json` (from `90f9dbe`). Report it as a pre-existing failure and
  don't hide it.
- **`FX_PROFILE_CAMERA=moving`**, as a measurement only.

## Session brief

The brief for the worktree session:

> Build camera trial 2 per `docs/plans/2026-11-04-camera-trial-2.md` in a new
> worktree branched from `feat/0-5-0`. Start from trial 1's commit `90c79e4` (branch
> `claude/camera-framing-impl-5bd4f9`) by cherry-picking it. Keep its box constraint,
> log-scale zoom easing, camera tuning section and scripted-flight harness. Remove
> its subject selection (gravity source and target framing).
>
> Add:
> - field-driven zoom from the production pull functions
> - a tunable widest zoom
> - HUD edge markers for wells outside the view
> - a key to switch to the production camera
> - a flag-gated live tuning panel with JSON copy
>
> Tests assert relations only, never design values. Commit locally in the worktree.
> Don't push or merge, and don't touch `feat/0-5-0` except to create and update the
> loop record in the main checkout.
>
> Before handing over:
> - Run `pnpm verify` on the committed revision with Java 21 and report every gate.
> - Run the FX profile.
> - Start the trial build's dev server and give the owner its URL and the key.
>
> Then run the flight script with the owner. Ask the fixed question set after each
> scenario and append each answer to the loop record immediately, with the tuning
> JSON. Copy artifacts to `artifacts/camera-trial-2/` in the main checkout before any
> cleanup. End with `close-loop`.

## Owner decisions (2026-11-04)

- **Live tuning panel:** included in the trial build.
- **Wells on the HUD:** edge markers only, with no distance or pull readout.
- **Question set:** the five questions above.
