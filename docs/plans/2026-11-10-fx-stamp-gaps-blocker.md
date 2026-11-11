# Blocker: engine light is a ladder of stamps, not a trail

Written 10 November 2026 on `feat/0-5-0`. Decided the same day: this is a
critical blocker and the primary focus; other work is paused until it is out of
the way. What follows is what we know, what we ruled out, and our assumptions
about the way out. The assumptions are assumptions: check them against the code
before building on them.

> **Current decision (10 November 2026):** The designer has resolved the
> separate rendering-layer-model blocker for further large-game testing. The
> adopted presentation is World normal, FX screen with 12 CSS px / 16 CSS px /
> 90% Turbulent bloom, and LFX hard-light without a filter. This does not close
> the interval coverage, rate independence, or break criteria described here.

## The fault

Light on the effects surface is stamped once per rendered frame at each
source's current position. Nothing fills the space the source crossed since the
last stamp. When a ship moves across its own engine beam by more than the
beam's width between two stamps, the fading history is a row of separate beam
copies instead of a continuous trail. In a straight burn the same thing shows
as banding along the plume.

- **In the game too.** Seen in play as well as in the Lab (designer's check,
  10 November).
- **Since `eee9b6a`** (3 November, "accumulate light on shared fading
  surfaces"), which replaced per-engine trail histories with the shared
  surface. No need to look further back or forward for the origin.
- **Hidden by zoom.** At the game's zoom levels (about 0.4 to 1.6) the gaps are
  one to a few pixels and blend. At 4× they are plainly separate beams.

## How it was found

The Flight scene instrument study (`/lab/studies/flight-scene-instrument-2026-11-10`)
plays the Motion instrument's burns through the production simulation and
renderers. Its Follow 4× view, accepted in 02.2, magnifies beyond any zoom the
game reaches.

Reproduction, deterministic:

- Page: `/lab/studies/flight-scene-instrument-2026-11-10#camera`, the 02.2 scene.
- View: Follow 4×. Burn: B1. Time: 3.58 s (tick 215), the first left turn.
- Ship: starter Wasp with a Light Ion Cannon on `hull[0]`, Derelicts rules,
  encounter held off, production start position.
- Straight-burn banding: same scene at 1.67 s (tick 100).

No images were saved; the page reproduces the frame exactly.

## How light is actually composed

This differs from the expectation of two stacked canvases, FX and LFX.

- **One visible canvas.** `FlightDeck.svelte` draws world, ship, FX and LFX onto
  it, in that order (lines 378–436).
- **FX** is `FxSurface` (`packages/core/src/lib/effects/fx-surface.ts`): two
  hidden history buffers the size of the game canvas, plus a spare for
  reprojection. Each `draw` fades them by game time (half-life 0.1 s), lets
  sources stamp fresh light, and adds the result onto the main canvas.
- **LFX** has no canvas. `FlightFx.drawLfx` paints the 80 ms weapon ray straight
  onto the main canvas after FX, fresh every frame.
- **Engine light is FX only.** `FlightFx.drawShip` calls `sim.plume.stamp`,
  which paints each active outlet's whole beam once
  (`packages/core/src/lib/effects/engine-plume.ts`, `stamp`). `EnginePlume`
  holds current outlet state only; it has no previous position.
- The effects spec leaves layering open ("Buffer count and renderer APIs remain
  implementation choices", `docs/specs/factory/effects/spec.md`).

## Ruled out

Each was tested on the reproduction above.

| Suspect                                | Test                                                                   | Result              |
| -------------------------------------- | ---------------------------------------------------------------------- | ------------------- |
| LFX layer                              | Redrew the instant with `drawLfx` switched off                         | Stripes unchanged   |
| Camera movement resampling the buffers | Re-flew the burn with the camera held still at the same place and zoom | Stripes identical   |
| FX or LFX not reaching the scene       | Redrew with each layer off and counted changed pixels                  | Both layers draw    |
| The instrument's own draw order        | The designer saw the same fault in the game                            | Not instrument-only |

Moving the camera does blur the history slightly, since the buffers are
resampled each tick. That is a separate, smaller effect and not this fault.

## What we have not checked

- Whether a later change made it worse (faster ships, a thinner beam). The
  origin is settled; the severity over time is not.
- Other sources on the same surface: weapon ray dispersal, gravity fold arcs,
  the arrival speed line, derelict energy light, sparks. Any source that moves
  between stamps should have the same gap. Only engines were looked at.
- Frame rate. The game steps the simulation in a fixed-tick loop but calls
  `flightFx.draw` once per rendered frame. A frame that covers two ticks would
  stamp once across twice the distance; a frame with no tick stamps nothing. We
  expect gaps to grow on dropped frames and have not measured it.
- The existing guards: `tests/browser/fx-surface.spec.ts` and
  `engine-plume.test.ts` came in with `eee9b6a`. We did not read what they
  assert; neither caught this.
- Redrawing the same instant in Game view changes a few hundred scattered
  pixels. Source not traced; probably unrelated.

## Assumptions about the way out

1. **The surface stays.** The fault is in emission, not in accumulation or
   layering. Giving LFX its own canvas would not change the stripes.
2. **Fill the path between stamps.** Each source stamps along the line from its
   previous pose to its current one, position and angle both, either as several
   stamps at proportionally lower opacity or as one swept shape. `EnginePlume`
   needs to keep the previous outlet pose for this.
3. **Stamp count follows distance.** Enough stamps that the spacing stays under
   the beam's width at the current zoom; a still source keeps one. Sub-stamps
   draw on the scene-wide budget, so the count needs a cap and the budget rules
   need a look.
4. **Emission should follow ticks, not frames.** If stamping is driven per
   simulation tick, or interpolated across the ticks a frame covered, frame
   rate stops changing the picture.
5. **Breaks stay breaks.** Arena wrap, reset and `plume.clear()` must not draw
   a connecting streak (effects spec, "Time and space").
6. **Brightness is preserved.** Total light per unit of game time should match
   today's at rest, so accepted effect looks hold where nothing moves.
7. **It applies to every moving source**, with engines first because they are
   always on screen.
8. **The fix needs a guard that zoom cannot hide.** A test that asserts a
   relation, not a pixel value: along the path a source crossed between two
   stamps, light does not drop to nothing. Plus a visual check at Follow 4×.

Assumptions 2 to 4 are the design choice. Sub-stamps and a swept shape will
look different, and which one reads as the game's engine light is a judgment
to make by looking, not something code settles.

## Shape of the work

A larger phase. Rough order, each step usable before the next:

1. **Pin the reproduction.** Keep the Flight scene 02.2 scene as the reference
   and add the relation test from assumption 8, failing today.
2. **Choose the fill** on engines: compare sub-stamps and a swept shape in the
   instrument at Follow 4× and at Game zoom, on B1's turn and straight burn.
3. **Implement for engines** in `engine-plume.ts` and `FlightFx`, with the
   break and brightness rules.
4. **Tie emission to ticks** (assumption 4) and check at uneven frame rates.
5. **Carry it to the other sources**, one at a time, each checked the same way.
6. **Check the budget and frame time** on `/lab/fx`.
7. **Update the effects spec** in the same change as the behaviour.

## What is paused

- **Flight scene instrument study:** open, in exploration. 01 is stamped, 02.1
  (time) and 02.2 (camera: Game, Follow, Follow 4×) are settled. Next would
  have been the scene around the ship, then layout. The instrument is usable
  as it stands and is the reproduction for this bug.
- **The part 01 question rubric**
  ([planned rubric](2026-11-10-part-01-question-rubric.md)): written up, one
  run, not adopted.
