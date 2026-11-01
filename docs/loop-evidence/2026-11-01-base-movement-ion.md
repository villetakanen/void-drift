# Base movement and ion integration — 0.4.2

## Intent and decisions

The owner selected free-fall rotation, optional stabilizers in builder and Flight
Lab, and the accepted recessed slit/ion flame appearance. Accepted placements:
Fighter 77% back, 10/90% across, 37.7°; Scout 67%, 38/62%, 67°; Cruiser 76%,
23/77%, 63°. The Cruiser reference includes three Heavy-ion aft engines.
Heavy ion supplies and consumes 1.75 Light ions. Each active stabilizer supplies
0.22 Light force and consumes 0.25 Light energy, regardless of main engine family.
The owner explicitly authorized section 04, integration and a 0.4.x release if
verification found no blockers. Acceleration/speed balance remains for later flight
review; gravity and other engine designs were excluded.

## Delivery and publication

Release implementation: `b3398e3c9252890850d2a10def3e06b7b4cc6aba`, committed and
pushed to `origin/feat/0-4-0`. The commit includes the previously uncommitted study
examples and their preserved alternatives, shared ion/stabilizer model, renderer,
optional switches, schemas, tests and version 0.4.2. Existing unrelated `.claude/`
files were left untouched.

Firebase Hosting deployment completed successfully on 2026-11-01 for
`void-drift-alpha`; no Firestore rules were changed or deployed. Deployment log:
`artifacts/releases/0.4.2/deploy.log`. The built site came from the unchanged source
verified before the release commit. This evidence-only follow-up does not change
the deployed application.

Live browser inspection confirmed `/builder` shows SHIPYARD / 0.4.2, an optional
Ion stabilizers checkbox and Heavy ion at 3.5 energy/s. `/lab/flight` exposes
220/340/0.4/0.8/180 defaults, the stabilizer option, and a shareable configuration
with two Light-ion sides and empty aft mounts. `/leaderboard` loaded existing
shared scores. No live scores were submitted during verification.

## Checks and evidence

Full final `pnpm verify`: all nine stages passed; source remained unchanged during
verification. Report:
`artifacts/verification/2026-11-01T02-15-25.230Z-bB6AEI/report.json`.
The report identifies pre-commit HEAD `8a4b27c`, the dirty tree and its fingerprint;
that verified application source was committed as `b3398e3`.

- Contract checks, commit checks, formatting/lint and strict Astro/Svelte/TS checks passed.
- 89 unit tests passed, including directional ceilings, Heavy force/energy ratio,
  free spin, all-hull crosswise assistance/braking, zero-energy behavior and replay.
- Production build and all 19 Chromium browser tests passed.
- All nine Firestore rule tests and the emulator competition test passed.
- Commit-message hook and post-commit `pnpm check:commits` passed.

Environment: macOS arm64, repository Node/pnpm, Chromium, temporary Temurin Java 21
at `/tmp/void-drift-java21`. Browser/emulator commands required execution outside
the filesystem sandbox to bind local ports and launch Chromium.

The earlier full run
`artifacts/verification/2026-11-01T02-13-27.749Z-591FUR/report.json` failed only
formatting of an Astro paragraph. Its remaining stages passed. The final run above
followed that correction. Initial targeted unit/browser failures identified old
Fusion-default mass/energy assertions, direct-turn units, old Heavy speed limits,
old display names and the changed Flight Lab screenshot. Tests were updated to
the authorized contracts; screenshot tolerance was not changed.

The 450-tick Flight Lab image was inspected before updating its baseline for the
assembled two-Light-ion ship and inertial trajectory. Separate browser captures
`artifacts/ion-{balanced,scout,tank}-{left,right,release,both}.png` exercise real
fitted rendering, including all five Heavy engines on Cruiser. Agent inspection
covered turn/release/fade and layered plumes across all three hulls. Study readiness
and integration rendering was also inspected. These are implementation observations,
not renewed human acceptance of flight feel.

## Remaining evidence limits

Human approval covers the study characteristics and visual placements. Production
handling, speed/acceleration balance, stabilizer recovery, mobile performance and
mixed-family flight feel remain unreviewed by the owner. The 115-mass reference,
rectangular inertia and built-in zero-additional-mass stabilizers are documented
alpha integration adapters. Ranked stock physics remains unchanged. Ignored local
reports, screenshots and deploy logs are inspectable here but are not durable
remote backups. No study-quality rubric or factory lesson was inferred from passes.
