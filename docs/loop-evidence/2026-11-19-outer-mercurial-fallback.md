---
generated:
  by: "codex/gpt-6"
  at: "2026-11-19T21:17:12+02:00"
---

# Outer Mercurial fallback · 19 November 2026

## Intent and decisions

Add a second Mercurial in generated, non-Practice systems when the existing
inner-pair eligibility rule leaves only one inside Sun charging. The user
confirmed the fallback belongs beyond Habitable: “yes, its the outermost planet,
.3 technically”. Systems eligible for two inner Mercurials keep that layout.

The implementation interprets 10% overlap as the depth along the line of centers
at closest approach, measured against the smaller gravity-field radius. The
assistant stated this convention during implementation; the user did not
separately specify a radius, diameter or area convention. Circular orbits use
independent angular speeds, so this is not permanent field overlap.

This bounded loop follows the earlier
[Mercurial generation and instruments record](2026-11-19-mercurial-generation-and-instruments.md).
That record's commits and verification are separate historical evidence.
Habitable generation and materials already existed in the dirty checkout when
this request began; they were not delivered by this fallback loop.

## Changes delivered

- [Solar-system generator](../../packages/mode-a/src/lib/solar-system.ts): reuse
  the independently seeded outer Mercurial candidate when the inner pair cannot
  fit. Place it beyond Habitable at `DH + GH + G2 − 0.1 × min(GH, G2)`, start it
  at Habitable's orbital angle, retain 4u/s travel, and reject placement when the
  body reaches the 1200u warp boundary. Include it in mandatory-body pruning.
- [Generator tests](../../packages/mode-a/src/lib/solar-system.test.ts): exercise
  both layouts over seeds 1–1000, including fallback ordinal 3, outside-charging
  placement, field overlap, atmosphere clearance, translated positions and mass.
- [Habitable tests](../../packages/mode-a/src/lib/habitable-world.test.ts): count
  only preceding Mercurials for Habitable's ordinal and inner-body clearance.
- Updated the [system contract](../specs/game/world/systems/spec.md),
  [planet contract](../specs/game/world/planets/spec.md) and
  [Habitable contract](../specs/game/world/planets/habitable/spec.md). They remain
  drafts. Source and contract links were inspected again during closure.

## Revision and publication

Implementation and closure use branch `feat/0-7-0`, based on
`f8b9cba793ede22254ef1a1e3523f8ab089bef88`, with a broadly dirty shared checkout.
The diff from HEAD includes earlier Habitable work as well as this fallback;
it is not an isolated fallback patch. No commit, push, deployment or production
verification was performed for this loop.

These SHA-256 values identify the relevant files as read at closure. They are
not a fingerprint of the complete tested tree or proof that the entire checkout
remained unchanged between checks:

- `packages/mode-a/src/lib/solar-system.ts`: `4651b857a4a1ad8541ec7c1a45abb687a621556237b60273b1d0801f701403e4`
- `packages/mode-a/src/lib/solar-system.test.ts`: `0557cb82fac9dad3a80c8c02458aa0c670084e41cd1a5f0ea8667b0009156dd6`
- `packages/mode-a/src/lib/habitable-world.test.ts`: `419d5aad2ed219f176637472178958f05326a450a550f2c7f44b04f643586283`
- `docs/specs/game/world/systems/spec.md`: `c2870c5940020b32677ef547928de162e94c1ff678465775481b81180ee064be`
- `docs/specs/game/world/planets/spec.md`: `d37514e3034ea62530e7901e9485316c01ce221c9e0e4a7a96d01e01f4cff216`
- `docs/specs/game/world/planets/habitable/spec.md`: `49275b881202b8296fe30a86c6e11101834bfba3e4dd136f74c98e1aa81b5143`

## Checks and observations

All results below come from tool output in this chat during implementation on
19 November 2026, around 21:12–21:14 Helsinki time. They concern the dirty local
macOS checkout, not a release. No checks were rerun to reconstruct evidence at
closure; raw command reports were not retained as versioned files.

| Check | Outcome | Scope and limits |
| --- | --- | --- |
| `pnpm test packages/mode-a/src/lib/solar-system.test.ts packages/mode-a/src/lib/habitable-world.test.ts packages/mode-a/src/lib/practice-venus.test.ts` | Passed: 3 files, 10 tests | Initial targeted implementation run. |
| `pnpm test packages/mode-a/src/lib/solar-system.test.ts packages/mode-a/src/lib/habitable-world.test.ts packages/mode-a/src/lib/practice-venus.test.ts packages/mode-a/src/lib/simulation.test.ts packages/mode-a/src/lib/gauntlet.test.ts` | Passed: 5 files, 35 tests | Final targeted run, 21:14:29 Helsinki. Not the full suite. |
| `pnpm exec tsc -p tsconfig.check.json --noEmit` | Passed | This command only; the full `check:types` pipeline was not run. |
| `pnpm exec biome check --error-on-warnings packages/mode-a/src/lib/solar-system.ts packages/mode-a/src/lib/solar-system.test.ts packages/mode-a/src/lib/habitable-world.test.ts` | Passed: 3 files | Initial non-null assertion warnings were removed before this check. |
| `pnpm check:specs docs/specs/game/world/systems` and `pnpm check:specs docs/specs/game/world/planets` | Passed: 0 findings each | Final runs include updated provenance. |
| `pnpm check:specs docs/specs/game/world` | Failed: 6 findings | Existing derelict spec: missing frontmatter/headings and history wording; no derelict changes in this loop. |
| `pnpm check:contracts` | Failed | Contract/link phase passed, including 307 Markdown files with no missing targets. Factory tests failed reading a missing temporary `artifacts/emulator-stopped` marker. No root cause established here. |
| `pnpm dev:status` | Failed | Process inspection denied: `Operation not permitted: 'ps'`. |
| `pnpm dev:ensure` | Failed readiness check | Reported `/lab did not become ready`; browser preview nevertheless loaded the System instrument. The mutable `artifacts/shared-preview/astro.log` showed HTTP 200 requests when inspected, not a retained run-specific report. |

The assistant directly inspected the System instrument at localhost port 4321,
viewport 1440×1000. Seed 2026 displayed G14 with two inner Mercurials and
Habitable at .3. Seed 1 displayed G6.1 inside charging, Habitable G6.2 and an
outermost G6.3; the drawn gravity circles overlapped. Exact 10% geometry is
supported by the numerical tests, not measured from the screenshot. Browser
screenshots were shown in tool output but not saved as durable files. The
preview tab was closed and the viewport override reset.

## Feedback, findings and evidence gaps

The user's clarification establishes the intended outermost fallback placement.
There was no subsequent user acceptance statement about the implemented result;
“close loop” requests evidence collection. No human gameplay feedback is
collected in this record.

Direct source inspection and the targeted checks support the two generation
branches and the chosen closest-approach convention. The checks cover sampled
seeds, not every valid seed. The browser observations cover the static System
instrument at two seeds; runtime orbital evolution, landscape touch, a full
release build, backend integration and deployment were not exercised in this
loop. No claim of full release verification follows from the targeted results.

The implementation conversation is the source for command output and browser
observations. There is no saved isolated patch, full tested-tree fingerprint,
run-specific check report or retained screenshot. Temporary factory-test paths
and the shared preview log are not durable evidence. Closure preserves these
limits without deriving lessons or changing project process.
