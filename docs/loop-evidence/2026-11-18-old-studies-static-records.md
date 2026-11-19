# Old studies to static records — closure evidence

## Intent and scope

On 18 November 2026, the designer asked to follow the [old-studies archive plan](https://github.com/villetakanen/void-drift/blob/ea287baef08cfa4dcc7556e8e6f28de5dae38cb5/docs/plans/2026-11-17-old-studies-to-static-records.md) and take the oldest eligible Astro study. When the ledger showed the earlier `engine-effects` conversion parked in progress, the designer directed the session to finish it first. Subsequent “next” requests took ledger rows 5–12 in order, one study per conversion. This record covers rows 4–12, from the resumed engine-effects work through the ion-ceiling archive. The three earlier conversions on 17 November are described in the plan and are outside this record's checks.

The plan calls for static MDX at the existing URL, versioned captures, a compact account of the study's decisions and uncertainty, retirement of study-only apparatus, and a clean-context editorial review. The [study-page spec](../specs/lab/design-studies/spec.md#closed-pages) calls for closed pages readable with JavaScript disabled. Captures made in these conversions are labeled as reconstructions using code available at capture time; they are not original historical recordings.

The designer said the reviewer was “over zealous” because these are summaries of documents already in Git. The later editorial briefs asked for light wording review while preserving decisions, values and reasons. This feedback concerns the summaries and review approach; it is not a playtest or a general process decision.

## Changes and recorded checks

The commits and paths are directly inspectable in Git. Counts below are rendered words reported by Playwright during each conversion, including the shared page layout. Media counts describe files retained in the record. Engine-effects had been partially saved in `a0e10419` before this session; `d3d1f610` completed its parked conversion.

| Study                                                                                                 | Local commit | Words before → after | Retained media |
| ----------------------------------------------------------------------------------------------------- | ------------ | -------------------- | -------------- |
| [Engine effects](../../apps/web/src/pages/lab/studies/engine-effects.mdx)                             | `d3d1f610`   | 1,824 → 897          | 6 stills       |
| [Heavy cruiser slots](../../apps/web/src/pages/lab/studies/heavy-cruiser-slots.mdx)                   | `966cce5b`   | 3,338 → 608          | 4 stills       |
| [Ship silhouettes](../../apps/web/src/pages/lab/studies/ship-silhouettes.mdx)                         | `28e6914f`   | 3,973 → 531          | 3 stills       |
| [Scout rounded bodies](../../apps/web/src/pages/lab/studies/archive/scout-firefly-rounded-bodies.mdx) | `2b24c35d`   | 206 → 116            | 1 still        |
| [Ship slot language](../../apps/web/src/pages/lab/studies/ship-slot-language.mdx)                     | `30d80629`   | 966 → 500            | 1 still        |
| [Ion engines](../../apps/web/src/pages/lab/studies/ion-engines-2026-10-31.mdx)                        | `bcc2065a`   | 1,935 → 459          | 2 clips        |
| [Scout Firefly](../../apps/web/src/pages/lab/studies/scout-firefly.mdx)                               | `457f403a`   | 3,906 → 562          | 3 stills       |
| [Engine identities](../../apps/web/src/pages/lab/studies/engine-identities.mdx)                       | `53dca7fc`   | 4,330 → 724          | 5 stills       |
| [Ion ceiling rules](../../apps/web/src/pages/lab/studies/archive/ion-ceiling-rules.mdx)               | `ea287bae`   | 185 → 162            | 2 stills       |

Each commit removes the apparatus listed in its static page's final provenance line. Shared consumers were retained; in particular, the ion-ceiling conversion retained the shared `movement-bench`. The ship-silhouettes conversion repaired the study and deleted-component links in its closure evidence; ship-slot-language and engine-identities repaired links to their renamed source pages. Existing historical anchor destinations were retained where checked. The engine-identities record omits its trial balance table because the values live in code; it retains the approved Heavy ceiling and the provisional behavior decisions.

The following are observations reported by the conversion sessions' tool output, not fresh verification at closure. Each run used this macOS checkout with Playwright at 1440 × 900, and `pnpm lint`, `pnpm test`, `pnpm check:types` and `pnpm build`. The working tree contained other sessions' changes and changed between runs; no complete source fingerprint or retained per-run logs identifies those dirty trees. The commit named in the table identifies the resulting study change, not an assertion that the full checks tested that clean commit.

| Study                | Reported command outcomes                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Engine effects       | Test, types and build passed; lint failed in unrelated `FlightSceneInstrument.svelte` and `RifleCharge.svelte`.                                               |
| Heavy cruiser slots  | Test, types and build passed; lint failed in unrelated `FlightSceneInstrument.svelte`, `RifleCharge.svelte` and `rifle-charge.test.ts`.                       |
| Ship silhouettes     | Test, types and build passed; lint failed in unrelated `FlightSceneInstrument.svelte` and `RifleCharge.svelte`.                                               |
| Scout rounded bodies | Test, types and build passed; lint failed in unrelated `FlightSceneInstrument.svelte` and `RifleCharge.svelte`.                                               |
| Ship slot language   | Build and types passed; three tests failed in `ion-cannon.test.ts` and `point-defence.test.ts`; lint failed in `FlightSceneInstrument.svelte`.                |
| Ion engines          | Build passed; the same three tests failed; types failed in `plasma-rifle.test.ts`; lint failed in `LabPlasmaRifle.svelte` and `FlightSceneInstrument.svelte`. |
| Scout Firefly        | Test and build passed; types failed in `plasma-rifle.test.ts`; lint failed in `FlightSceneInstrument.svelte`.                                                 |
| Engine identities    | Build and types passed; three tests failed in `ion-cannon.test.ts` and `point-defence.test.ts`; lint failed in `FlightSceneInstrument.svelte`.                |
| Ion ceiling rules    | Build and types passed; three tests failed in `ion-cannon.test.ts` and `point-defence.test.ts`; lint failed in `FlightSceneInstrument.svelte`.                |

For each conversion, the session reported opening the built page in a fresh context with JavaScript disabled and checking its retained images. The ion-engine session also played both retained clips using native controls. The Scout and engine-identities sessions checked preserved historical anchors, and the ion-ceiling session checked its parent anchor. These observations do not establish behavior at other viewports or human assessment of the visual fidelity.

## Other observations and limits

- The ion-engine and Scout Firefly dev-server examples encountered stale optimized dependencies and failed to hydrate. The sessions used the existing built copy to capture the examples; the two retained ion recordings are reconstructions from that copy. The capture was not evidence that the dev-server issue was fixed.
- The engine-effects original did not explain “fluid transformation” or “balanced ship” more precisely, so the record retained those phrases. The ship-silhouettes reviewer could not resolve whether the original criticism of the first gallery applied to all six hulls or one; its scope was retained. The engine-identities reviewer noted that the first registry entry established integration by 31 October rather than an exact acceptance day; its record says “accepted by.”
- The first entry to remain `todo` after row 12 in the ledger is `path-instrument-2026-11-01.astro`. The backlog beyond row 12 was not converted in this loop. The working copy of the plan also retains a parked-engine-effects narrative that predates completion, even though row 4 is marked done; that pre-existing uncommitted plan text was not reconciled by this closure.
- Check output and browser observations survive in the conversation and commits, not as durable, revision-specific run reports. Temporary screenshots, intermediate captures and test logs under `/tmp` have no retention guarantee. The original interactive pages are available at the Git revisions named in the records; the captures do not reproduce every control state.

## Publication and feedback

All nine listed conversion commits were created locally. The sessions did not report pushing, deploying or verifying a live deployment. This closure did not inspect remote deployment state. Beyond the designer's directions and review preference above, no human playtesting or fidelity assessment is recorded here. The record collects the observed work and its limits; it does not establish release readiness or adoption of any process lesson.
