# Title star family trial

**Date:** 11 November 2026  
**Status:** Implemented in the working tree; not committed or published.

## Intent and scope

Use the title screen's decorative system to preview the accepted yellow-family G
star across its 36–140 u surface-radius range, including the corresponding warm
body, ring and corona colours. The system has no size readout. This is a visual
trial only; it does not change Survival, Practice or gameplay fields.

The initial implementation used a fixed 70 u reference star as a working
assumption. During implementation the owner steered the trial to randomized
sizes and matching colours across the full range: “can we make it random? So it
can randomize between the kind of 36
and the 140 on the front page, and even on the colors we have there, so we can
simulate the whole thing there.” The owner later said, “Good work, looks very
good.”

## Changes

- `packages/mode-a/src/lib/landing-system.ts` samples a star radius from 36 to
  140 u when a new title system is created and derives its palette from that
  radius. The scene keeps its planets and remains cosmetic.
- `packages/core/src/lib/assets/star.ts` adds the yellow-family palette
  interpolation and optional shared painter appearance. The standard painter
  remains the default.
- `docs/specs/game/landing-page/spec.md` records the title-screen range and the
  absence of a readout.
- `docs/specs/game/world/star/spec.md` records the title-only trial alongside
  the accepted gameplay delivery, which remains unimplemented.

## Evidence

- **Automated check:** `pnpm check:types` passed on 11 November 2026: Astro
  reported 0 errors, warnings or hints; Svelte reported 0 errors and warnings;
  TypeScript exited 0. The checkout was dirty at base `d718d29b` on `main`.
- **Formatting and whitespace:** `pnpm exec biome check --write` on the four
  changed source/spec files passed and formatted two files. `git diff --check`
  passed for those files.
- **Browser inspection:** directly inspected the title screen at
  `http://127.0.0.1:4359/` at desktop viewport size. Two page reloads showed
  different star sizes and corresponding warm colours; the menu remained
  legible in both. These screenshots were shown during the session but were not
  saved as durable files. The sampled radii were not recorded.
- **Human feedback:** the owner said “Good work, looks very good,” referring to
  the trial appearance. This records acceptance of the viewed result, not
  gameplay balance or coverage of the full random range.
- **Tests:** not run in this loop.

## Publication and evidence gaps

No local commit, push or deployment was made. The browser inspection used the
local development server only. The repository already contained other
uncommitted study and release work; `docs/specs/game/world/star/spec.md` also
had study-closure edits before the title trial was added, so this record does
not attribute its entire working-tree diff to this loop. No durable screenshots
of the title trial were retained. Exact sampled sizes, endpoint-specific
appearance checks, sustained animation and performance were not measured.
