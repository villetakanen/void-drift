# Ship propulsion

## Context

Assembled ships use a ship-wide powered cruise ceiling derived from their hull and installed main engines. The value is shared by flight, the Hangar and production-backed motion experiments. It describes the speed propulsion approaches while preserving coasting and gravity-assisted overspeed.

## Architecture

- `ChassisSchema` and `PartSchema` in `packages/mode-a/src/lib/schemas/loadout.ts` validate finite positive hull base speed and finite nonnegative engine speed contributions.
- `buildStats` derives the powered cruise ceiling and its hull/engine breakdown from valid loadouts and shared part definitions. It does not persist derived values.
- `applyBuildEngines` in `packages/mode-a/src/lib/build-flight.ts` passes that shared value to every assembled propulsion impulse. Response timing, fitted mass, force, energy, torque and input remain owned by their current systems.
- Legacy stock trials remain a separate physics path. Historical studies may preserve old values as findings; they are not current production flight evidence.
- Instrument tuning overrides are experiment-wide. Hull and engine values cannot vary by vehicle in one experiment.

## Contract

### Definition of Done

- [ ] Hull base speeds are Scout 370, Wasp 420, Fighter 330, Corvette 240 and Fiddler 280 u/s.
- [ ] Engine contributions per fitted main are Light ion 8, Heavy ion 11, Fission 17 and Plasma 9 u/s.
- [ ] The ceiling is hull base plus the sum of contributions from physical fitted main engines: one Wasp centre engine, two side engines on other hulls, and every fitted aft engine. Fiddler's required aft pair counts.
- [ ] Equipment, empty slots and stabilizers contribute zero. An inactive, unpowered, charging, pulsing or released engine still contributes while installed. Mount angle, thrust and linkage do not affect the sum.
- [ ] Straight forward acceleration below V uses the existing linear taper: `a0 × max(0, 1 − speed / V)`. All assembled engine families use the same V.
- [ ] Braking and transverse steering remain available. Propulsion does not clip existing velocity above V; gravity can add overspeed.
- [ ] The analytical continuous straight-burn reference is `v(t) = V × (1 − exp(−a0 × t / V))`, with `t95 = −ln(0.05) × V / a0`, from rest without gravity and with continuous delivery.
- [ ] Builder values expose V and hull-base/installed-engine breakdown, and each engine detail reports its contribution.
- [ ] Current production-facing label is Fission; existing `fusion` IDs remain valid for saved builds.
- [ ] Instrument configuration accepts only supported experiment-wide propulsion and response overrides, and rejects old per-vehicle ceiling fields.

### Regression guardrails

- Apart from the accepted standard-Sun Light ion energy update, do not change thrust, mass, energy demand, duty/charge timing, torque, inertia, angular caps, stabilizer braking, linked-drive rules, gravity or friction as part of this contract.
- Keep the existing `engineImpulse` linear taper, radial/transverse decomposition and finite-impulse overspeed protection.
- Legacy stock physics and historical findings are not silently migrated to this assembled model.

### Scenarios

```gherkin
Scenario: Installed engines define one ceiling
  Given a valid Fighter build with a Heavy ion side pair and one Fission aft engine
  When buildStats derives its propulsion values
  Then V is 330 + 2×11 + 17 = 369 u/s
  And every propulsion impulse uses 369 u/s

Scenario: Inactive installed engine still contributes
  Given a fitted engine is charging, unpowered, or its control is released
  When another installed engine fires
  Then the ship ceiling still includes both fitted engines

Scenario: Braking and gravity can exceed the propulsion ceiling
  Given a ship is already moving faster than V
  When propulsion is released, braking is applied, or gravity acts
  Then the existing speed is not clipped to V
  And braking and transverse steering remain available

Scenario: Unsupported old instrument ceiling
  Given an instrument document contains per-vehicle ion maxSpeed or engine limit overrides
  When the document is parsed
  Then it is rejected with a schema issue
  And the document is not interpreted as current propulsion tuning
```


## Standard-Sun energy update — 2026-11-07

Light ion draw is 1.75 E/s per fully firing physical engine. Heavy ion draws
2× Light ion (3.5 E/s); full-duty stabilizers draw 0.25× Light ion
(0.4375 E/s), proportional to duty. Life support is 0.8 E/s. Fission and
Plasma costs are unchanged. This cost update changes no force,
torque, response timing, cruise ceiling, handling, gravity or friction.
The Wasp's single Light ion plus life support draws 2.55 E/s in an unsteered
forward burn. Production storage limits and energy-limited delivery remain active.
`buildDrain` supports a Light-ion-only draw scale for energy analysis without
mutating the shared parts or altering calculated motion.
