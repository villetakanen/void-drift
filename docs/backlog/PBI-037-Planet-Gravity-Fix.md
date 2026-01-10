# PBI-037: Planet Gravity Mass-Based Calculation

**Status:** TODO  
**Priority:** HIGH  
**Estimate:** 1 Story Point  
**Target Version:** v0.2.4

---

## User Story

**As a** developer  
**I want** planet gravity influence to be based on mass with a max cap  
**So that** gravity wells feel proportional to planet mass, not just size

---

## Context

Current implementation uses `radius * 16` for gravity influence. Spec requires mass-based calculation with `radius * 8` maximum cap.

**Spec Reference:** [planet-mechanics.md](../specs/planet-mechanics.md) - Physics section

---

## Acceptance Criteria

- [ ] Gravity influence radius calculated from mass (formula: `sqrt(mass) * factor`)
- [ ] Maximum influence radius capped at `radius * 8`
- [ ] Minimum influence radius is `radius * 2` (ensures close gravity)
- [ ] Physics tests updated to verify mass-based gravity

---

## Technical Implementation

**File:** `packages/core/src/lib/physics/Physics.ts` (line ~257)

```typescript
// Before
const influenceRadius = planet.radius * 16;

// After
const massInfluence = Math.sqrt(planet.mass) * 2;
const maxInfluence = planet.radius * 8;
const minInfluence = planet.radius * 2;
const influenceRadius = Math.max(minInfluence, Math.min(massInfluence, maxInfluence));
```

---

## Definition of Done

- [ ] Gravity formula updated in Physics.ts
- [ ] Unit test verifies mass-based influence
- [ ] Spec discrepancy warning removed from planet-mechanics.md
- [ ] Type check passes
