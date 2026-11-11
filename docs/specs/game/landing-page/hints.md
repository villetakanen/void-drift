# Title-screen hints

## Context

During alpha, the title screen is both a home for the game and a small bulletin
for its evolving world. Its rotating lines lead with what is new, then mix
current news, atmospheric lore teasers and practical guidance. This gives
returning players a reason to notice changes while helping any player find
their bearings and get a sense of the setting.

## Architecture

- `apps/web/src/data/landing-hints.ts` is the ordered source of authored hint
  content. It is static TypeScript data shipped with the game, not player state
  or remotely fetched content.
- `apps/web/src/components/TitleScreen.svelte` presents one entry at a time and
  owns its rotation and reduced-motion behavior.
- The [title-screen spec](spec.md) owns the hint area's placement and the
  screen composition around it. The [Playground spec](../experimental/spec.md)
  owns launch-blocked status shown in this area.

## Rules

- The rotation is fixed and identical for every player; it does not depend on
  the player's setup, history or actions.
- The first entry is the current alpha news lead: a noteworthy new feature or
  change. Further current news may follow it in the authored order. When the
  lead changes, replace the previous lead; the list is not a release archive.
- Lore entries are atmospheric teasers. They may invite curiosity without
  explaining the mystery.
- Practical entries give brief, accurate guidance about controls, play or
  where to find a game feature.
- Entries are concise and shown one at a time. They rotate approximately every
  eight seconds with a subtle fade.
- With reduced motion, the first entry remains visible without automatic
  rotation or a transition animation.
- Below the title screen's 4:3 aspect threshold, the orientation status replaces
  the rotating entry. It clears when the viewport returns to 4:3 or wider and
  does not take focus or interrupt navigation.
- A launch-blocked status may occupy the same area; its wording and conditions
  belong to the [Playground spec](../experimental/spec.md).

## Contract

### Definition of Done

- [ ] The title screen reads its ordered hint entries from the static TypeScript
  data module.
- [ ] The first entry is the current alpha news lead, followed by the authored
  mix of current news, lore teasers and practical guidance.
- [ ] The same ordered rotation is shown to every player and starts with the
  news lead when the title screen opens.
- [ ] The previous lead is replaced when the current alpha news changes; stale
  news is not retained as a release archive.
- [ ] One entry is shown at a time and advances approximately every eight
  seconds with a subtle fade.
- [ ] Reduced motion keeps the first entry static and removes the transition.
- [ ] The narrow-screen orientation status replaces the rotating entry and
  clears at 4:3 or wider without taking focus or blocking navigation.

### Regression Guardrails

- Hint rotation never changes player setup, navigation, launch availability or
  game state.
- No hint or status in the hint area takes focus or blocks menu navigation.
- News describes current alpha content; the list does not become a release
  history.

### Scenarios

```gherkin
Scenario: Current alpha news leads the rotation
  Given the title screen opens
  When the hint area appears
  Then it shows the current alpha news lead first
  And later entries follow the authored mix of news, lore and practical hints

Scenario: The alpha news lead changes
  Given the current news lead is no longer current
  When a new alpha highlight is authored
  Then it replaces the previous lead
  And stale news is not kept as release history

Scenario: Reduced motion
  Given the player prefers reduced motion
  When the title screen opens
  Then the first hint remains visible
  And it does not rotate or animate

Scenario: Narrow viewport
  Given the viewport is narrower than 4:3
  When the title screen is visible
  Then the orientation status replaces the rotating hint
  And menu navigation remains available
```
