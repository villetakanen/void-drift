---
generated:
  by: "openai-codex/gpt-6.2-sol"
  at: "2026-11-25T08:37:38Z"
verified:
  - by: "human:ville-takanen"
    at: "2026-11-25T09:16:37+02:00"
---

# Parts

## Blueprint

### Context

Parts give ships their capabilities. Engines, weapons and support equipment
contribute mass, use or supply energy, and determine what a ship can do.

### Architecture

- **Catalog.** `PARTS` in [`loadout.ts`](../../../../packages/mode-a/src/lib/schemas/loadout.ts) holds
  every part, validated by `PartSchema`: its name, description, short fluff, category, mass,
  sanctioning (`releaseClass`) and the values of its kind. The catalog owns these
  values; this contract does not repeat individual entries. The Hangar shows the catalog's name and approved fluff, falling back to
  the technical description for unsanctioned parts. `partFigures` computes its
  figures from the same catalog and firing/collection rules used in flight.
- **Compatibility.** `slotAccepts` in `loadout.ts` is the one rule for which
  category fits which slot type. The Hangar and `LoadoutSchema` both use it, so
  what can be fitted and what can be loaded agree.
- **Weapons in flight.** `packages/mode-a/src/lib/salvage.ts` owns targeting,
  firing, energy and damage, with tuning in `schemas/salvage.ts`.
- **Engine art.** `packages/mode-a/src/lib/engine-art.ts` holds each engine's
  faces in four poses: catalog, two side lightings and aft. The Hangar card,
  the ship drawing in `build-renderer.ts` and the nozzle and plume geometry
  read the same entry.
- **Ion beams.** `packages/core/src/lib/effects/ion-beam.ts` draws the ion
  engines' plume from a cached stamp per plume style; the style's length,
  width and ink come from the catalog.
- **Neighbours.** [Ships](../ships/spec.md) own slots, the energy model and
  the derived figures. [Playground](../experimental/spec.md) defines what
  sanctioning means and how it gates play; the catalog owns each part's status.
  The [Hangar](../hangar/spec.md) owns fitting on screen.

### Constraints

- **Category and slot.** Every part has one category: engine, weapon or
  support. Every slot has one slot type, and a part can be fitted only where
  the slot type accepts its category.
- **Mass.** Every part has mass, and a fitted part's mass is part of the ship.
- **Engines.** An engine gives thrust, adds to the ship's cruise ceiling and
  draws energy while it fires. Engines differ in how they respond: steadily, in
  pulses or after a charge. A charged engine gives no thrust or steering until
  its input has been held for the part's charge length; releasing the input or
  losing power resets the charge.
- **Ion engines.** The ion engines are one family in the catalog. They share
  one form and one beam and the steady response, and differ by ion strength,
  form proportions, and plume length, width and ink. A part's ion strength is
  its thrust as a multiple of the light ion's; its draw is its own catalog
  value. Flight thrust, plume style, energy draw and
  every list of engines read the family and its values from the catalog; no
  code decides by part id whether an engine is an ion engine.
- **Mount point.** Each part's art is drawn in its own frame. The part's mount
  point says where that frame sits along its slot's axis, so a part can sit
  forward or aft in the slot. The mount point belongs to the part and applies
  on every hull; hull-specific adjustments add to it. The Hangar card draws the
  part in its own frame, without the mount point.
- **Part art.** A part's art has three things: an SVG master, the technical
  artefacts the game draws from (faces per pose, stamps, nozzle and mount
  geometry), converted from the master, and a design-system page, or part of
  one, showing the master beside renderings of those artefacts. A new part
  has all three when it is added. An existing part gets them when its art
  changes; until then it keeps its current art without a master.
- **Plasma rifle.** The white-blue receiver is centred
  on the slot, using the supplied unlit SVG at its accepted scale. Its full
  silhouette contributes to the ship collision envelope. Each fitted muzzle observes its own target. The
  [rifle cycle](../plasma-rifle/spec.md) charges from ship power and either releases
  on a held target or vents when the target escapes. Its card
  shows mass alone. The master lives at `packages/mode-a/src/lib/art/weapons/plasma-rifle.svg`;
  derived paths serve both the card and fitted World drawing.
- **Weapon order.** Defence weapons take energy before guns; slot order
  settles the rest.
- **Support.** A support part works on the ship's resources, for example by
  adding energy storage or energy collection. Storage adds to the ship's
  capacity. Collection adds energy under the part's own condition, up to
  capacity.
- **Sanctioned or unsanctioned.** Each part is one or the other, as
  [Playground](../experimental/spec.md) defines.

#### Weapon operation

- Auto permits normal automatic operation; it does not command a shot. The
  [controls contract](../controls/spec.md#automatic-weapons-command) owns who
  can change this choice and when. Off gives every fitted player weapon,
  including point defence, the operational equivalent of no targets. It
  prevents new shots without clearing or disabling the
  [targeting system](../targeting/spec.md). Already-funded effects and weapon
  recovery keep advancing, including
  [plasma vents and releases](../plasma-rifle/spec.md#automatic-charge-cycle).
  The player's choice does not affect enemy weapon operation.
- The light ion cannon, ion point defence and laser require more than 10
  power and at least 10% of capacity to fire. The plasma rifle requires
  power strictly above the greater of 10 and 10% of capacity to add charge.
  A reserve failure prevents new shots, shot cooldowns and weapon power
  debits; engines and life support still draw. Shot and release affordability
  are separate from reserve status.
- For the energy check, functional weapons are fitted light ion cannons,
  ion point defence turrets, lasers and plasma rifles; disabled rail guns
  do not count. The player's energy emergency is active when at least one
  functional weapon is fitted and every such weapon fails its reserve check.
  The emergency ends as soon as one clears its check, even if it cannot pay
  for a shot. Targets, readiness, Auto/Off and the entry lock do not change
  the check.

## Contract

### Definition of Done

- Every catalog entry passes `PartSchema`.
- `slotAccepts` decides compatibility for the Hangar and for
  `LoadoutSchema`; a part in a slot that does not accept it is rejected on
  load.
- A fitted part's mass counts toward the ship's mass.
- A storage part raises the ship's energy capacity, and a run starts with
  the whole capacity full.
- At exactly 10% of capacity and above 10 power, the ion cannon, point
  defence and laser pass reserve and the plasma rifle cannot add charge.
  The energy emergency ends when any fitted functional weapon passes reserve,
  even if its next shot or release is unaffordable.
- A held charged engine first thrusts once its charge length has elapsed;
  releasing the input or losing power resets the charge.
- From rest and at equal ship mass, an ion engine accelerates at its ion
  strength's share of the light ion's acceleration.
- Every ion engine in the catalog flies with ion thrust and draws its
  catalog plume style; a catalog entry missing an ion value fails the type
  check rather than falling back.
- An ion plume with a smaller length and width than another is drawn shorter
  and narrower in its own ink; each style's stamp is built once.
- On every hull, an engine's plume starts at its drawn nozzle, including the
  part's mount point.
- The Hangar card and the ship draw the same faces for a part.
- A part added to the catalog has an SVG master, technical artefacts
  converted from it, and a design-system page showing both. Engine masters
  live in `packages/mode-a/src/lib/art/engines/<id>.svg`;
  `scripts/engine-art-from-svg.mjs` converts one into its art module, and
  `engine-masters.test.ts` keeps every engine's art equal to its master.
- Sanctioned part cards use approved short prose in the catalog's `fluff`
  field: practical, affectionate pilot humour, without numeric specifications.
  It fits two lines on a 300-pixel card. Unsanctioned prose is not rewritten
  as part of this work.
- Each part shows mass first and up to three further figures computed by
  `partFigures`: engine thrust, draw and cruise contribution; weapon damage
  range per second, sustained energy draw and reach; storage capacity; or
  collection rate with its condition. Solar multipliers come from the catalog
  and gravity collection from the shared collection rule. Glyphs are provisional.

### Regression guardrails

- The catalog is the only list of parts; no contract, screen or test keeps its
  own.
- Part ids stay stable so stored fittings keep loading.
- A part's Hangar text and its behaviour in flight come from the same catalog
  entry.
- Weapon presentation never applies damage or spends energy.
- Adding an ion engine changes catalog data and its art, not flight, plume or
  fitting code.
- Changing a part's art without a master adds the master in the same change.

### Scenarios

```gherkin
Feature: Parts

  Scenario: A part fits only where its category is accepted
    Given a slot selected in the Hangar
    When I look at the parts I can fit
    Then only parts whose category the slot accepts are available

  Scenario: Storage raises capacity
    Given a ship with a storage part fitted
    When a run starts
    Then the ship's energy capacity includes the part's storage
    And the ship starts with its energy full

  Scenario: Off withholds automatic fire without clearing targets
    Given ready player guns and point defence with valid targets and enough power
    When the accepted choice changes to Off
    Then no new shots, shot debits or shot cooldowns begin
    And the targeting system still acquires and retains targets under its own rules

  Scenario Outline: Emergency follows reserve equality per fitted weapon
    Given a player ship with capacity 200 and only <fitting> fitted as weapons
    When its power is 20
    Then the energy emergency is <status>

    Examples:
      | fitting               | status   |
      | plasma                | active   |
      | ion                   | inactive |
      | plasma and ion        | inactive |
      | no functional weapons | inactive |

  Scenario: All fitted weapons fail reserve
    Given a player ship with ion and plasma weapons and 200 capacity
    When it holds only 10 power
    Then the energy emergency is active
    And a ready weapon with a valid target starts no shot or shot cooldown and spends no power

  Scenario: Release cost is not an emergency
    Given a player ship with capacity 100 and only a fully charged plasma rifle
    When it holds 11 power and the charging target is still valid
    Then there is no energy emergency
    And the rifle holds charge until it can afford release

  Scenario: A weaker ion engine accelerates less
    Given two identical ships at rest, one with a light ion and one with an ion engine of lower strength
    When both burn for the same time
    Then the weaker engine's ship is slower
    And its plume is shorter and narrower than the light ion's

  Scenario: A part sits where its mount point says
    Given an engine whose mount point lies aft of its slot's middle
    When it is fitted on any hull
    Then it is drawn aft of the slot's middle by that distance
    And its plume starts at its drawn nozzle
    And its Hangar card draws it centred in its own frame
```
