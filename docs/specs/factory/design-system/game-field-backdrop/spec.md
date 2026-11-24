---

generated:
  by: "openai/gpt-6.1-terra"
  at: "2026-11-24T14:37:17+02:00"
verified: [{ by: "codex/gpt-6", at: "2026-11-19T20:34:26+02:00" }, { by: "codex/gpt-6", at: "2026-11-19T21:04:09+02:00" }]

---

# Game field backdrop

## Blueprint

### Context

The game field backdrop is a shared player-facing decorative component. It
composes the generated game field with the shared stage and dialog scrim for the
Title Screen, Settings and Top Scores. Each screen uses the same
backdrop; the component does not take its system from an active game.

### Architecture

- The component composes the [game field](../../../game/render/game-field/spec.md)
  and its prepared distant sky with the non-modal stage and dialog scrim from
  [Surfaces and layers](../surfaces/spec.md). The page owns its content and
  interaction; the backdrop owns this shared visual composition.
- Its canonical design-system reference is `/lab/ds/game-field-backdrop`; that
  page lists the component sources and demonstrates the same composition used
  by all four consumers.
- Each time it mounts, it gets a newly seeded, separate generated system from the same
  [seeded solar-system generator](../../../game/world/systems/spec.md) used by
  Survival, Derelicts and Gauntlet. The generator determines the Sun, planet
  roster, body identities and sizes, appearance, and generated orbit data. The
  decorative instance remains separate from every active game's state and
  cannot supply to or change an active game's field.
- One title-specific presentation value overrides the orbit radius of the
  planet with the greatest generated orbit radius. It is chosen so that the
  visible orbit passes through the upper corner of the Title Screen panel. The
  preferred radius is at least 885 world units at 1920×1080, preserving any
  larger safe generated orbit. The same value is used on
  Settings and Top Scores; the host page does not change it.
- The backdrop presents the generated Sun and planets with their visible
  circular orbit paths over the prepared sky. It presents no ships, derelicts,
  flight effects, arena boundary or gameplay influence guides.
- The star-system composition and scrim fill the viewport. The Sun sits in the
  lower-right area and the system extends toward the upper-left. The Title
  Screen's panel is the composition target; other pages use the same framing.
- The scrim is visual only. It does not make a screen modal or change focus and
  input behavior. With reduced motion, the decorative system remains still.

### Constraints

- The four consumers render one shared backdrop composition with no page-specific variants.
- The decorative system uses the shared generator and a separate instance from active gameplay.
- Only the outermost generated planet's orbit radius receives a title-specific override.
- The override and the scrim treatment remain the same on all four screens.
- The backdrop reads or advances no active-game state.

## Contract

### Definition of Done

- Title Screen, Settings and Top Scores show the same generated field and scrim composition.
- `/lab/ds/game-field-backdrop` demonstrates the component and names its source files and contract.
- The backdrop uses the seeded solar-system generation rules without taking or changing an active game's system state.
- The outermost planet's orbit path passes through the upper corner of the Title Screen panel using one shared orbit-radius value on every consumer.
- The visible field contains the Sun, generated planets, their circular orbit paths and the prepared sky, without ships, derelicts, flight effects, arena boundaries or gameplay influence guides.
- The scrim remains independent of page modality, and reduced motion leaves the decorative system still.

### Regression guardrails

- Rendering the backdrop does not change an active run's star, planets, seed, simulation or scoring.
- A host page cannot alter the shared planet roster, body properties, orbit override or scrim treatment.
- Page content remains interactive above the scrim without a backdrop-created focus trap.

### Scenarios

```gherkin
Scenario: Compose the shared player-facing backdrop
  Given the Title Screen, Settings and Top Scores
  When the page renders its backdrop
  Then the shared generated-system composition, orbit paths, prepared sky and scrim appear
  And the page content remains interactive above them

Scenario: Keep the decorative system separate from play
  Given an active game and a rendered backdrop
  When the decorative planets advance
  Then the active game's star, planets, simulation, seed and score remain unchanged

Scenario: Frame the outermost orbit for the Title Screen
  Given any of the four backdrop consumers
  When the generated system is presented
  Then the outermost planet uses the shared title-tuned orbit radius
  And its visible orbit passes through the upper corner of the Title Screen panel

Scenario: Respect reduced motion
  Given the player prefers reduced motion
  When any consumer shows the backdrop
  Then the decorative system remains still
  And the page remains usable
```

The decorative outer-orbit preference of 885u moves the generated outermost body
outward only; an already larger safe orbit remains unchanged. Habitable ground,
clouds and atmosphere use the shared production appearance.
