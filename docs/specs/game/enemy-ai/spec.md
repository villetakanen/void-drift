---
title: "Spec: Enemy AI"
status: draft
generated:
  by: "openai-codex/gpt-6"
  at: "2026-11-19T21:48:19+02:00"
verified:
  - by: "openai-codex/gpt-6.1-terra"
    at: "2026-11-19T21:31:01+02:00"
  - by: "openai-codex/gpt-6"
    at: "2026-11-19T21:48:19+02:00"
---

# Enemy AI

## Blueprint

### Context

Enemy AI is a reusable decision system for hostile actors in encounters. The
encounter owns the target, world and actor identity; an enemy owns its objective,
commands and energy state. Gauntlet is its first caller. This contract covers
game behaviour, not Lab instrumentation or encounter scheduling.

### Architecture

- Encounter simulation supplies each enemy's target and shared world state.
- An authored enemy profile declares available actions and predicts their
  motion and costs. Scout-specific fittings, thruster commands, spin and
  stabilizers remain Scout implementation details.
- Validated roster identity and profile data are Zod contracts. Cached fit
  statistics are immutable and shared by distinct instances with the same
  configuration.
- Planning uses deterministic prediction and tie-breaking. It does not mutate
  live actors, their energy, or world orbits. Predictions account for actual
  velocity-dependent propulsion, energy, command switching, intermediate path
  samples, moving-body clearance and the star.
- The [shared decision code](../../../../packages/mode-a/src/lib/enemy-ai.ts)
  chooses among the actions an enemy can perform and maintains its recovery objective.
  The [Scout pilot](../../../../packages/mode-a/src/lib/scout-pilot.ts) forecasts
  moving hazards once per planning horizon and reuses the [movement table](../../../../packages/mode-a/src/lib/scout-predictor.ts)
  compiled for its fitting and engine settings. Gauntlet staggers its seven
  pilots across an eight-tick cycle.

### Constraints

- The encounter supplies the objective target; an enemy does not select another
  actor as target independently of encounter policy.
- Candidate actions are limited to capabilities declared by the enemy profile.
- Planning is deterministic for identical validated state, world and inputs.
- Planning leaves live simulation state unchanged and candidate ties resolve
  deterministically.
- A solar-capable enemy latches recovery strictly below 20% energy capacity,
  suppresses new shots while recovering, and continues until at least 80%.
- At exactly 20%, a non-recovering enemy continues its current objective.
- Recovery path evaluation rewards net energy gain after life support, steering
  and thrust, while accounting for the star's damage field, surface and planets.
  Star targets and radii come from the actual star.

## Contract

### Definition of Done

- Enemy objectives, profile capabilities, energy state and deterministic
  planning have explicit validated contracts.
- Planning reuses cached immutable fit statistics for identical configurations.
- Candidate prediction includes velocity-sensitive thrust, costs, switching,
  intermediate samples and moving-body clearance without advancing live state.
- Solar recovery follows the stated latch and release thresholds through ordinary
  controls, suppresses new shots, and evaluates net charge and survival.
- Seeded comparisons against real physics cover pursuit, sideways drift, close
  star passes and crossing planet orbits; replaying the same inputs reproduces
  the same choices.
- Planning cost and full simulation tick cost are measured at one, two and seven
  active enemies, including median, p95 and worst tick.

### Regression guardrails

- Encounter scheduling and victory remain with the encounter, and ship-specific
  actuation remains with the ship implementation.
- Prediction does not change live actors, energy or orbital state.
- An enemy at the recovery boundary behaves consistently: below 20% latches;
  exactly 20% does not newly latch; recovery ends at 80% or above.
- Recovery suppresses new weapon requests, but already emitted plasma continues.

### Scenarios

```gherkin
Scenario: Deterministic objective planning
  Given an enemy, target, world and validated profile
  When the planner runs twice from the same state
  Then it chooses the same command and path
  And live actors, energy and planetary orbits are unchanged

Scenario: Capability-dependent actions
  Given two enemy profiles with different declared capabilities
  When each plans against the same encounter target
  Then each candidate uses only actions its profile permits

Scenario: Solar recovery thresholds
  Given a solar-capable enemy with capacity C
  When its energy falls below 0.20 times C
  Then it latches recovery and requests no new shots
  When energy reaches at least 0.80 times C
  Then it resumes its encounter objective

Scenario: Exact lower boundary
  Given an attacking solar-capable enemy at exactly 0.20 times capacity
  When it plans
  Then recovery is not newly latched
  And its attack objective remains eligible

Scenario: Recovery path safety
  Given a recovering enemy flying outward at speed
  When candidate paths include coasting and tangential solar passes
  Then net energy after life support and controls is evaluated
  And the selected path respects star, surface and planet clearance
```
