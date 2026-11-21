# Service ion and the ion engine family

## Intent and decisions

On 17 November 2026 the designer asked what it would take to bring the
maintenance drive study (`maintenance-drive-2026-11-17`) into the game, and
asked that the study be read as a designer's proposal to engineering, not as
correct by default. The engineering review, the plan and the decisions are in
[the plan](../plans/2026-11-17-service-ion-and-ion-family.md).

Decisions the designer stated in chat, 17 November 2026:

- The drive's intent is slower acceleration, giving lower speeds in the default
  burns of the flight and path tools and in playtests. The engineering finding
  that cruise speed barely changes (+1 u/s) was called a documentation issue,
  not a design change.
- Ion engines become a proper catalog part family.
- The diagonal marking is a design-system mark for parts that are "for testing
  only", separate from sanctioning; fitting such a part stays a deliberate
  downside even if it reaches ranked play. Carried by the design system only;
  `docs/design.md` unchanged.
- The 1 u aft offset belongs to the part, on every hull: "This engine is so
  small, it needs to sit closer to the 'bottom' of the slot."
- Part art has an SVG master, technical artefacts and a design-system page:
  "new parts need to have, old parts get one when we touch them - keep the debt
  on existing for now".
- The marking is static art on the part, not placed per hull.
- After engineering reported that the heavy ion draws 2× at 1.75× thrust, the
  designer stated the ion draw curve is intentionally non-linear above strength
  1 (diminishing returns), and asked for it to be explained on the propulsion
  page.
- Steps 2 and 3 of the plan were done together, starting from the SVG master,
  at engineering's proposal and the designer's "Yes, start".

## Delivered changes

Local commits on `main`, in order:

- `f0fd3e34` docs: parts, design-system and ships specs, and the plan.
- `3c7ae739` refactor: ion engines as a catalog family (strength and beam on
  the catalog; core `paintBeam` takes a beam; flight, plume, Hangar side list,
  instrument mapping and propulsion page read the catalog; Scout reads engine
  fronts from art; eight preserved studies moved to the beam API). Also
  corrected the parts spec's ion draw rule, which this loop had written wrongly
  earlier the same day.
- `ff3f2893` feat: Service ion catalog entry, part `mount` and `testingOnly`
  fields, SVG master `packages/mode-a/src/lib/art/engines/service-ion.svg`,
  converter `scripts/engine-art-from-svg.mjs`, generated
  `service-ion-art.ts`, testing-only marking (`testing-marking.ts`), Hangar
  card marking, `/lab/ds/engines`.
- `87be573b` docs: plan step 4 recorded; it needed no code.
- `4463ee28` docs: ion engine draw section on `/lab/ship-propulsion`.

Each commit contains only this loop's files; the shared checkout held other
sessions' uncommitted work throughout, which was left untouched except as noted
under findings.

## Checks

All runs below happened in this chat on a dirty shared tree (other sessions'
uncommitted study work present), macOS arm64. Logs were written to the
session's temporary directory and are not retained.

| Revision context  | Command                       | Outcome                                                                                                                                                               |
| ----------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Before `f0fd3e34` | `pnpm check:contracts`        | Passed.                                                                                                                                                               |
| Before `3c7ae739` | `pnpm check:types`            | Passed.                                                                                                                                                               |
| Before `3c7ae739` | `pnpm vitest run`             | Passed, 249 tests (5 new in `ion-family.test.ts`).                                                                                                                    |
| Before `3c7ae739` | `pnpm lint`                   | Failed: one error in another session's `drive-family.ts` (`useIterableCallbackReturn`, present at HEAD); this loop's import-order error was fixed.                    |
| Before `3c7ae739` | `pnpm check:contracts`        | Passed.                                                                                                                                                               |
| Before `ff3f2893` | `pnpm check:types`            | Passed after fixes (a study's exhaustive part map; Vite glob typing in the parity test).                                                                              |
| Before `ff3f2893` | `pnpm vitest run`             | Passed, 255 tests (6 new in `engine-masters.test.ts`, including SVG-master parity).                                                                                   |
| Before `ff3f2893` | `biome check` on its 16 files | Passed after fixes.                                                                                                                                                   |
| Before `ff3f2893` | `pnpm check:contracts`        | Failed on another session's link: `docs/factory-report-design-study-form-drift.md` → `studies/buttons.astro`. Not rerun after that session's later commit `f1727c35`. |
| Every commit      | lefthook pre-commit (biome)   | Passed; the first attempts of `f0fd3e34`, `3c7ae739` and `4463ee28` were rejected for formatting and recommitted after formatting.                                    |

Not run in this loop: `pnpm verify`, `pnpm build`, browser journeys, Firestore
rules, competition tests.

Browser observations (built-in browser, the designer's dev server at
`localhost:4321`):

- `/lab/render-model` drew the light ion plume after `3c7ae739`'s changes.
- `/lab/ds/engines` showed the Service ion's master, four poses, plume, Hangar
  card drawing and the part on the Wasp. Enlarged, the Wasp view was compared
  by eye with the study capture `026-marking.png`: drive low in the slot, left
  rail light, right rail dark, stripes on the right side.
- `/lab/ship-propulsion` listed the Service ion at +1 u/s and, after
  `4463ee28`'s change, the draw table: Service ion 0.33 / 0.58 / 1.00, light
  ion 1.00 / 1.75 / 1.00, heavy ion 1.75 / 3.50 / 1.14 (strength, draw, draw
  per thrust).
- The game page and Hangar did not load in the agent's browser: the dev server
  answered `504 Outdated Optimize Dep` for `nanostores`, before and after the
  designer restarted the server.

## Publication

Local commits only. Not pushed, not deployed, no live verification.

## Human feedback

- After the loop's changes, the designer reported in chat: "its splendid in
  play". Subject: the Service ion in play. It is the designer's report from
  their own session; the agent did not observe play, and no playtest record
  exists in the repository.

## Findings

- The study's +1 u/s cruise contribution leaves top speed near the light ion's
  (Wasp 421 vs 428 u/s); the designer classed this as documentation.
- The heavy ion draws 2× the light ion at 1.75× thrust; the parts spec first
  written in this loop said draw scales with strength, which did not match the
  code. The spec was corrected; the designer confirmed the curve is intended.
- The Lab instrument's light-ion draw scale (`buildDrain`) still applies to the
  light ion alone; it was left as a reference-part rescale.
- Biome reformats SVG files, including the master; the converter was made
  tolerant of attribute line breaks.
- The SVG-master parity check is a Vitest test, not part of
  `scripts/check-contracts.mjs` as the spec first said; the spec was updated.
- An early `biome check --write` over changed files collapsed one blank line in
  another session's `drive-family.ts`.
- Side poses 1 and 2 of the Service ion were derived by a colour rule; the
  study never judged them.

## Evidence gaps

- No retained logs for any check; outcomes above come from this chat.
- No full verification, build or browser-journey run on any of the five
  commits.
- The agent did not observe the Service ion in the Hangar or in flight.
- Light and heavy ion, fission and plasma have no SVG master (accepted debt).
