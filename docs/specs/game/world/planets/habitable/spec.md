---
title: "Spec: Habitable worlds"
status: draft
generated:
  by: "codex/gpt-6"
  at: "2026-11-19T21:13:02+02:00"
verified: [{ by: "codex/gpt-6", at: "2026-11-19T21:04:09+02:00" }, { by: "codex/gpt-6", at: "2026-11-19T21:14:06+02:00" }]
---

# Spec: Habitable worlds

## Blueprint

### Context

Habitable is the Earth-size, air-wrapped archetype immediately outside the
inner Mercurial planets in the default generated system. The designer selected two
ground maps and three cloud maps on 19 November 2026 and authorized implementation.
Practice retains its named reference planets unchanged.

### Architecture

- `packages/mode-a/src/lib/habitable-world.ts` owns seeded radius, material
  selection, mass, spin and safe orbit. The shared generator inserts the world.
- Core `HabitableAppearanceSchema` validates material identity; the gravity and
  atmosphere tuning schemas own physics. Planet Inspector validates family input.
- Production maps and adjacent prompts/provenance live under
  `apps/web/public/planets/`; source ground concepts and cloud studies are retained.
- The shared appearance adapter owns composition. Flight, System instrument,
  decorative generated systems and Planet Inspector consume it.

### Constraints

- `id` and body `type` are `habitable`; generated HUD identity uses star/ordinal.
- Radius R is uniform over `[0.8 RE, 1.2 RE]`, on a dedicated seed stream.
  `RE = 27 × [1 + (6371/2440 − 1)/3] ≈ 41.499590u`.
- Independent seed streams choose uniformly one ground (`archipelago`, `violet`)
  and one cloud map (`fronts`, `cover-20`, `cover-40`). Choices remain fixed per world.
- `ME = 3186.6710241427595`; `M(R) = ME × [0.70 + 0.30 × R/RE]`.
  Both body and well use this mass, the shared gravity cutoff and falloff.
- A separately stored 10u atmosphere has drag 0.8, the existing density model,
  entry heat cue and no atmospheric hull damage.
- Ground turns in 93.9s; clouds turn in 46.95s at R plus 2/5 air depth.
  Clouds have white opaque cores and soft density edges. Haze and blue rim use
  Cradle's existing drawing; shared light covers the cloud radius.
- Orbit D is the maximum of 666.611399u (unrounded Earth reference distance),
  `collectionReach + R + airDepth + 1u`, and the distance clearing each preceding
  Mercurial body by the complete air envelope plus 1u. Travel is 2.513080u/s
  (unrounded Earth reference speed), with positive angular speed `travel/D`.
- The complete body and air remain inside the 1200u warp boundary. Invalid or
  impossible placement fails explicitly. Existing Sun/Mercurial streams stay fixed.
- The mandatory world replaces stock gas. Only clear stock bodies farther out
  survive. Positions assigned after pruning give Habitable ordinal 2 or 3. When only one
  Mercurial fits inside charging, the [system contract](../../systems/spec.md)
  adds the other beyond Habitable at ordinal 3.
- Source maps are prepared once as wrapping cylindrical atlases. Ground wrap and
  polar joins are conditioned offline; cloud density becomes alpha at preparation.
  Runtime projects native images and applies shared light without per-frame pixels.

## Contract

### Definition of Done

- Default generated flight and previews show one Habitable world outside charging.
- Planet Inspector exposes the production family, radius and six material combinations.
- Equal seeds reproduce geometry, materials, physics and starting phase across modes.

### Regression guardrails

- Practice's Mercury, Venus and Cradle retain their current materials and physics.
- Existing Mercurial pair eligibility, star selection and controls retain their rules.
- Keyboard and landscape touch continue to control flight through atmosphere.

### Scenarios

```gherkin
Scenario: One or two Mercurials
  Given a supported generated Sun with one or two inner Mercurials
  When its default system is generated
  Then exactly one Habitable world follows them at ordinal 2 or 3
  And its full atmosphere clears the charging field and preceding bodies by 1u
  And its full atmosphere stays inside the warp boundary throughout its orbit

Scenario: Radius and direct mass
  Given a Habitable specimen at 80%, 100% or 120% of Earth radius
  When its gravity is prepared
  Then body and well masses are respectively 94%, 100% or 106% of ME

Scenario: Repeatable surface combinations
  Given the same run seed in Survival, Derelicts and Gauntlet
  When systems and materials are prepared
  Then each chooses the same one of two grounds and one of three cloud maps
  And the world draws those independent surfaces with Cradle-like atmosphere
  And the six combinations are available across generated seeds

Scenario: Inspect and replay
  Given Habitable selected in Planet Inspector
  When radius, ground or clouds are edited
  Then inspection pauses and retains its clock and orbit angle
  And backward seeking preserves those edits
  And Reset restores the opening document

Scenario: Practice stays fixed
  Given Practice with any seed
  When its planets are initialized
  Then The Cradle keeps its named identity, original ground, Cirrus and reference physics
```
