# Parts

## Blueprint

### Context

Parts are what the player fits to a [ship](../ships/spec.md): engines, weapons
and support parts. Each part trades mass and energy for something the ship
can do, and those trades are what make fitting a decision.

This contract says what kinds of part exist and the rules they share. It keeps
no list of parts: the catalog in code is the list. A part gets a contract of its
own only when its behaviour in flight needs one, as the
[light ion cannon](../light-ion-cannon/spec.md) and the
[ion point defence](../ion-point-defence/spec.md) do.

### Architecture and boundaries

- **Catalog.** `PARTS` in `packages/mode-a/src/lib/schemas/loadout.ts` holds
  every part, validated by `PartSchema`: its name, description, short fluff, category, mass
  and the values of its kind. The Hangar shows the catalog's name and approved fluff, falling back to
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
  the derived figures. [Playground](../experimental/spec.md) owns which
  parts are sanctioned. The [Hangar](../hangar/spec.md) owns fitting on screen.

### Rules

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
- **Testing only.** A part may be made for testing. A testing-only part
  carries the design system's testing-only marking in its art, in every pose
  and on its card. The property is separate from sanctioning: it stays when a
  part is sanctioned, because fitting a testing-only part is a deliberate
  downside.
- **Part art.** A part's art has three things: an SVG master, the technical
  artefacts the game draws from (faces per pose, stamps, nozzle and mount
  geometry), converted from the master, and a design-system page, or part of
  one, showing the master beside renderings of those artefacts. A new part
  has all three when it is added. An existing part gets them when its art
  changes; until then it keeps its current art without a master.
- **Plasma rifle.** This rifle is an unsanctioned weapon-category
  fitting named “Plasma rifle”, with fluff “Floor is lava, jump!”. Its mass is
  2.7 times the Light Ion Cannon (24.3). The white-blue receiver is centred
  on the slot, using the supplied unlit SVG at its accepted scale. Its full
  silhouette contributes to the ship collision envelope. Each fitted muzzle observes its own target. The
  [rifle cycle](../plasma-rifle/spec.md) charges from ship power and either releases
  on a held target or vents when the target escapes. Its card
  shows mass alone. The master lives at `packages/mode-a/src/lib/art/weapons/plasma-rifle.svg`;
  derived paths serve both the card and fitted World drawing.
- **Weapons.** Functional weapons fire on their own; there is no fire control on keyboard
  or touch. A weapon draws energy per shot and none while idle.
- **Weapon energy floor.** No weapon fires while the ship holds less than a
  tenth of its energy capacity; it also requires more than 10 power. Below the floor
  a weapon takes no energy and starts no cooldown, and a shot the remaining
  energy cannot pay for is not fired. Engines and life support still draw below
  the floor.
- **Weapon order.** Defence weapons take energy before guns; slot order
  settles the rest.
- **Support.** A support part works on the ship's resources, for example by
  adding energy storage or energy collection. Storage adds to the ship's
  capacity. Collection adds energy under the part's own condition, up to
  capacity.
- **Sanctioned or unsanctioned.** Each part is one or the other, as
  [Playground](../experimental/spec.md) defines.

## Contract

### Definition of Done

- Every catalog entry passes `PartSchema`.
- `slotAccepts` decides compatibility for the Hangar and for
  `LoadoutSchema`; a part in a slot that does not accept it is rejected on
  load.
- A fitted part's mass counts toward the ship's mass.
- A storage part raises the ship's energy capacity, and a run starts with
  the whole capacity full.
- Below a tenth of capacity no weapon fires, draws or starts a cooldown; at
  exactly a tenth it may fire only with more than 10 power; this holds for every weapon and every capacity.
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
- A testing-only part shows the testing-only marking on the ship and on its
  card, whether it is sanctioned or not; the marking stays inside the part's
  body.
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

  Scenario: Weapons hold fire when energy is low
    Given a ship holding less than a tenth of its energy capacity
    When a target comes into a weapon's reach
    Then the weapon does not fire, takes no energy and starts no cooldown
    When the ship's energy rises to a tenth of capacity
    Then the weapon fires

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

  Scenario: The testing-only marking survives sanctioning
    Given a testing-only part that is sanctioned
    When it is shown on its card and on a ship
    Then it carries the testing-only marking
```
