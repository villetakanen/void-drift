# Ion Point Defence design study, 8–9 November 2026

Record of the design-study loop that produced
`apps/web/src/pages/lab/studies/ion-point-defence-2026-11-08.astro`
(`/lab/studies/ion-point-defence-2026-11-08`). One session on `feat/0-5-0`,
started 8 November 2026 at `512d4ad`; HEAD at closure is `84e304a`. The
designer approved the study on 9 November 2026 (Europe/Helsinki) and asked
for the loop to be closed with their review findings recorded.

## Intent and scope

- The request: a design study for an ion point defence, following the Light
  Ion Cannon study's path. A rotating weapon in a weapon slot whose round base
  reads as the rotating part, following the closest target at a sensible turn
  speed and firing a light-ion shot at half the cannon's range and, assumed,
  half its damage. It is to be the default, reference and starting defence.
  The supplied image (later the SVG) was the likely visual direction.
- Clarifications given mid-loop: starter equipment is equipment the player
  does not have to buy in the final game; most equipment needs a schematic
  bought with credits.
- The designer's decisions, in order:

| Step | Decision                                                                                     |
| ---- | -------------------------------------------------------------------------------------------- |
| 01   | "Framing holds"                                                                              |
| 02.1 | Light Ion Cannon to be fitted beside the turret on every ship for size; 8-unit base diameter |
| 02.1 | Form B, base with turning rim marks                                                          |
| 02.2 | 180°/s: "perhaps the right. feels slow, but 360 is definitely too much"                      |
| 02.3 | 3 shots/s                                                                                    |
| 02.4 | Turret drawn above the hull rejected: "Keep layering"                                        |
| 02.4 | Dorsal cap over a hidden turret rejected: "Accept hidden"                                    |
| 03   | "Yes, write 03"                                                                              |
| 04   | "Yes, write 04" with open choices kept provisional                                           |
| End  | "Study approved."                                                                            |
- After 04 the designer supplied the original SVG and noted that the turret's
  housing is also shorter than the cannon's; the page was corrected to state
  the shorter barrel, channel and housing measured from the SVG.

## Changes delivered

None of this loop's work is in a commit made by this session.

- Commit `84e304a` (another session's close-loop commit, 8 November 20:55)
  saved the whole tree, which then held this loop's early state: the part 01
  page, its registry entry and `concept.png`. Its message does not mention the
  study.
- Uncommitted at closure, in the shared working tree:
  - `apps/web/src/pages/lab/studies/ion-point-defence-2026-11-08.astro`:
    parts 01–04.
  - `apps/web/src/components/studies/PointDefenceTurning.svelte`: study
    fixture with `form`, `speed`, `shot` and `fitting` modes.
  - `apps/web/src/data/studies.ts`: entry with `status: "accepted"`,
    `phase: "scope"`; status set at closure on the designer's approval.
  - `apps/web/public/studies/ion-point-defence-2026-11-08/concept.svg`: the
    supplied SVG, copied from the designer's `public/ion-weapons.svg`.
- `public/ion-weapons.svg` at the repository root remains untracked, as the
  designer placed it.
- Other sessions' uncommitted changes were present in the same tree (camera,
  starfield, FlightDeck, specs) and are not part of this loop.
- No production code, spec or `docs/design.md` was changed. The page states
  that no `docs/design.md` change is proposed.

## Checks

All on the dirty working tree described above, at HEAD `512d4ad` then
`84e304a`, on the designer's macOS host.

- `npx biome check --error-on-warnings` on the changed study files: passed
  after each round.
- `pnpm --filter web exec svelte-check --tsconfig ./tsconfig.json --fail-on-warnings`:
  passed after each round. Two intermediate runs reported one
  `state_referenced_locally` warning, fixed before the round ended.
- Browser inspection in the local dev server (port 4331) at a 1280×900
  emulated viewport: each round's section rendered; console checked.
  - The 02.4 two-column example first threw `Cannot read properties of
    undefined (reading 'turn')` (an aim array sized for three columns); fixed
    and re-inspected. A stale copy of that error remained in the console
    buffer afterwards.
  - Collapsed and open state of 02.1–02.3 confirmed by script on the rendered
    page.
- Not run: unit, browser (Playwright), contract, build or factory gates. No
  production code changed.

## Publication

- Local commits: none by this session (see `84e304a` above).
- Nothing pushed, released, deployed or verified live.

## Human feedback

The designer's review of the approved page, 9 November 2026, given with the
instruction "Do not act on these, on the page." Paraphrased closely:

1. **Project context in the study.** The 03 paragraph beginning "Starter
   status cannot be delivered yet" relates project scheduling and unconfirmed
   plans to the study. That information was background meant to steer the
   work. The designer asked whether such context slipped into 02 as well and
   said the whole page must be reviewed so that such assumptions do not live
   in the exploration.
2. **"Four choices remain open."** In the designer's reading this narrates
   something that is not true. Damage, energy, reserve and tracking range were
   givens, to be approved at the implementation or specification stage; the
   presentation and narration are weak.
3. **Repetition.** Much of the page's text is repetitive and tends to say the
   same things two or three times.

## Findings

- **F1, context sources in 03.** The paragraph cited by the designer draws on
  `docs/specs/game/hangar/spec.md` ("Decisions reserved for later scope") and
  `docs/plans/2026-11-08-ion-storm-0-6-0.md` ("Out of scope unless separately
  decided"). These were read during the readiness round. Not yet established:
  whether 01, 02.x or 04 carry similar context. 04's delivery boundary also
  mentions starter status and the economy contract.
- **F2, "open choices" wording.** 03 presents damage, energy, reserve policy
  and tracking range as remaining open choices; 04 repeats them as
  "Confirm before implementing". Damage at half the cannon's was given in the
  request as an assumption. Energy, reserve and tracking range were not
  discussed with the designer during exploration.
- **F3, repetition.** Not measured. The designer's observation covers the
  whole page. One visible instance is the accepted values (form B, 8 units,
  180°/s, 2°, 3 shots/s, 100 units), which are restated in the 02.x outcome
  paragraphs, in 03's first paragraph and in 04's first paragraph.
- **F4, starter-loadout statement corrected mid-loop.** In the part 01
  handoff the session said in chat that the red laser is in the starter
  loadouts. Inspection of `starterLoadout` showed no weapon in any starter
  loadout; the session corrected the statement in its next reply.
- **F5, concept caption corrected mid-loop.** The first caption called the
  left object in the concept image the Light Ion Cannon; it is a fitted ship.
  Corrected in the 02.1 round.
- **F6, access to the supplied SVG.** macOS privacy settings blocked shell and
  file reads of `~/Desktop/ion-weapons.svg` even after folder access was
  granted. The study used a PNG trace until the designer placed the file in
  the repository. Measured afterwards, the trace agrees with the SVG's turret
  proportions (housing 7.95 against 7.94 SVG units). The SVG's base is about
  8.9 world units at the cannon's 16-unit scale, against the 8 units selected
  in 02.1. The session asked whether to keep 8 or match 8.9; the designer did
  not answer that question before approving the study.

## Evidence gaps

- The page review the designer asked for (finding 1) has not been carried
  out. The extent of context drift beyond the cited 03 paragraph is unknown.
- No rendered captures of the interactive examples were retained in the
  repository; screenshots exist only in the session's temporary tool-results
  directory.
- The study fixture traces the PNG, not the SVG; its base lighting differs
  from the SVG's gradients. This is recorded on the page for production, not
  verified in a rendered comparison.
