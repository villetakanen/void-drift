# Flight Deck flaps and the weapons toggle: adversarial review

Reviewed 2026-11-25 on branch `feat/0-7-0`. The work was uncommitted and unreleased. Nothing was changed during the review.

## What was reviewed

The work brings paired Pause and Weapons flaps into the game. Weapons is an Auto/Off toggle in Practice, and in Gauntlet and Derelicts after arena entry. Survival and pre-entry flight show a passive Auto. Mouse, touch and a standalone Shift press send the same command. A low-energy emergency replaces the setting with an alert and disables the toggle until recovery. The simulation owns the choice, and Off stops new fire, including point defence.

Four independent reviewers each started without the author's reasoning. They covered the simulation, the interface and input, the specs, and a re-run of the checks. The top findings below were then checked against the source a second time.

## Result

The simulation claims hold. The keyboard handling has two defects, the specs disagree with the code in places the work's summary does not mention, and the spec format check fails on three edited specs.

## The summary's claims

| Claim | Verdict |
|---|---|
| Build, type checks, lint and 386 tests passed | Confirmed: all exit 0, 386 of 386 in 78 files, none skipped. |
| The simulation owns the choice and each run starts in Auto | Holds. |
| Off stops all new fire including point defence, and targets are kept | Holds: every player fire path is gated. |
| Plasma vents as on target loss, and a funded release finishes | Holds: repeated toggles cannot vent or damage twice. |
| Emergency disables the toggle, restores the choice, and thresholds are unchanged | Holds: the reserve comparisons are the same expressions as before. |
| Pause keeps its existing behaviour | Holds for behaviour, but its touch area grew (finding 7). |
| Standalone Shift, mouse and touch send the same command | Partly refuted (findings 1 and 2). |
| The owning specs were updated | Partly refuted (findings 3, 4, 5 and 8). |

## Defects

1. **Shift held while clicking the Weapons flap toggles twice.** The click toggles, then the Shift release toggles back, so nothing changes. Only a key press cancels a pending Shift; a pointer press does not (`apps/web/src/components/FlightDeck.svelte:727-731`).

2. **A key whose release never arrives disables the Shift shortcut.** The shortcut needs an empty set of held keys, and that set is cleared only on window blur or page hide, not on reset or retry (`apps/web/src/components/FlightDeck.svelte:684`, `:708`, `:734`). The reviewer expects CapsLock on, or a browser zoom with Cmd, to trigger this on macOS. The code path is confirmed; the browser behaviour was not observed.

3. **Shift toggles on release, but the spec says on press.** `docs/specs/game/controls/spec.md:157-161` says holding Shift switches weapons to Off once and they stay Off through release. In the code, weapons stay in Auto until Shift is released, and the press is dropped if an emergency or pause starts first. The chord rules that make Shift+Tab safe are in no spec.

4. **Derelicts gained a weapon lock during arena entry that the summary and the Derelicts spec do not state.** Before this work, Derelicts could fire on the arrival leg; now it cannot (`packages/mode-a/src/lib/simulation.ts:946-947`). The Derelicts spec still says weapons work as in any flight. The two modes also lock differently: Gauntlet skips targeting during entry, while Derelicts keeps targeting and turret tracking.

5. **Three edited specs fail the format check.** `docs/specs/game/derelicts/spec.md`, `docs/specs/game/ion-point-defence/spec.md` and `docs/specs/game/light-ion-cannon/spec.md` now have frontmatter with a verified entry but no generated entry, which is a new failure. The Gauntlet and Practice specs keep failures they already had. The other eight changed specs pass, and several improved.

6. **The emergency state can flicker at the reserve boundary.** There is no hysteresis, and the flap swaps a button for an alert element on each change (`apps/web/src/components/inputs/DeckFlap.svelte:27-48`). Each swap re-announces the alert and drops keyboard focus. A plasma-only ship is clamped to exactly the reserve while charging, so it enters the emergency during normal charging and cannot switch Off to vent. How often this happens in play was not observed.

## Risks and gaps

7. **Touch needs a device check.**
   - **Second-finger taps:** the flaps activate on click only, while the thrust pads use pointer events. A tap on Weapons while another finger holds a pad may not register on iPad Safari.
   - **Pause touch area:** the skewed flap now reaches about 99 px down into what was dead space above the left turn pad.

8. **The spec cites study files as the visual reference for the flap.** `docs/specs/factory/design-system/inputs/spec.md:124-127` links the study's image and JSON, and the component copies the JSON's numbers. The per-state values are not written into the spec, so in effect the study is the spec.

9. **Practice has nothing for the toggle to act on.** Practice builds no encounter system, so Auto and Off change nothing observable there and the emergency cannot occur. The controls spec uses Practice as its main toggle scenario, and the roadmap promises it.

10. **Focus stays on the Weapons flap after a mouse click.** In Chrome and Firefox, Space or Enter during flight then toggles weapons.

11. **Replays cannot carry the toggle.** It is called directly on the simulation, not through the recorded input. Ranked Survival is unaffected, and replay is used only in tests today.

12. **Browser coverage is missing.** No browser test covers the Weapons flap, the Shift shortcut or the passive and emergency states. The existing Pause and touch browser tests were not run against the new markup in this review.

13. **Tests pin tuning values.**
    - `packages/mode-a/src/lib/plasma-vent.test.ts:340` asserts Off damage equals 3 where it should equal the target-loss damage.
    - `packages/mode-a/src/lib/plasma-cycle.test.ts` pins 93 power and 0.35 s.
    - The Gauntlet Off test in `packages/mode-a/src/lib/gauntlet.test.ts` never exercises point defence and may pass with Off removed.
    - Nothing tests Off-then-Auto during a vent, or Off with a laser.

14. **Spec wording and ownership.**
    - **History wording:** "unchanged", "existing" and "retain" in the parts, game-screen and controls specs describe a change, not the contract. One of them replaced a checkable item with an uncheckable one.
    - **Split ownership:** the passive and emergency display is claimed by three specs, and the ion reserve rule is written out in three.
    - **Undefined terms:** "functional weapon", "arena entry complete" and "recovery".
    - **Stale wording:** the dialogs spec still says "deck buttons".

15. **The roadmap bullet uses an internal name and sits under Done.** "Flight Deck flaps" is not player-facing, and the bullet presents Pause as new and omits Shift. Other unreleased items sit under Done too, so the placement follows the file's convention.

## Checks re-run

| Check | Result |
|---|---|
| `pnpm lint` | Exit 0. |
| `pnpm check:types` | Exit 0, no errors or warnings. |
| `pnpm test` | Exit 0, 386 of 386 tests in 78 files. |
| `node scripts/check-contracts.mjs` | Exit 0. |
| `pnpm build` | Exit 0, one chunk-size warning. |
| `pnpm check:specs` on `docs/specs/game` and `docs/specs/factory` | Exit 1 on both, at HEAD as well; see finding 5 for the failures in edited specs. |

## Not checked

Physical iPad Safari, a screen reader, the browser test suites and live low-energy recovery in a browser were not checked.
