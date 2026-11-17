# Yellow-family flight trial

**Date:** 12 November 2026  
**Status:** Implemented in the working tree; not committed or published.

## Intent and decisions

Extend the accepted yellow-family G-star appearance from the title-screen
preview into live, unranked flight so its size-linked gravity, collection and
danger fields can be experienced in a seeded system.

The owner chose Derelicts first and explicitly retained those fields as part of
the experiment after an initial proposal to change appearance and contact size
while leaving the fields on the legacy Sun profile. The owner later asked for a
small G-number beside the star, accepted G7 as the 70 u reference and G14 as the
140 u extreme, and specified that the label use the World HUD colour after
seeing it white. In a later turn, the owner extended the same seeded family to
Gauntlet and explicitly kept ranked Survival unchanged.

Practice was changed to a fixed 70 u G7 profile in a separate session. That
change is present in this checkout and was kept when adding Gauntlet.

## Changes in this loop

- `packages/mode-a/src/lib/yellow-star-family.ts` derives the continuous
  36–140 u radius and the family gravity, collection and damage profiles from
  the run seed/radius. Its G denomination rounds radius in tens of world units.
- `packages/mode-a/src/lib/simulation.ts` applies the seed-selected profile to
  Derelicts and Gauntlet; Practice keeps its fixed G7 profile. Survival does not
  opt into the family.
- `packages/core/src/lib/solar.ts`, `packages/core/src/lib/physics/Physics.ts`,
  and `packages/core/src/lib/assets/sun-fields.ts` consume the independent
  collection and damage profiles and draw the denomination in Android green
  in the world HUD. `packages/core/src/lib/entities/Renderer.ts` opts the
  selected family into its shared appearance.
- Updated `docs/specs/game/derelicts/spec.md`,
  `docs/specs/game/gauntlet/spec.md`, and
  `docs/specs/game/world/star/spec.md` to record the mode boundary and trial
  behavior.
- The preceding title-only preview has its own record:
  [title star family trial](2026-11-11-title-star-family-trial.md).

## Evidence

- **Working revision:** repository HEAD was
  `d718d29bfd169bae421410246cbfb168ed6b21bb`; the checkout was dirty and shared
  with unrelated study, spec and release work. The changes described here were
  not committed, so this HEAD is a base reference, not an exact revision of the
  tested tree.
- **Tests:** the prior tool output for
  `pnpm exec vitest run packages/mode-a/src/lib/simulation.test.ts packages/mode-a/src/lib/gauntlet.test.ts packages/mode-a/src/lib/yellow-star-family.test.ts packages/mode-a/src/lib/standard-sun.test.ts packages/mode-a/src/lib/salvage-gravity.test.ts`
  reports 5 files and 33 tests passed. The output is in the chat, not a retained
  run log; the tested dirty-tree identity is not recorded separately.
- **Type/check:** `pnpm check` exited 0. Astro reported 261 files with 0
  errors, warnings or hints. The command output is in the chat, not a retained
  run log.
- **Formatting/whitespace:** focused Biome checks and `git diff --check` passed
  on the final Gauntlet changes. Their output is in the chat, not a retained
  run log.
- **Local visual inspection:** a Derelicts run at a 1280 × 800 browser viewport
  showed a G13 label above and right of the star with the field rings visible.
  The screenshot showed the label before its colour was changed from white to
  Android green. No screenshot was retained after that colour change. Gauntlet
  was not separately inspected in a browser; its star setup shares the tested
  simulation profile path.
- **Human feedback:** the owner said Practice's fixed G7 change was clearly
  better than before, referring to that separate session. The owner identified
  the star's separate gravity, collection and danger fields as the point of the
  flight trial. These are recorded decisions/preferences, not evidence of
  balance or general gameplay quality.

## Publication and remaining evidence gaps

No commit, push, deployment or internet release was made in this loop. The
browser inspection used a local development server. No post-colour screenshot,
retained test log, exact tested-tree fingerprint, or direct Gauntlet browser
inspection is available. No multi-seed play observations, field-balance
assessment, resource-limited Gauntlet outcome, or release-readiness check is
recorded here. This closure records implementation and checks; it does not
certify product acceptance or release readiness.
