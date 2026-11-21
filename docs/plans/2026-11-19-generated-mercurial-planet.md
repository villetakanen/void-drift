# Mercurial generation and instruments for 0.7

Closed 2026-11-19. The generator, shared appearance, System instrument,
Mercurial Inspector collateral and core-led gravity amendment are delivered.
The owning living specs define the current contract. This plan records delivery;
it does not claim production publication or full release verification.

## Delivered scope

- Survival, Derelicts and Gauntlet use the same seeded generator. Equal seeds
  give equal star profiles, mercurial radii, retained planets and initial positions.
- Exactly one mercurial replaces the innermost stock body. Its radius is seeded
  in 16–36u on a separate stream. It uses the accepted fixed mineral atlas and
  shared 31.3-second surface turn; procedural surface variation is outside 0.7.
- The whole body remains at least 1u outside Sun danger and 1u inside charging.
  Placement clamps `258 × SunRadius / 70` into the actual field interval for the
  selected body radius. Travel is 4u/s. Impossible placement fails explicitly.
- Conflicting stock planets are removed based on swept circular paths, with 1u
  clearance. Clear planets retain their configuration. Full-system ordinals
  are assigned after removal. Planet count can therefore vary.
- One validated mercurial gravity profile serves generated play, Practice Mercury
  and Inspector specimens:
  `mass(R) = 870 × [0.75 + 0.25 × (R / 27)²]`.
  The fixed 75% core keeps variation modest: masses are approximately 728.88,
  870 and 1039.17 at 16u, 27u and 36u. Body and well mass agree. Separate
  generated and Practice moon-mass tuning entries are removed and rejected.
- Practice retains its fixed named roster. Mercury remains radius 27u, orbit
  258u and mass 870; a 27u mercurial has the same planet gravity.
- The shared appearance adapter binds the production mineral material in all
  generated modes, preserving World/LFX ownership, culling, caching, fallback,
  HUD, run replacement and material/resource lifetime behavior.

## Delivered Lab tools

**System instrument — `/lab/system-instrument`.** One seed field, Generate and
Randomize, with default seed 2026. Editing alone does not regenerate. Invalid
input retains the last valid world. Randomize updates the field and regenerates.
The static tick-zero preview uses the production Simulation, frame passes and
appearance adapter. It draws all retained bodies, light, Sun fields, planet HUD
and the complete 1200u warp boundary. Automatic framing includes the full
boundary. Normal-action buttons and the seed controls float over the canvas;
there is no separate strip, burger pane, ship, timeline or animation loop.

**Planet Inspector — `/lab/planet-inspector`.** Mercurial is a family option
alongside named references. Its validated radius slider spans 16–36u, default
27u, with the fixed production material and core-led mass. Radius edits pause
and preserve tick, orbit and lighting; backward seeking preserves staged radius;
Reset restores the configured opening state. Named Mercury remains unchanged.
The specimen uses a G7 reference Sun and the nonlethal inspection clock.

## Owning contracts and implementation

- [Seeded system](../specs/game/world/systems/spec.md),
  [planets](../specs/game/world/planets/spec.md) and
  [gravity](../specs/game/world/gravity-field/spec.md).
- [Appearance adapter](../specs/game/render/spec.md#planet-appearance-adapter),
  [System instrument](../specs/lab/system-instrument/spec.md) and
  [Planet Inspector](../specs/lab/planet-inspector/spec.md).
- `packages/mode-a/src/lib/solar-system.ts`, `mercurial-rock.ts`,
  `schemas/gravity.ts`, `tuning.json` and `simulation.ts` own runtime generation
  and gravity. `apps/web/src/lib/assets/planet-appearances.ts` owns bindings.
- `apps/web/src/lib/system-instrument/` and `lib/planet-inspector/` supply their
  scenes; the corresponding `components/lab/` directories compose the tools.

## Decisions and delivery history

The owner requested replacement of the stock innermost planet, authorized
removal of obstructing planets, and chose seeded radii over the initial fixed
27u proposal. The one accepted surface remains fixed for 0.7. The initial
retained mass 1450 was superseded by the approved core-led family profile;
Practice's 27u mass 870 is the calibration anchor.

The initial integration is in `3dd987a7`; generated family preview corrections
are in `5670d389`. The closing snapshot adds shared gravity calibration, radius
parity checks, Inspector selection refinements and System control/boundary
corrections. Terra developed the generator and a clean-context Sol reviewer
completed two review passes; the remaining slices were developed in this chat.

## Verification and closure

The [closure record](../loop-evidence/2026-11-19-mercurial-generation-and-instruments.md)
collects commands, observed outcomes, revision limits, UI feedback and publication
boundaries. Earlier slice checks included 386 passing unit tests, type/contract
checks and build; the final overlay correction had 13 focused tests and browser
inspection at 1280px and 1440px. These are distinct snapshots, not a full release
verification claim. The latest shared-checkout commit validation is recorded
separately in the closure record.

The owner confirmed the Inspector and mercurials behaved as expected and, after
the overlay/border correction, that the System instrument worked as expected.
No work remains in this bounded delivery. General random planet generation,
new planet taxonomy, procedural surface synthesis and additional instruments
remain outside this scope. No deployment is part of closure.
