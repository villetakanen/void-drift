# LHI Fiddler — design study and flight integration

Closed at the owner's request on 2026-11-03 (Europe/Helsinki). The study ends
accepted for an integrated flight trial, with parts 03 and 04 completed. This
records the design and implementation loop; it does not establish owner acceptance
of flight feel or final balance. No tests, production changes or publication were
performed during closure.

## Intent and owner decisions

Build Ship 05, the **LHI Fiddler Heavy Assault Corvette**, from the owner's twin-blade
catamaran sketch. It should repeat Wasp's family forms at a larger, useful scale.
The owner identified four families: LHI, Daehan, Aegis and military-inspired;
Fiddler and the existing military Corvette are different families despite their
class names. The initial 180–210 mass exploration settled at 187 hull mass.

The [study](../../apps/web/src/pages/lab/studies/lhi-fiddler-2026-11-03.astro)
retains the original [feeling draft](../../apps/web/public/studies/lhi-fiddler-2026-11-03/feeling-draft.png),
the later [connected sketch](../../apps/web/public/studies/lhi-fiddler-2026-11-03/connected-draft.png)
and [family lineup](../../apps/web/public/studies/lhi-fiddler-2026-11-03/family-lineup.png).
Rejected explorations remain available at the owner's explicit request.

Decisions carried into the flight trial (positions below are upright study units;
spacing is centre-to-centre):

| Subject            | Settled result and provenance                                                                                                                                                                                                                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Family form        | Preserve the copied Wasp nose and adjoining complex side faces, their inner contour, forward blades and open middle. The owner rejected the wall treatment; the mirrored pair and root were useful directions.                                                                                                                          |
| Scale and glass    | The +35% hull with the actual Wasp-size, same-shape black glass was accepted. The owner explicitly chose shape/framing over gold–green glass. The shared outline is 19.5 × 6 units.                                                                                                                                                     |
| Main engines       | Four required engine-only slots: blade-root pair below the wings at spacing 47 / fore–aft +1; rear pair at spacing 16 / +39. E1/E2 share a fitting choice; E3/E4 share another. Pairs may differ. All mains thrust forward.                                                                                                             |
| Stabilizers        | Four built-in turning thrusters, always enabled. Corrected front: spacing 48 / −43 / +8.5°. Rear: spacing 29 / +33 / −16.5°. These replace the miscopied 27 and +19.5° values. Always enabled does not mean continuously firing.                                                                                                        |
| Pincer fittings    | Two independent front + slots at spacing 31 / −52, accepting weapon or support. Two independent aft S slots at spacing 31 / −29, accepting support only. All below the hull; no engines. Positions mirror, fitting choices do not link.                                                                                                 |
| Centre fitting     | One further + slot between glass and rear engines. The owner corrected it to below the chassis. The agent placed its centre at (0, +20) as the implementation starting point.                                                                                                                                                           |
| Linked drive       | Owner clarification: when linking is on, turning also fires only the corresponding side's forward engines, changing velocity and graphics without materially changing the turn. Implemented with zero added main-engine torque; the shared turn/braking command also links automatic spin braking proportionally. Linking defaults off. |
| Starting equipment | Owner specified two energy stores in the lower pincer slots and a centre gravity collector below the hull. Implemented main-menu fit: four Light ions, two Potential Wells, one Gravity coil; forward + slots empty. Assembled mass 273, energy capacity 270.                                                                           |

The owner authorized: “move to zero three and zero four” and “If no questions
arise in three or four, integrate to the game.” Readiness found no blocker to an
alpha flight trial. Initial stabilizer force/energy reuse Wasp's values with
Fiddler's geometric inertia; tuning remained provisional. Weapons remain static.

## Delivered changes and revisions

- [Shared Fiddler geometry](../../packages/mode-a/src/lib/fiddler.ts) and
  [source faces](../../packages/mode-a/src/lib/fiddler-form.ts) supply the study
  and production hull/window. The owner-reported missing right-wing triangle
  prompted correction of the face's vertex order; the rear-fin join was also closed.
- [Loadout contracts](../../packages/mode-a/src/lib/schemas/loadout.ts),
  [mounts/rendering](../../packages/mode-a/src/lib/build-renderer.ts) and
  [flight control](../../packages/mode-a/src/lib/build-flight.ts) implement nine
  slots, two required engine pairs, four stabilizers, layers, mass, draw, collision
  bounds and exhaust. Existing saves gain Fiddler without replacing other ships.
- The Hangar, main-menu 05, Flight Lab and shared instrument use the integrated
  ship. The study includes a final fitting preview and linked/unlinked comparison.
  [Hangar contract](../specs/hangar/spec.md#fiddler-flight-trial--2026-11-03) and
  architecture/instrument/playable-alpha documentation record the behavior.
- This chat ended implementation with local working changes and unranked trials.
  At closure, direct Git inspection shows that integration in later commit
  `df4582a217f03f0ffaaada49fb9b1247837656dd` (0.5.1). That commit also contains
  concurrent factory/release/test-pruning work; its entire diff is not this loop.
  Earlier construction exploration appears in `88c581c`.
- Closure entry: branch `feat/0-5-0`, HEAD
  `c9b115cf4cf6bade664f22258b3db759c3d3f5a4`. Thirteen pre-existing dirty files include
  later FlightDeck, leaderboard, style and backend/test changes. Closure preserves
  them and does not extend earlier verification claims to that working tree.

## Checks and evidence

The original local checks were separate commands against the evolving dirty
checkout at `/Users/ville.takanen/dev/void-drift`, package version 0.5.0, on macOS.
They did not capture one immutable source fingerprint. Logs were inspected at
closure and copied without rerunning into
[`artifacts/fiddler-study/closure-2026-11-03`](../../artifacts/fiddler-study/closure-2026-11-03/).
Its [source manifest](../../artifacts/fiddler-study/closure-2026-11-03/sources.json)
records original `/tmp/fiddler-integration-*.log` paths, timestamps and file hashes.

| Command / observation                                         | Historical outcome                                                                                                                                                                                                 | Retained evidence                                                                                                                                                                                                        |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm test`, 17:52 local                                      | 33 files / 149 tests passed, including seven Fiddler tests.                                                                                                                                                        | [Unit log](../../artifacts/fiddler-study/closure-2026-11-03/tests.log), [Fiddler tests](../../packages/mode-a/src/lib/fiddler.test.ts)                                                                                   |
| `pnpm check:types`, 17:55                                     | Passed; Astro and Svelte each report zero errors/warnings. This chat recorded final process exit 0.                                                                                                                | [Type log](../../artifacts/fiddler-study/closure-2026-11-03/types.log)                                                                                                                                                   |
| `pnpm lint`, final retained run                               | Passed, 642 files, no fixes applied.                                                                                                                                                                               | [Lint log](../../artifacts/fiddler-study/closure-2026-11-03/lint.log)                                                                                                                                                    |
| `pnpm check:contracts`, 17:52                                 | Context links and CSS/Canvas parity passed; 14 factory regression tests passed. Those tests include intentional failed-release fixtures, not actual failed publications.                                           | [Contract log](../../artifacts/fiddler-study/closure-2026-11-03/contracts.log)                                                                                                                                           |
| `pnpm build`, completed 17:57                                 | Passed, 57 pages. Vite warned about a minified chunk larger than 500 kB.                                                                                                                                           | [Build log](../../artifacts/fiddler-study/closure-2026-11-03/build.log)                                                                                                                                                  |
| Browser inspection in this chat                               | Manually checked centre compatibility, S-only options, rear-pair fitting, returning from flight, A+D thrust, linked/unlinked turns and menu 05's default fit. Study inspected at 511 px; Hangar/flight at 1280 px. | [Final plan](../../artifacts/fiddler-study/flight-ready-plan.png), [menu 05](../../artifacts/fiddler-study/main-menu-05.png), [default flight](../../artifacts/fiddler-study/default-flight.png); interaction transcript |
| Shared instrument                                             | At its 7 s sample the browser showed equal turn acceleration (61°/s² rounded) for both configurations, and acceleration magnitudes 1 versus 78 u/s². Same default fit, supplied power, no planetary gravity.       | Study 03 configuration and this chat's browser output; no separate trace export retained                                                                                                                                 |
| Automated browser/Firebase suites in this implementation chat | Not run. These were explicitly reported as gaps, not passes.                                                                                                                                                       | Study 04 and implementation final response                                                                                                                                                                               |

Earlier type and lint failures were corrected during implementation. They included
missing Fiddler consumers and component typing/accessibility/formatting issues.
The transcript preserves those failures; reused `/tmp` filenames retain only the
final logs, so the intermediate logs are unavailable as separate artifacts.

Later release verification is separate evidence, directly inspected at closure:
[full report](../../artifacts/verification/2026-11-03T16-03-07.343Z-2eBzth/report.json)
ran 16:03:07–16:04:14 UTC on Node v24.14.0, darwin/arm64. It reports all nine stages
passed, no skips, and unchanged source. It tested dirty candidate base
`0719198a2de41bddd9dce9e92dea84d2a512bc0f`, fingerprint
`bb723e14a55e4757dea5b03b51a33ce67e1c68c82bb079c292052aad0cfe1127`.
Stages include contracts, commit syntax, lint, types, units, build, browser journeys,
Firestore rules and competition. This does not retroactively mean those browser
and backend commands ran in the earlier implementation chat.

## Publication evidence, observed later

[Release 0.5.1](../releases/0.5.1.md) records the feature commit, tag, GitHub push
and release publication, Firebase deployment, and subsequent live browser checks.
Local remote-tracking `origin/feat/0-5-0` equals closure HEAD; no remote fetch or
new live inspection was performed for closure.

The directly inspected [publication report](../../artifacts/prepared-releases/2026-11-03T16-07-03.308Z-SNYpJu/publication-CjZMJX/report.json)
reports `deployed`, revision `2c22321182468ee9d0a90cf02587dfe4d7747ba2`, completed
16:08:11 UTC, artifact fingerprint
`9999548066698c6282b075c4d379820281330ba77e61b0cb03d869fe786f5049`.
It retains `liveVerified: false`. The later release note separately reports a live
flight start/pause, the Fiddler study/editors and five leaderboard rows; no production
score submission or separate anonymous-auth response capture. Preserve this
distinction between the deployment report and subsequently reported manual checks.
The study's “local working code, not a published release” sentence remains a
historical implementation snapshot, superseded by this later publication record.

## Human feedback and remaining limits

- The owner called 02.1 “mostly garbage,” said 02.3 did not provide usable LHI
  alternatives, and asked to retain them. They directed attention back to Wasp's
  flat faces and surface/light construction before further volume exploration.
  These are attributed assessments of those rounds, not a generalized rule derived
  by closure.
- The owner repeatedly reported apparent stopping/lack of new exploration steps.
  The chat records those reports; it does not establish a technical cause.
- On the copied nose/side language the owner said “now we are getting somewhere.”
  On item scale: “this is very usefull.” On the Wasp-sized glass: “fixes the whole
  design to me.” Those comments concern form and scale, not measured flight feel.
- Later engine placement and slot decisions authorized progression to integration.
  No owner flight-play assessment follows integration in this chat before “Close
  loop.” Handling, endurance, clearance and final balance remain unreviewed by the
  owner here. Closure does not mark them accepted.
- Screenshots and copied logs under `artifacts/` are ignored local files, not durable
  remote backups. Essential outcomes are summarized above. Exact per-command dirty
  source identity for the original checks is unavailable; later release evidence
  has its own identity and scope. Current concurrent edits are outside these results.

Only this evidence record and copies of existing logs were added during closure.
No factory lesson, skill amendment, new requirement or next-loop recommendation is
derived from these observations.
