# Practice G7 Sun — 2026-11-12

## Intent and scope

The owner requested that Practice (described as “god mode”) use a class G.7 Sun
and that its World HUD label read `G7, Sun`, following the
[stellar-character study](../../apps/web/src/pages/lab/studies/stellar-characters-2026-11-11.astro)
and [derelict trial](2026-11-11-title-star-family-trial.md). This record covers
that Practice star and HUD decision only. It does not treat the decision as
evidence about other modes or about gameplay balance.

## Delivery

- Practice applies the yellow-family reference profile at 70 u. The profile
  sets the star radius, mass well, appearance, collection field, and damage
  field; Practice then sets the designation to `G7, Sun`.
- The existing World HUD pass calls the shared `drawSunFields` painter, which
  draws a star's designation above and to the right of its surface.
- The Practice contract records the fixed G7 reference profile and label. The
  star contract records the Practice exception to the legacy Sun profile.
- The simulation contract expectation was updated for Practice's radius,
  designation, and yellow-family appearance; it was not run in this loop.

## Provenance and delivery state

The code and specification changes were made in the shared, already-dirty
checkout. At closure, `git branch --show-current` reported `main` and `HEAD` was
`d718d29bfd169bae421410246cbfb168ed6b21bb`. The working tree contained many
other changes. The current simulation source also applies seeded yellow-family
profiles in Derelicts and Gauntlet. The earlier implementation-turn inspection
showed the Derelicts branch and the new Practice branch; the Gauntlet branch was
present at this closure inspection. This record does not attribute that
intervening Gauntlet change to the Practice request.

No commit, push, deployment, or release was made for this loop. The observed
HEAD is a baseline reference, not a revision containing or isolating the dirty
changes.

## Evidence

- Owner decision, from the conversation on 2026-11-12: “the sun of
  practice/god mode should be class G.7”; label request: “G7, Sun”. This
  establishes the requested design choice, not play acceptance.
- Direct source inspection at closure: `Simulation` applies
  `YELLOW_FAMILY_RADIUS.reference` in Practice and assigns `G7, Sun`
  (`packages/mode-a/src/lib/simulation.ts`). The reference is 70 u and its
  denomination is G7 (`packages/mode-a/src/lib/yellow-star-family.ts`).
- Direct source inspection at closure: the flight-frame World HUD pass invokes
  `drawSunFields` (`packages/mode-a/src/lib/flight-frame.ts`); that painter
  renders `star.designation` (`packages/core/src/lib/assets/sun-fields.ts`).
- Direct contract inspection at closure: Practice's fixed system and label
  are stated in `docs/specs/game/test-flight/spec.md`; the star profile and HUD
  label are stated in `docs/specs/game/world/star/spec.md`.
- `git diff --check` passed during implementation and again during closure for
  the four relevant implementation/spec files. The closure run was on the dirty
  working tree at HEAD `d718d29bfd169bae421410246cbfb168ed6b21bb`.
- No tests were run. No live Practice rendering was inspected or captured. An
  attempt to open the provided local study URL in a visible browser tab returned
  `Capability is not available: visibility`; it did not verify the game HUD.

## Limits and unknowns

The final label is supported by code-path inspection, not a retained browser
capture. No evidence was collected here about flight feel, resource behavior,
or balance under the 70 u profile. No deployment or published state was
verified. The broader dirty-tree changes cannot be isolated from this record.
