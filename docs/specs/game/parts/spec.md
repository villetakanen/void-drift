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
  every part, validated by `PartSchema`: its name, description, category, mass
  and the values of its kind. The Hangar shows the catalog's name and
  description.
- **Compatibility.** `slotAccepts` in `loadout.ts` is the one rule for which
  category fits which slot type. The Hangar and `LoadoutSchema` both use it, so
  what can be fitted and what can be loaded agree.
- **Weapons in flight.** `packages/mode-a/src/lib/salvage.ts` owns targeting,
  firing, energy and damage, with tuning in `schemas/salvage.ts`.
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
- **Weapons.** Weapons fire on their own; there is no fire control on keyboard
  or touch. A weapon draws energy per shot and none while idle.
- **Weapon energy floor.** No weapon fires while the ship holds less than a
  tenth of its energy capacity; at exactly a tenth it may fire. Below the floor
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
  exactly a tenth it fires; this holds for every weapon and every capacity.
- A held charged engine first thrusts once its charge length has elapsed;
  releasing the input or losing power resets the charge.
- Every part shown in the Hangar has a catalog description that states what
  it does.

### Regression guardrails

- The catalog is the only list of parts; no contract, screen or test keeps its
  own.
- Part ids stay stable so stored fittings keep loading.
- A part's Hangar text and its behaviour in flight come from the same catalog
  entry.
- Weapon presentation never applies damage or spends energy.

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
```
