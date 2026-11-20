---
title: "Habitable world delivery"
generated:
  by: "codex/gpt-6"
  at: "2026-11-19T21:04:09+02:00"
---

# Habitable world in the default generator

Implemented 19 November 2026. Local changes verified; not deployed.
The [Habitable contract](../specs/game/world/planets/habitable/spec.md) owns the
resulting behavior. This plan records the scope and delivery.

## Delivered

- Exactly one Habitable world in the default generator, used by Survival,
  Derelicts and Gauntlet and their existing previews. It is ordinal 2 after
  one Mercurial or ordinal 3 after two; pair eligibility stays unchanged.
- Radius is uniformly seeded within ±20% of the game's Earth reference,
  approximately 33.20–49.80u around 41.50u.
- Mass is `ME × [0.70 + 0.30 × R/RE]`, using the direct radius ratio and
  independently stored Earth reference mass 3186.671024. Body and well agree;
  the mass range is 94–106% of Earth. Practice references stay fixed.
- Independent seeded choices select one of the two ground maps (Archipelago,
  Violet) and one of Fronts, 20% or 40% cloud maps. Six combinations, one ground
  and one cloud surface per world; materials remain fixed during a run.
- Cradle-like 10u air, drag 0.8, blue haze/rim and entry heat, with no atmospheric
  hull damage. Ground turns in 93.9s and clouds in 46.95s at 2/5 of air depth.
- The whole air envelope stays at least 1u outside charging and preceding
  Mercurial bodies, inside the warp boundary. Orbit starts at the Earth
  reference distance and moves outward as needed; travel uses the Earth
  reference speed. Stock gas is replaced; inward or conflicting stock bodies
  are pruned to preserve the requested ordinal.
- Planet Inspector includes Habitable, a family radius control and ground/cloud
  selectors. Edits pause and preserve time/pose; backward seek retains edits;
  Reset restores the opening document.
- Shared material binding serves flight, System instrument, decorative default
  worlds and Flight scene instrument. Practice's named worlds retain their art.

## Assets and ranked behavior

Both selected ground maps and the three selected cloud maps are production
assets under `apps/web/public/planets/habitable-*`, each with adjacent exact
prompts and preparation provenance. `scripts/prepare-habitable-maps.mjs` resamples
to 768×384, conditions horizontal/polar joins and turns cloud density into alpha
using the Cradle preparation rule. Source concepts and study maps remain intact.
Preparation is offline; runtime uses native image drawing and shared light.

This work used `habitable-skies` locally while developing the new gravity and atmosphere layout. The unpublished 0.7.0 release uses `fires-in-the-sky` for the combined ranked rules. No rules or client deployment was performed during this work.

## Verification

- 397 unit tests passed across 77 files, including 1,000 generated seeds, both
  ordinal cases, all six material combinations, placement endpoints and replay.
- Type checks, production build, contract checks and edited spec checks passed.
- 15 local Firestore emulator tests passed, including both legacy boards.
- Existing keyboard and landscape touch smoke tests passed (2 tests).
- Shared-preview browser checks at 1440px and 1280px covered all six appearances,
  radius edits, replay, reset, family switching, Cradle, system reseeding and a
  generated flight atmospheric sample. No page errors in the final run.
- Review captures and the browser-check report are local in `artifacts/habitable/`.

The keyboard/touch smoke caught a material-load ordering error during delivery;
loading now follows simulation creation in run setup and both tests pass.
The 1280px review caught crowded family labels; the existing detailed segmented
control wraps them. Local automated checks do not claim human playtest acceptance.
