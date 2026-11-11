# Brief: deliver the plasma light (slices 2 to 4)

Written 11 November 2026 on `feat/0-5-0`, as a handover. The design is decided;
this is the plan for building it. Check the code before trusting any line here.

## What is decided

The study `plasma-light-2026-11-11` is accepted
(`apps/web/src/pages/lab/studies/plasma-light-2026-11-11.astro`,
`/lab/studies/plasma-light-2026-11-11`). Read its 02.7, "What exactly was
accepted", 03 and 04 before starting. In short:

- Plasma charges for 0.2 seconds.
- **Charge light:** a smooth bead at the nozzle, white-hot centre through amber
  to a transparent edge, radius 32 world units at the press tightening to 16 as
  the charge fills while the centre whitens. Live on LFX at full strength, with
  a trace in FX at 0.4 strength.
- **Thrust light:** a luminous ball, eight cached frames of five lobes drifting
  round a hot core, 26 units across at full thrust, 1.3 times as long as wide,
  stamped into FX every tick, holding a frame and its angle for three ticks,
  with two 1.5-unit sparks a tick. Size follows the square root of delivered
  output.
- **Release:** the ball starts 2.2 times its size and settles over 0.22 s.
- Plasma stays a `preview` part. Scored play waits for a decision on its thrust,
  mass, speed contribution and energy draw. Fission's light is a separate study.
- Effects live only on FX or LFX. No rule assigns engines to layers; this is
  plasma's design.

The reference implementation is the study's own light:
`apps/web/src/components/studies/plasma-light-027.ts` (bead, ball, sparks,
flare, `PLASMA_ACCEPTED_027`). It draws its gradients every frame, which play
may not do; production needs cached stamps. Reference captures are in
`apps/web/public/studies/plasma-light-2026-11-11/accepted-*.png`.

## State of the work

Nothing from this session is committed. The checkout is shared: a commit saves
the whole tree, other sessions' work included, so commit only when asked.

- **Slice 1, done and reviewed (two loops, approved):** `PARTS.plasma.chargeSeconds`
  is 0.2; the Hangar text in `ShipBuilder.svelte` is built from the part; the
  charge test in `packages/mode-a/src/lib/engine-identities.test.ts` follows the
  part's value; `tests/browser/builder.spec.ts` controls the clock for the
  charging test; `docs/specs/game/parts/spec.md` states the behaviour without a
  number.
- **Slice 2, not started.** A developer agent was launched and stopped before it
  changed anything (checked: no charge fields in `engine-plume.ts` or
  `simulation.ts`; 527 unit tests pass).
- **Slices 3 and 4, not started.**

Also uncommitted from this session, and needed by the slices: the Flight scene
instrument's study light, part tuning and study-owned menu
(`apps/web/src/lib/flight-scene/`, `apps/web/src/components/lab/flight-scene/`,
`docs/specs/lab/flight-scene-instrument/spec.md`,
`tests/browser/flight-scene-instrument.spec.ts`), and three read-only additions
to `packages/mode-a/src/lib/simulation.ts` (`emitters`, `engineSeconds`,
`parts`).

## Slice 2: effects can see an engine charging (small to medium)

Carry the state; draw nothing new.

- `PlumeEmitter` and `PlumeOutlet` (`packages/core/src/lib/effects/engine-plume.ts`)
  gain an engine's charge progress (0 to 1 while charging; absent or 1
  otherwise) and the seconds it has been thrusting in the current hold (for a
  delayed part, seconds since the charge completed; 0 while charging).
- `EnginePlume.stepMounted` keeps an outlet for a charging emitter although its
  output is 0. Today it skips any emitter whose output is not above 0.
- `Simulation.step` fills the fields for main engines from `engineTimers` and
  `this.parts` (not `PARTS`: a Lab instrument may stage tuned parts), using the
  same key mapping as `applyBuildEngines` (`left`, `right`, `aft-N`; the Wasp's
  one engine is `left`). Stabilizers and steady or pulsed parts never charge.
- `stamp` must not paint, and must not take scene budget for, an outlet that is
  only charging. Every existing style must come out exactly as before, same
  calls, same budget takes.
- Check what `activeCount` and `inspect` mean to their consumers afterwards.
- `apps/web/src/lib/flight-scene/flight.ts` `silence()` must clear the charge as
  well as the output for engines a study replaces. `light.ts` there recomputes
  the same state; simplify it to read the emitter only if that is small and safe.
- `docs/specs/factory/effects/spec.md`: "Output fidelity" says an engine's
  charge is engine state the game delivers, alongside output and events, and is
  not button state. Contract only, no history. That file has other sessions'
  edits; change only what this needs.
- Tests, as relations: a charging emitter gives an outlet with progress and no
  size; it is not painted and takes no budget; thrusting outlets are stamped
  identically with and without a charging one beside them; in a real
  `Simulation` a held plasma engine has a charging outlet with rising progress
  and no output, then output and rising thrust time, and release clears it.
  Derive ticks from `chargeSeconds` with a ceil (thrust starts on the first tick
  whose start time is at least `chargeSeconds`).

## Slice 3: plasma's thrust light (medium, after 2)

- A `plasma` plume style in core effects: multi-frame stamp cache built once
  (gradients only at cache build), a painter that places the ball behind the
  nozzle, holds a frame and angle for three ticks, scales by output and the
  release flare, and flings two sparks. `buildPlumeEmitters`
  (`packages/mode-a/src/lib/build-renderer.ts`) gives plasma mounts the style;
  Fission keeps `default`.
- Fidelity check: in the Flight scene instrument, the game's own light matches
  the study's light on the reference flight (Wasp, Plasma, B1, Follow) during
  thrust. Cost check on the mixed-effects bench (`/lab/fx`).
- Provisional: sizes on other ships, and whether the ball should shrink near the
  cruise ceiling.

## Slice 4: plasma's charge light (medium, after 2)

- The bead as a cached stamp, drawn in the live LFX pass
  (`FlightFx.drawLfx` in `packages/mode-a/src/lib/gravity-fold-fx.ts`; the pass
  is `ion-beams` in `flight-frame.ts` and today draws weapons only), with its
  trace stamped into FX.
- `docs/specs/game/render/lfx.md` and the effects spec gain engine light on LFX.
- Checks: fidelity as in slice 3, during the charge; pause redraws the bead
  without adding brightness; reset clears it.
- Known risk: the bead is twice a Wasp's length across at the press. Look at a
  Scout (two side engines) and a Corvette (up to five mounts) before calling it
  done.

When slices 3 and 4 are in, the study's dated examples (02.6, 02.7) replace
plasma's light with their own, so they keep showing what they describe.

## How the work has been run

Each slice: a developer agent implements, an independent reviewer checks, at
most three loops, then the lead re-runs every check. That caught real things in
slice 1: stale Hangar text, a tuning number in a spec that keeps none, a browser
test that raced a 200 ms window, and a round where the engine uses a ceil.

Rules that have mattered:

- Tests assert relations, never design or tuning values.
- Specs state the intended contract only. `docs/specs/game/parts/spec.md` keeps
  no part values.
- Do not edit `docs/history/**`, other `docs/plans/**` files, or dated study
  records, except to mark a slice delivered in the study's part 04.
- Mark each delivered slice in part 04 of the study page, as slice 1 is.

Checks:

- `pnpm exec vitest run`
- `pnpm exec tsc -p tsconfig.check.json`
- `pnpm --filter web exec astro check`
- `pnpm --filter web exec svelte-check --tsconfig ./tsconfig.json --fail-on-warnings`
- `pnpm exec biome check <touched files> --error-on-warnings`
- `pnpm exec playwright test tests/browser/flight-scene-instrument.spec.ts tests/browser/builder.spec.ts tests/browser/ion-flight.spec.ts tests/browser/render-model.spec.ts`

Known noise on 11 November, not from this work: lint fails on
`docs/plans/2026-11-10-part-01-question-rubric.md`; `svelte-check` warns twice in
`apps/web/src/components/studies/ActionLinkLine0213.svelte`. Running several
browser specs while other heavy work is going on made instrument tests time out;
they pass on their own.

## Left open

- Fission's Hangar text ("0.18s pulse / 0.45s cycle") is hard-coded in
  `ShipBuilder.svelte`, as plasma's was.
- The instrument spec has one unchecked item: no browser test covers the
  instrument showing no menu when no pane is passed.
- The engine-light stamp-gap blocker (`2026-11-10-fx-stamp-gaps-blocker.md`)
  applies to the plasma ball too.
- The effects skill (`.agents/skills/fx-development/SKILL.md`) says effects use
  delivered output, not button state. After slice 2 it should mention charge;
  that folder was not writable from the session that wrote this.
