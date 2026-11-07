# Test Flight — Mode 1: flight practice

## Purpose

Test Flight gives the player a safe place to become familiar with the ship they
have prepared in the Hangar. In a repeatable holodeck environment with a star and
planets, they can practise manoeuvres, explore how their setup responds, and
develop confidence flying it before entering a game mode with consequences.

The ship retains its actual handling and its normal physical interaction with
the environment. Energy and health remain full, allowing the player to
concentrate on learning through flight, repeat attempts freely, and understand
how equipment choices affect their experience.

Practice supports the preparation loop: equip a ship, fly it, then return to the
Hangar with a clearer sense of what to keep or change. A session is transient
and ends when the player chooses to leave.

## Ownership and boundaries

The Hangar owns access to Test Flight and selection of the active setup. This
spec owns Mode 1's environment, flight rules, ending and return behavior.

Three modes are planned. This contract defines only Mode 1.
[Derelicts (Mode 2)](../derelicts/spec.md) owns the trial survival/combat game
and its weapon and salvage rules. Mode 3 remains unspecified. Derelicts' resource
consumption, damage, encounters and scoring do not apply to flight practice.

## Entry and loadout

- Enter from the Hangar using its active ship, fittings and system choices.
- Use that build's actual mass, thrust and handling through the shared flight
  simulation. Unlimited resources do not replace the build's physical properties.
- Start in a fixed, repeatable standard star-and-planet environment, with the
  same starting flight conditions on each entry. Exact layout and spawn geometry
  are not prescribed here.
- Start with full energy and health.

## Flight rules

- Retain normal flight controls, movement, gravity and physical interactions
  with the star and planets. Contact does not trigger a special safe reposition.
- Energy stays full at the build's capacity. There is no fuel consumption, and
  energy availability never limits engines or other flight systems.
- Health stays full at the build's maximum. No source of damage reduces it.
- No derelicts or their salvage encounters occur; there is no Send derelict action.
- There is no survival failure or game over.

## Pause, ending and return

- Use the real game's Pause flow: pausing freezes the practice simulation,
  Resume continues it, and Abort ends practice and returns to the Hangar.
- There is no Reset action.
- Returning preserves the active ship, fittings and system choices. Practice
  state is discarded; entering again starts a fresh practice session.

## Score, leaderboard and progression

- Practice has no score or results score, leaderboard entry or submission.
- Practice grants no progression or rewards and changes no equipment ownership.
- Experimental access does not change these practice rules. This contract does
  not decide equipment unlocking or eligibility for other modes.

## Integration boundaries

- `packages/mode-a/src/lib/schemas/loadout.ts` owns validated fittings and build
  system choices; `packages/mode-a/src/lib/schemas/flight.ts` owns flight entry
  settings. Any mode-selection data contract must be defined in Zod before its
  consumers change; the existing `testFlight` boolean alone does not specify
  which of the three modes is intended.
- `packages/mode-a/src/lib/simulation.ts` supplies shared flight behavior;
  `apps/web/src/components/FlightDeck.svelte` supplies controls and pause/return.
- Mode 1 does not activate the derelict encounters owned by
  `packages/mode-a/src/lib/salvage.ts`.
- No persistent practice session, score record or reward write is required.

## Implementation evidence — 7 November 2026

The safe-practice slice uses the default star-and-planet fixture and real build
physics with full health and energy, no salvage and no survival failure. FlightDeck
removes Reset, manual encounters and the survival timer; Pause/Resume/Abort use the
shared dialog. Automated checks and human experience review are reported separately
in the [implementation plan](../../../plans/2026-11-07-derelicts-mode.md).

## Acceptance criteria

- [ ] Entering from the Hangar flies the active setup with its actual fittings,
  system choices, mass, thrust and handling.
- [ ] Re-entering practice uses the same star-and-planet layout and starting
  flight conditions, with full build energy and health.
- [ ] Sustained engine and flight-system use leaves energy full and never causes
  a power shortage.
- [ ] Star and planet interactions retain normal physical behavior while health
  remains full; hazardous contact neither ends practice nor safely repositions
  the ship as a practice-specific response.
- [ ] No derelicts, salvage encounters or Send derelict action appear.
- [ ] Pause freezes practice; Resume continues the same session; Pause → Abort
  returns to the Hangar with the active setup unchanged.
- [ ] Neither play nor pause offers Reset, and returning to practice after Abort
  starts fresh rather than restoring the abandoned session.
- [ ] Practice displays no score, offers no leaderboard submission, and produces
  no persistent score, progression, reward or equipment-ownership changes.
