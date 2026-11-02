# Potential Well — design, implementation and release

Closed 2 November 2026. Scope: identify and draw the normal/heavy resource-capacity
fitting, implement the accepted design and release 0.4.9. This record collects
evidence; it does not evaluate the design process or derive lessons.

## Intent and decisions

The owner requested a fresh study, separate from earlier studies, grounded in
production ships, engines and the accepted utility family. Gameplay givens were
100 intrinsic capacity, +85 normal, +140 heavy and twice the normal mass for heavy.
The device is static, fits above or below hulls, and uses #CEDB17 on structural
connections. Its footprint may exceed its slot.

Conversation clarified that the energy meter represents the ship’s varied material
and energy needs, replenished through sunlight and gravity. The selected fiction
is multiple containment units holding potential in subspace. The owner approved
“Potential Well” and the description: “A bank of well containment units stores
potential in subspace, ready to supply the ship with matter and energy as needed.”

The study progressed through nine identities in text and successive visual rounds.
The owner retained ring arrangements and original nested cradles, rejected layered
rims and beveled supports as “too fake-3d,” and retained the idea of underlying
supports. The selected normal is 02.7 Close coupling, refined in 02.8: scale 0.55,
no yellow extensions beyond the two wells, yellow inter-well connectors, grey
lattice and ship-aligned upper-left lighting. On that revision the owner said
“yes, perfect.” The owner subsequently selected heavy 02.9 A / Larger containment
wells and requested readiness, scope, implementation, lint repair and release.
These approvals concern those particular designs, not a general rendering rule.

Study: [resource-capacity-2026-11-02](../../apps/web/src/pages/lab/studies/resource-capacity-2026-11-02.astro).
Implemented contract: [ship builder](../specs/ship-builder.md).

## Delivered revisions and publication

- `9dd3d33d0d8e9c4bc5e10f16e335588b43a66702`: implementation, study and 0.4.9
  version bump; pushed to `feat/0-4-0`, tagged `v0.4.9`, deployed to Firebase.
- `3740cfe`: release evidence, committed and pushed after deployment; not a new
  application deployment.
- Existing `battery` saves remain valid for normal Potential Well. Normal mass is
  18, heavy mass 36; capacity effects are +85/+140. The catalog, builder, flight and
  Lab use shared procedural definitions and the approved description.
- The study status is accepted. Unrelated local studies and workflow changes were
  preserved and excluded from the feature release commit. Their lint-only fixes
  remain local with those files.
- Live publication: [Void Drift](https://void-drift-alpha.web.app), including the
  [fleet comparison](https://void-drift-alpha.web.app/lab/utility-artwork#potential-sizing).

## Checks and observed failures

The following were directly inspected in this conversation. Earlier working-tree
runs were dirty and included unrelated work; they are not clean-revision passes.

| Evidence                                                       | Outcome and conditions                                                                                                                                                                                                       |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm verify`, `2026-11-02T19-07-05.116Z-O6Sz3f`               | Failed: lint and restricted local server/emulator startup. Other passed stages remain individually recorded.                                                                                                                 |
| `pnpm verify`, `2026-11-02T19-08-02.685Z-Ugh6Wv`               | Failed: lint and occupied browser ports 4322/4323. Rules passed.                                                                                                                                                             |
| `pnpm verify`, `2026-11-02T19-09-02.924Z-zV7fNI`               | Dirty-tree run on ports 4342/4343: 119 unit tests, types, build, rules and competition passed; 28/29 browser tests passed. Scout still selected the retired Energy storage name. Lint identified unrelated study formatting. |
| Scout browser recheck                                          | First rename matched both normal and heavy names. After anchoring the selector, all three Scout tests passed. [Retained log](../../artifacts/potential-well/scout-recheck.log).                                              |
| Clean release `pnpm verify`, `2026-11-02T19-15-55.051Z-xLMhLd` | Passed every stage at `9dd3d33`, clean detached checkout, unchanged source fingerprint. Contracts, commit checks, lint, types, 119 unit tests, build, 29 browser tests, rules and competition passed; no stages skipped.     |
| Final workspace `pnpm lint`                                    | Passed after formatting the pre-existing study and documentation files. This does not imply their unrelated contents were released.                                                                                          |

Clean release environment: macOS arm64, Node v26.8.2, pnpm 10.33.0, local Java 21,
browser ports 4342/4343 and demo Firebase emulators. The immutable run’s report and
step logs are retained in [release verification](../../artifacts/releases/0.4.9/verification/report.json).
Its source fingerprint is `540a5b78c5afd012d432c5847b12503f6ade048e3708e1a467a6532c4d1144b1`.
Report log paths name the original run directory in the temporary release checkout;
the copied log files are adjacent to the retained report.

## Deployment and live evidence

The first Firebase deployment succeeded, and the live menu displayed 0.4.9, but
leaderboard access failed. Inspection of the built bundle found no production
Firebase project configuration. Rebuilding the same unchanged source with existing
public Firebase variables supplied explicitly, and emulators disabled, embedded
the production project. Hosting was redeployed successfully. A fresh leaderboard
page then loaded shared scores. No production test score was submitted.

Live UI inspection confirmed the 0.4.9 menu and Potential Well equipment label,
the normal/heavy fleet comparison, and authenticated score reads. This is separate
from the emulator competition test and from the successful deployment command.
See [release record](../releases/0.4.9.md) and [final deployment log](../../artifacts/releases/0.4.9/deploy.log).
The release record contains a build-environment recommendation; this closure records
the observed configuration failure and successful subsequent build, without
promoting that recommendation into a standing process rule.

## Findings, limits and retention

- Production mount inspection covered the heavy’s equipment positions on all four
  hulls. Wasp partly covers the device; Scout hides it beneath the hull. These
  existing layering rules were retained, not treated as a newly solved visibility
  design. The comparison tool exposes above/below alternatives for inspection.
- Fine lattice detail is subordinate at flight scale. Owner acceptance of the
  normal and heavy forms does not establish sustained gameplay balance or mobile
  performance. Those were not measured in this loop.
- The full gate passed on the source revision before the production-configured
  rebuild. The same source was rebuilt and smoke-checked live; the gate was not
  repeated against that exact deployment bundle.
- Browser visual observations and owner feedback are recorded in the conversation;
  no standalone archive of those screenshots was retained. No separate eight-part
  study-quality evaluation was completed.
- Verification artifacts and deployment logs are ignored local files, not durable
  Git backups. Temporary build/setup logs live under `/tmp`; their continued
  availability is not assumed. Essential outcomes are summarized here and in the
  committed release record. No credentials or environment values are included.
