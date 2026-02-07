# PBI-038: Dynamic Planet Spawning

**Status:** DONE
**Priority:** HIGH
**Estimate:** 3 Story Points
**Target Version:** v0.2.4

---

## User Story

**As a** player  
**I want** each new game to generate 0-5 random planets  
**So that** every run presents unique orbital challenges

---

## Context

Current system uses 3 hardcoded planets from `SURVIVAL_CONFIG.PLANETS`. This PBI replaces that with dynamic generation using parameter ranges aligned with the Planet Lab.

**Spec Reference:** [planet-mechanics.md](../specs/planet-mechanics.md) - Dynamic Spawning section

---

## Parameter Ranges

| Parameter | Range | Notes |
|-----------|-------|-------|
| Count | 0-5 | Random per game |
| Orbit Radius | 200-1000px | Must not overlap |
| Planet Radius | 10-100px | Physical size |
| Orbit Speed | ±0.02-0.15 rad/s | Sign = direction |
| Type | rock/gas/ocean/desert/ice | Random |
| Ring | 20% probability | Visual only |

---

## Non-Overlap Algorithm

```
For each planet:
  1. Generate random orbit radius
  2. Check against all existing planets:
     - Required gap = (thisRadius * 4) + (otherRadius * 4)
  3. If conflict, retry with new orbit (max 10 attempts)
  4. If no valid placement, skip this planet
```

---

## Acceptance Criteria

- [x] `PLANET_SPAWN_CONFIG` replaces `SURVIVAL_CONFIG.PLANETS`
- [x] `initializePlanets()` creates 0-5 random planets
- [x] Non-overlap validation prevents orbit collisions
- [x] Each planet uses random type from `PLANET_TYPES`
- [x] 20% of planets have rings
- [x] Game restart generates new planet set

---

## Technical Implementation

### config.ts
Add `PLANET_SPAWN_CONFIG` with ranges.

### planets.ts
- Refactor `initializePlanets()` to call `generatePlanets()`
- Add `generateRandomPlanet()` helper
- Add `validatePlacement()` helper

### GameWrapper.svelte
No changes (already calls `initializePlanets()`).

---

## Definition of Done

- [x] Dynamic planet generation working
- [x] Planet count varies between runs (0-5)
- [x] No visual overlap between planets
- [x] Type/ring randomization working
- [x] Type check passes
