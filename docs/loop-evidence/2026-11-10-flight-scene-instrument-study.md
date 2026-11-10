# Flight scene instrument study, 10 November 2026

Record of the design-study loop that produced
`apps/web/src/pages/lab/studies/flight-scene-instrument-2026-11-10.astro`
(`/lab/studies/flight-scene-instrument-2026-11-10`). One session on
`feat/0-5-0`, started at `4020683`; HEAD at closure is `9a1a486`. The loop was
closed on the designer's request after the study was paused behind a renderer
fault it surfaced. The study's registry status remains `open`, phase
`exploration`; no end state was set.

## Intent and scope

- The request: a new design study that creates a Lab component like the Motion
  instrument, full container width and snapping into place while scrolling,
  with the same burns and time slider, but with a large pane showing the game's
  layers rendered live in place of the graphs, "so we can like see how things
  would look like in the game when a ship does some sort of a burn and, for
  example, shoots with the weapons". The session was asked to go through the
  old studies to understand the use case and formulate the design problem.
- The designer's decisions and changes of direction, in order:

| Step       | Decision or instruction                                                                                                                                   |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| After 01   | Asked whether a rubric or test for "01-preparedness" existed; said "the whole study rubric is stale"; asked for three metrics that could be stamped       |
| After 01   | A clean-context Opus subagent to run the rubric as a test; stamp its results on the page before 02.1; put the rubric in `docs/plans` with this as example |
| 02.1       | Topic left to the agent: "your call on what to explore first"                                                                                             |
| 02.1       | "Keep it, camera next" (a jump re-flies the burn and paints the whole flight's light)                                                                     |
| 02.2       | Began "Game and Game 3×", interrupted it, then: "game, follow, and follow 4x"                                                                             |
| After 02.2 | "now looking at thr 4x, it seems something is amiss. are we rendering the LFX and the FX layers to the field?"                                            |
| After 02.2 | "this is a critical, blocker bug - essentially starting at eee9b6a - no need to go further." "all other work is to be paused"                             |
| End        | "Commit them", then "close loop"                                                                                                                          |
- The agent recommended keeping Game and Game 3× in 02.2. The designer chose
  Game, Follow and Follow 4× instead.

## Changes delivered

| Artifact                                                            | State at closure |
| ------------------------------------------------------------------- | ---------------- |
| Study page, sections 01, 02.1, 02.2 and a placeholder 03            | Committed        |
| Registry entry in `apps/web/src/data/studies.ts`                    | Committed        |
| `components/studies/flight-scene.ts` (scene engine)                 | Committed        |
| `components/studies/FlightScene021.svelte`, `FlightScene022.svelte` | Committed        |
| `docs/plans/2026-11-10-part-01-question-rubric.md`                  | Committed        |
| `docs/plans/2026-11-10-fx-stamp-gaps-blocker.md`                    | Committed        |

Commits holding this loop's files:

- `1358e15` (07:44) and `570ab80` (08:09) are other sessions' commits. Each
  saved the whole tree, which then held this loop's work in progress. Their
  messages do not describe this study.
- `9a1a486` (08:34) is this session's only commit: the 02.2 decision, removal
  of the Game 3× view and the blocker plan. Four files, staged by path; other
  sessions' uncommitted files were left out.

No production code under `packages/` was changed by this loop. The scene
engine copies the flight screen's draw order from `FlightDeck.svelte` by hand.
Another session's `f9fc929` ("define the flight frame once") landed during the
loop; the instrument was not moved onto it.

## Checks

All on a dirty tree shared with other sessions, on the designer's machine, with
this session's dev server at `http://localhost:4331`. The in-app browser pane
was hidden for most of the loop, which throttled animation frames and delayed
component hydration.

| Check                                                  | Outcome                                                                                  |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `pnpm --filter web exec astro check`                   | Passed, 0 errors, after 01, after 02.1 and after each 02.2 change                        |
| `node scripts/check-contracts.mjs`                     | Passed after 02.1 and after the blocker plan was written                                 |
| `biome check` on the changed files                     | Passed after formatting; one formatting failure on the page, repaired                    |
| lefthook pre-commit (biome) on `9a1a486`               | Failed on the first attempt (table formatting in the blocker plan), passed on the second |
| lefthook commit-msg (conventional) on `9a1a486`        | Passed                                                                                   |
| Page at 1280px: section 01, the stamp, 02.1 instrument | Inspected by screenshot and DOM measurement; no horizontal overflow; no console errors   |
| 02.1 pane: opens from the menu, closes on Escape       | Observed once                                                                            |
| 02.2 views render (Game, Game 3×, Follow, Follow 4×)   | Screenshots at 1.67 s and 3 s, before Game 3× was removed                                |
| 02.2 after removal of Game 3×                          | Switch lists three views (DOM); no usable screenshot was obtained                        |
| Playback speed                                         | Not confirmed: 2 s of wall time advanced 0.8 s of flight in the hidden pane              |
| B2 and B3 in the 02.2 views                            | Not checked                                                                              |
| Page at 1280px after 02.2                              | Not checked                                                                              |
| Unit and browser test suites                           | Not run                                                                                  |

Measurements made through the page's canvas, 10 November, B1, 1920 × 1080 frame:

- A jump painting the last second of light differed from one painting the whole
  flight in 0 to 7 pixels at nine instants (ticks 45, 120, 180, 225, 300, 345,
  450, 720, 840), largest channel difference 19.
- A jump painting only the landing instant differed in 784 to 16,346 pixels at
  the instants where an engine or the cannon was lit, and in 0 to 1 at ticks
  180 and 300.
- A jump to tick 840 took about 225 ms painting the whole flight and about
  195 ms painting the last second. Both figures include two animation-frame
  waits.
- Whole-flight painting was not compared pixel by pixel with continuous play.

## Publication

- Local commits: yes, as listed above.
- Push: none by this session. At closure `feat/0-5-0` is 18 commits ahead of
  `origin/feat/0-5-0`.
- Deployment and live verification: none.

## Human feedback

- On the part 01 work: "superp work from my pov".
- Before 02.1: "super happy with work this far."
- On the renderer question: "it feels to me, that we have now broken the
  renderer at some point".
- After the agent's advice to compare with the game: "the same issue seems to
  be in game too." "curious. the zoom hid this this far."
- The designer's stated expectation of the renderer: "we expect to have 2
  bespoke canvases, on top of each other. the FX and the LFX - and for some
  reason the FX seems to render wrong? I expexted this to relate to the LFX
  layer".
- At the blocker decision: "thanks, superb work".

These are remarks on the session's work and on the renderer. None is an
acceptance of the study, which was paused, not ended.

## Findings

1. **The part 01 rubric run.** A clean-context Opus subagent (about 7 minutes,
   26 tool calls, read-only) stamped One subject: Pass, Grounded: Fail,
   Consequence: Pass. The authoring agent's own earlier check had passed all
   three. The Grounded findings were seven misdescriptions in section 01, each
   cited to code; they are listed in the rubric plan. Section 01 was corrected
   and not re-tested. Part 02 began on an instruction given before the result
   was known.
2. **The rubric's wording.** The reviewer passed Consequence "on the merits"
   and noted that the literal test wording, "changes the game concretely", does
   not cover a Lab tool.
3. **Survey of earlier studies.** An Explore subagent read 24 study benches.
   Its report, relayed in the session and not stored, is the source for the
   study's claims about earlier flight views. The rubric reviewer contested two
   of those claims as first written (finding 1).
4. **Cannon activity in the 02.1 scene.** Stepping ticks 1 to 200 on B1 gave
   five `ion-cannon` events (first four at ticks 1, 21, 41, 61), one `break` at
   tick 27 and five discharges in total. After that the scene had no target in
   line.
5. **Both light layers draw at Follow 4×.** Redrawing tick 22 with each layer
   switched off changed about 9,000 pixels for the FX surface and about 5,900
   for LFX.
6. **Striped engine light.** At tick 215 on B1 in Follow 4× the stabilizer
   light appeared as separate parallel beams; at tick 100 the plume showed
   banding. Re-flying with the camera held still at the same place and zoom
   gave the same stripes. Observed by the agent in screenshots of an 8×
   enlargement; the images were not saved.
7. **Same fault in the game.** Reported by the designer from their own check.
   The session did not observe the game directly.
8. **Composition.** By inspection of `FlightDeck.svelte`, `fx-surface.ts`,
   `gravity-fold-fx.ts` and `engine-plume.ts`: one visible canvas; FX is two
   hidden history buffers plus a spare; LFX is painted onto the main canvas;
   engine light is stamped once per `FlightFx.draw` call. This differs from the
   designer's stated expectation of two stacked canvases.
9. **Redraw instability.** Redrawing the same instant in Game view changed a
   few hundred scattered pixels (498 and 532 in two samples). Source not
   traced.
10. **Shared checkout.** Other sessions' commits took in this loop's
    uncommitted work twice. During the loop another session added
    `packages/mode-a/src/lib/flight-frame.ts` and `/lab/render-model`
    (`f9fc929`); this session did not read them.

The agent's explanation of finding 6 (one stamp per frame with nothing filling
the path between stamps, dating from `eee9b6a`) and its proposed way out are
recorded as assumptions in
[the blocker plan](../plans/2026-11-10-fx-stamp-gaps-blocker.md). The designer
accepted `eee9b6a` as the origin and declared the fault a critical blocker; the
session did not bisect.

## Evidence gaps

- No screenshots or comparison images were saved. The frames are reproducible
  from the page: 02.2 scene, Follow 4×, B1, ticks 100 and 215.
- The two subagent reports exist only in the session transcript. The rubric
  plan summarises the reviewer's findings; the survey is not summarised
  anywhere in the repository.
- The still-camera comparison and the per-layer pixel counts were made through
  a temporary debug handle that was removed; no script was kept.
- The designer's observation of the fault in the game has no recorded
  conditions (ship, view, moment).
- Timing figures come from one machine with the browser pane hidden.
- The stamp on the study page departs from the study spec's rule that process
  evaluation stays off the page; the spec was not changed.
- Whether the frame-rate dependence described in the blocker plan occurs was
  not measured.
