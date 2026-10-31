# Planet-purpose study: closure evidence

Removal update — 29 October 2026: the designer subsequently requested deletion of
all failed study application payloads. Their pages, dedicated demos, catalogue
entries, and obsolete test were removed. Historical artifact paths below identify
removed files, not retained deliverables. This later instruction supersedes earlier
artifact-retention instructions; written evidence and lessons remain available.

Date: 29 October 2026. Cycle: `planet-purpose-2026-10-29` only.
Outcome: designer declared the entire study unsuccessful, requested a retrospective,
and explicitly cancelled integration. Interpretation is recorded separately in
[the retrospective](../factory-experiment-planet-purpose-scope.md).

## Intent, changes, and decisions

The initial request covered planetary roles: spectacle, gravitational slingshots,
and collision danger, including sun-orbiting planets and planet-orbiting moons.
The study delivered a progressive page and four local study components:

- Study page (removed source: `apps/web/src/pages/lab/studies/planet-purpose-2026-10-29.astro`).
- Close-pass replay (removed source: `apps/web/src/components/studies/ClosePassStudy.svelte`).
- Gravity and entry-momentum comparisons (removed source: `apps/web/src/components/studies/GravityProfileStudy.svelte`).
- Orbital diagram (removed source: `apps/web/src/components/studies/OrbitalHierarchyStudy.svelte`).
- Full visual context and proposals (removed source: `apps/web/src/components/studies/OrbitalVisualStudy.svelte`).

Human decisions in the conversation selected the middle gravity profile, accepted
the clean-flyby example for the time being, and judged the revised moon arrangement
acceptable. Corrections established independent body size and gravity reach,
moon reach < moon orbit radius < parent reach, and containment of the orbit only.
The final gravity clarification applied the shared law to every gravity well,
including the sun. Planet visual proposals were not accepted.

An independent agent reviewed the proposed integration using all eight criteria:
four Ready and four Conditional, recommending a bounded unranked trial. Its
source-and-conversation review did not include independent play or test execution.
Its report and the lead’s earlier assessment remain on the study page.

The designer subsequently closed the cycle and instructed: “We will not integrate
anything.” This supersedes prior integration direction. The designer said the
method/skills worked and attributed the failure to the problem’s excessive scope.
These are attributed human assessments, not independently established causes.

## Revision and provenance

HEAD inspected at closure:
`e31ba88d9cb0f7af9fd3b1b247f1ccff1f9dee42`
(`feat: add evidence-only loop closure skill`). The study remains uncommitted.

The working tree was already dirty at this cycle’s start, including the study skill,
layout, index, metadata, specifications, earlier planetary studies, and Physics.ts.
This cycle added its own page/components and modified study metadata. The pre-existing
Physics.ts change is not a production integration from this cycle. No new local
commit, push, deployment, or live verification was performed by this cycle. No
production changes are made as part of closure.

## Verification evidence and limits

These are earlier checks of successive dirty working-tree versions, not a single
full release verification or checks at the HEAD commit:

- `pnpm check:types`: observed passes after study revisions. Retained temporary
  logs include `/tmp/independent-review-types.log` and `/tmp/moon-reach-types.log`.
- `pnpm build`: observed passes; latest gravity-scope build retained at
  `/tmp/gravity-scope-build.log` before closure.
- Scoped `pnpm exec biome check`: passed for the changed study files after fixes.
- `pnpm check:contracts`: observed passes during development.
- Local Chromium inspection against `http://localhost:4324`: observed playback,
  sliders, toggles, eight independent rubric rows, and no horizontal overflow at
  a 390-pixel viewport. Temporary scripts include `/tmp/check-moon-rules.cjs` and
  `/tmp/check-independent-review.cjs`; captures include `/tmp/moon-rules.png` and
  `/tmp/independent-planet-review.png`.

Failures and unavailable checks are retained distinctly: initial restricted-browser
launch failed; the development server had an outdated optimized dependency and
could not hydrate the example, so built preview was used; several browser attempts
failed due to loading/hydration timing or screenshoting a display-contents element.
Type/lint checks caught missing button types, invalid accessibility markup,
a component-props typing issue, and a captured-initial-state warning; these were
repaired before the reported later passes. Failed attempts were not passes.

The full `pnpm verify` release gate, physics/unit suite, browser regression suite,
Firestore rules/emulator checks, competition checks, and sustained performance
measurement were not run for this cycle. Human control-based play of the combined
moon/parent system was not completed. No such evidence is inferred from the replays.

Closure validates only the changed documentation/administrative page source; it does
not rerun gameplay checks to fill historical gaps. Closing edits postdate the logs
above, so those logs do not verify the final closed page revision.

## Retention gaps

The full conversation is in this chat, not a separately exported transcript. Logs
and captures under `/tmp` are temporary. No source fingerprint accompanied those
per-command checks; a precise historical dirty-tree snapshot is unavailable.
Live factories/physics are dependencies of study examples, so future shared changes
could alter their output. The independent review identifies that risk; closure does
not retrofit a frozen simulation. The durable record summarizes the essential
findings without claiming the artifacts are immutable or released.
