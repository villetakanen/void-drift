# Settings menu and 0.6.3 release

## Intent and decisions

On 17 November 2026 the designer requested a Settings design-system review,
implementation, then a patch release conditional on ranked compatibility.

- The first implementation aligned controls, typography and corner treatment,
  but left Settings as a standalone page. The designer rejected its overall
  composition: “while the toggles are now confromant, the page is not.”
- The designer identified Top Scores lacking the game backdrop as known debt;
  that page was excluded from this correction.
- The accepted proposal put Settings over the existing game scene and scrim,
  containing the logo, compact heading, settings and Return action in one panel.
  The designer asked that feature specs avoid prescribing ordinary DS styling.
- After implementation the designer said “nice,” then authorized a patch bump,
  commit, push, publication and synchronization to main if ranked remained
  compatible. A ranked incompatibility required discussion instead of release.

The feedback concerns this Settings composition. It does not establish acceptance
of every design-system consumer, gameplay balance or performance.

## Delivered changes and scope

[Settings](../../apps/web/src/components/Settings.svelte) supplies a nonmodal menu
snippet to [FlightDeck](../../apps/web/src/components/FlightDeck.svelte), reusing
its scene, scrim and control hiding. Settings uses shared Switches with accessible
names and descriptions and keeps the existing persistence store. The separate
SpeedCameraSetting component was removed. The Options spec retains behavior and
ownership; the DS and its Lab example describe panels serving menus and dialogs.

- `5a2141d7912aef1c7b257883efc42e6976d35ef5`: whole shared-checkout snapshot,
  Settings changes, study diagnostic repairs and all four package versions 0.6.3.
  This commit also contains other sessions' Lab work; it is not a Settings-only diff.
- `cb98c6a1854ea6f1511b7f1c148dd21f6e90bc5e`: historical evidence-link repair;
  clean verified and deployed revision, tagged `v0.6.3`.
- `ec650820268e58c19099ed60a09bf5986fe2e479`: later publication record, synchronized
  to local and origin/main. It does not change the release tag or bundle.

The snapshot was isolated from subsequent shared-checkout study edits. Those
later edits were left local and are outside the deployed artifact.

## Checks and evidence

Closure directly inspected the retained reports, audit script, relevant source,
contracts and release record. Browser observations and commands below occurred
earlier in this chat; closure did not rerun them.

| Check                                           | Outcome and tested identity                                                                                                                                                                                                                         | Retained source                                                                                                        |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `pnpm check:types` during Settings work         | Failed: two implicit-any errors and 34 warnings in existing rock-planet study files. Later repaired before the release run. Dirty shared tree, based on `68c60987`.                                                                                 | [Initial diagnostic log](../../artifacts/loop-evidence/2026-11-17-settings-release/initial-types.log)                  |
| First full `pnpm verify`                        | All nine gates passed individually, but the run failed because source changed during verification. Dirty tree based on `68c60987`; initial fingerprint `cd4ce9cdc91b804bf299261e7a3ed8a6f2fc4ba28c08b4dfd183509e850161ec`.                          | [Failed run report](../../artifacts/verification/2026-11-17T07-02-37.482Z-ePeX3b/report.json)                          |
| Early isolated `pnpm verify`                    | Interrupted after contracts reported four missing historical evidence targets. This attempt used Node 26.8.2; the final run used Node 24.14.0. Relative links were repaired in `cb98c6a1`. No complete pass is claimed for the interrupted attempt. | [Interrupted run log](../../artifacts/loop-evidence/2026-11-17-settings-release/interrupted-isolated-verification.log) |
| Final full `pnpm verify`                        | Passed all gates on clean `cb98c6a1`, with `sourceUnchanged: true`: contracts, commit syntax, lint, types, unit tests, build, 25 browser journeys, Firestore rules and competition. Node 24.14.0, macOS arm64; Java 21 supplied for backend checks. | [Successful run report and sibling logs](../../artifacts/verification/2026-11-17T07-14-22.226Z-7q0lky/report.json)     |
| `pnpm release:prepare` and `pnpm release:check` | Production build smoke and artifact hash check passed on clean `cb98c6a1`. Source fingerprint matches full verification: `06bd59c5204106357d36239ec6886c10e1fa0965b0f3d8a3dd30d41e936710a8`.                                                        | [Preparation report](../../artifacts/prepared-releases/2026-11-17T07-18-44.162Z-cm7WLV/report.json)                    |

The ranked comparison used published `v0.6.2` as baseline. Its
[retained report](../../artifacts/releases/0.6.3/ranked-audit-report.json) records
96 runs and 345,600 compared ticks with equal physical state and scores. The
[audit script](../../artifacts/releases/0.6.3/ranked-audit-run.mjs) covers Wasp,
Scout and Fighter, stock profiles and starter fittings, four seeds and four
input patterns. It excludes display identities and visual ring metadata.

The release decision, recorded in [0.6.3](../releases/0.6.3.md), was to retain
`ion-storm`: the source review attributed rule changes to Practice and unranked
Playground, with ranked Survival retaining the legacy Sun, stock masses, scoring
and eligibility. The bounded replay comparison is evidence for those tested
runs, not an exhaustive proof for every fitting or sequence. Its report predates
the release commit and contains no candidate source fingerprint.

## Publication states

- Local commits and tag: created as listed above.
- Push: the session's successful push output showed main and `v0.6.3` reaching
  origin; after the publication-record push, local and origin/main both resolved
  to `ec650820`. Closure's local git inspection still showed those refs aligned.
- GitHub: [release v0.6.3](https://github.com/villetakanen/void-drift/releases/tag/v0.6.3)
  was confirmed published, not draft, after the app interruption.
- Firebase: [publication report](../../artifacts/prepared-releases/2026-11-17T07-18-44.162Z-cm7WLV/publication-F3NhkY/report.json)
  records `deployed` at 09:20:32 Helsinki time, 17 November 2026, for `cb98c6a1`.
  Artifact fingerprint: `2fb5469dc8abc4d5f26aea5ae44296f9731cc416e20362f05b1bb9f401eeee72`.
- Live verification: a [separate report](../../artifacts/live-0.6.3/report.json)
  records completion at 09:32:34 Helsinki time. Version, ranked flight, keyboard
  movement, pause, Settings navigation and persistence, FX Lab animation/pause,
  anonymous authentication and existing-score reads passed. Eight existing
  leaderboard entries remained unchanged; no production score was submitted.
  No page errors were observed in the inspected session. A cached title page
  showed 0.6.2 until refresh, after which it showed 0.6.3.

Live captures: [Settings](../../artifacts/live-0.6.3/settings.jpg),
[paused flight](../../artifacts/live-0.6.3/flight-paused.jpg),
[FX Lab](../../artifacts/live-0.6.3/lab-fx.jpg). The deployment report intentionally
retains `liveVerified: false`; live checks are recorded separately.

## Evidence limits

- The initial module-import/loading failure and its clearing after dependency
  refresh were reported in this chat. A diagnostic establishing the underlying
  cause was not retained; this record does not assert one.
- Artifact reports, logs, bundle and captures live in ignored local directories,
  not a durable remote backup. Essential outcomes and identities are summarized
  here. The temporary release worktree was removed after artifacts were copied
  back; some reports retain their original temporary absolute paths.
- The replay audit retains local absolute paths and depends on temporary baseline
  and bundle files. It is not a portable, commit-bound replay harness.
- The app interrupted the first live-check session. The resumed session confirmed
  publication and completed the checks; it did not redeploy.
- Device-size inspection was browser-based. No physical-iPad or sustained-frame-rate
  measurement is claimed. No tests or production actions were repeated for closure.
