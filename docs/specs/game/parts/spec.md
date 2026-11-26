---
generated:
  by: "openai-codex/gpt-6.2-sol"
  at: "2026-11-26T13:20:07Z"
verified:
  - by: "human:ville-takanen"
    at: "2026-11-26T13:21:53Z"
---

# Parts

## Context

Pilots fit engines, weapons and support equipment to choose how their ship flies, fights and gathers energy.

## Blueprint

### Architecture

[`PARTS`](../../../../packages/mode-a/src/lib/schemas/loadout.ts) is the sole parts catalog for flight, screens, specs and tests. Stable IDs keep saved fittings loadable. `PartSchema` validates each entry’s name, description, fluff, category, mass, sanctioning (`releaseClass`) and kind-specific values. Each part is sanctioned or unsanctioned under the [Playground rules](../experimental/spec.md).

[Ships](../ships/spec.md) own slots, energy and derived ship figures. Each slot has one type and each part one category (engine, weapon or support). The [Hangar](../hangar/spec.md) offers only parts accepted by `slotAccepts`. `LoadoutSchema` uses the same rule to reject incompatible saved fittings.

### Constraints

**Fitting.** Every fitted part contributes its mass. Storage increases capacity, and a run starts at full capacity. Collectors add energy up to capacity under their own collection conditions.

**Part cards.** Show the catalog name and approved fluff, falling back to the technical description for unsanctioned parts. Sanctioned fluff uses practical, affectionate pilot humour, omits numeric specifications and fits two lines on a 300-pixel card. Existing unsanctioned prose stays as written.

Show mass first. `partFigures` derives up to three further figures from flight data and rules. Engines show thrust, draw and cruise contribution. Weapons show damage range per second, sustained draw and reach, except the plasma rifle shows mass alone. Storage shows capacity. Collectors show rate and condition using catalog solar multipliers or the shared gravity collection rule. Glyphs are provisional.

**Engines.** Engines add thrust and cruise speed and draw power while firing. Response can be steady, pulsed or charged. A charged engine supplies neither thrust nor steering until input has been held for its charge length. Release or power loss resets the charge.

Ion engines share one form, beam and steady response. At equal ship mass, acceleration from rest scales with catalog ion strength relative to the light ion. Each entry supplies its own draw, form proportions and plume length, width and ink. Missing ion values fail type checking. Adding a family member requires only catalog data and art. Flight, plume drawing and engine lists read the family from the catalog without part-ID checks. [Ion beam drawing](../../../../packages/core/src/lib/effects/ion-beam.ts) builds one cached stamp per style and renders its specified dimensions and ink.

**Artwork.** Each new part ships with an SVG master, drawing artefacts derived from it (pose faces, stamps, nozzle and mount geometry), and a design-system page showing master and renderings together. Existing art gains a master and those artefacts and renderings when it changes. Engine masters at `packages/mode-a/src/lib/art/engines/<id>.svg` are converted by `scripts/engine-art-from-svg.mjs`. `engine-masters.test.ts` checks parity. The card, [ship drawing](../../../../packages/mode-a/src/lib/build-renderer.ts) and plume geometry use the same [engine art](../../../../packages/mode-a/src/lib/engine-art.ts), with catalog, two side-lit and aft poses.

The card centres the art in its own frame. On any hull the part’s mount point offsets that frame along the slot axis, plus any hull adjustment. Plumes start at the drawn nozzle.

The plasma rifle’s white-blue receiver is centred on its slot at the accepted scale. Paths derived from its [unlit master](../../../../packages/mode-a/src/lib/art/weapons/plasma-rifle.svg) draw the card and fitted World view. Its full silhouette contributes to the collision envelope. Each muzzle tracks its own target, charges from ship power and releases on a held target or vents on escape under the [rifle cycle](../plasma-rifle/spec.md).

#### Weapon operation

[Flight rules](../../../../packages/mode-a/src/lib/salvage.ts) own targeting, firing, energy and damage, with [shared tuning](../../../../packages/mode-a/src/lib/schemas/salvage.ts). Weapon presentation cannot spend energy or apply damage.

[Controls](../controls/spec.md#automatic-weapons-command) govern who can select Auto or Off and when. Auto permits automatic fire. Off treats every player weapon, including point defence, as having no targets. It prevents new shots, debits for those shots and shot cooldowns. [Target acquisition and retention](../targeting/spec.md), funded effects, [rifle venting and release](../plasma-rifle/spec.md#automatic-charge-cycle), recovery and enemy operation continue under their own rules.

Defence weapons draw before guns, then slot order decides. Before each shot, charge increment or charged release, the mount needs current energy **strictly greater than 10 plus its debit**, at every capacity. Each mount checks what earlier mounts left. Failure spends nothing and starts neither a shot nor its cooldown. Engines and life support still draw.

The player’s energy emergency is active only with at least one functional weapon and energy **strictly below 10 plus the cheapest next debit** among functional mounts. A fully charged weapon uses its release cost. Targets, readiness, Auto/Off and entry lock do not affect the alert.

## Scenarios

```gherkin
Feature: Parts

  Scenario: The first mount changes what the next can afford
    Given a ready defence weapon and a ready gun each need 0.2 for a shot
    And both have targets in Auto with 10.3 energy available
    When the defence weapon fires
    Then the gun holds fire with 10.1 energy left and starts no cooldown

  Scenario Outline: The reserve and the emergency at the boundary
    Given the only weapon is ready in Auto with a target and a shot cost of 0.2
    When its ship has capacity <capacity> and energy <energy>
    Then the gun <result> and the emergency before firing is <alert>

    Examples:
      | capacity | energy | result                       | alert    |
      | 100      | 10.19  | holds fire                   | active   |
      | 100      | 10.2   | holds fire                   | inactive |
      | 200      | 10.21  | fires and leaves 10.01 energy | inactive |

  Scenario: One affordable weapon clears the emergency even in Off
    Given two functional mounts with next costs of 0.1 and 0.2 in Off
    When the ship has 10.15 energy
    Then the cheaper mount clears its energy check and the alert stays inactive

  Scenario: A charged rifle checks its release cost
    Given the only weapon is a fully charged rifle holding a target in Auto
    When ship energy equals 10 plus the release cost
    Then the rifle holds its charge and the emergency is inactive
    When energy rises above that sum
    Then the rifle can pay for release and fire
```
