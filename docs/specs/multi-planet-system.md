# Feature: Multi-Planet System (PBI-032)

**Status:** DRAFT
**Phase:** 7 (Content & Polish)
**Target Version:** v0.3.0
**Backlog Link:** `docs/backlog/PBI-032-Multi-Planet-System.md`

---

## Blueprint

### Context

Mode A currently supports planet interaction in runtime physics, but the Phase 7 goal is to make planet variety a deliberate gameplay contract instead of an implicit engine capability. PBI-032 defines a predictable multi-planet experience where players navigate multiple gravity wells with distinct orbital behavior.

This spec establishes the contract for planet count, orbital identity, physics behavior, and performance so implementation and tuning stay aligned with the v0.3.0 roadmap.

### Architecture

- **Gameplay Surface:**
  - `apps/web/src/components/GameWrapper.svelte`
  - Uses planet initialization and feeds planets into simulation + rendering pipeline.
- **Physics Runtime:**
  - `packages/core/src/lib/physics/Physics.ts`
  - `updateShip(..., planets)` applies per-planet orbit updates, gravity pull, and collision response.
- **Planet Initialization:**
  - `packages/core/src/lib/physics/planets.ts`
  - Current runtime uses procedural spawn via `SURVIVAL_CONFIG.PLANET_SPAWN_CONFIG`.
- **Configuration Authority:**
  - `packages/core/src/lib/config.ts`
  - Hosts `SURVIVAL_CONFIG`, including collision damage and planet spawn parameters.

### Data Contracts

- **Runtime Planet Shape (existing):**
  - `packages/core/src/lib/physics/Physics.ts`
  - `Planet` includes `pos`, `orbitCenter`, `orbitRadius`, `orbitSpeed`, `orbitAngle`, `initialAngle`, `radius`, `mass`, `color`, `type`, `hasRing`.
- **Spawn Contract (existing):**
  - `packages/core/src/lib/config.ts`
  - `SURVIVAL_CONFIG.PLANET_SPAWN_CONFIG` defines count range and orbital ranges.
- **PBI-032 Target Contract (roadmap intent):**
  - `SURVIVAL_CONFIG` exposes a deterministic `PLANETS` list for Mode A default run:
    - `rock` (large, slower orbit)
    - `gas` (medium, faster orbit, stronger pull)
    - `moon` (small, fast retrograde orbit)

### Constraints

- Game loop applies gravity and collision for all active planets every frame.
- Planet collision damage uses `SURVIVAL_CONFIG.PLANET_COLLISION_DAMAGE` consistently regardless of planet type.
- Planet orbit updates remain allocation-free per frame in hot paths.
- Planet behavior changes preserve existing star death and resource systems in `packages/mode-a/src/lib/game-loop.ts` and `packages/core/src/lib/physics/Physics.ts`.
- Visual differentiation of planets is achieved through procedural rendering paths only (no external assets).

---

## Contract

### Definition of Done

- [ ] Mode A initializes exactly 3 planets from deterministic config for default gameplay.
- [ ] All 3 planets maintain stable orbital motion around star center with distinct speed/phase values.
- [ ] Ship receives cumulative gravity influence from star plus all active planets.
- [ ] Planet collisions trigger elastic bounce and apply one collision damage event per impact.
- [ ] Average desktop runtime remains 60 FPS with 3 planets active in normal play.
- [ ] Mobile play on mid-range devices remains stable enough for progression to PBI-035 audit.

### Regression Guardrails

- Planet update, gravity, and collision logic remain deterministic for a given seeded setup/config.
- Planet-related changes do not alter death-cause precedence (`STAR` > `HULL` > `POWER`).
- Planet rendering keeps order consistency: background -> star -> planets -> ship -> HUD.

### Scenarios

```gherkin
Scenario: Multi-planet gravity composition
  Given a run with star and three configured planets
  When the ship enters overlapping gravity influence zones
  Then acceleration reflects the combined pull of all influencing bodies
  And ship movement changes smoothly without teleporting

Scenario: Retrograde planet orbit
  Given the moon planet is configured with negative orbit speed
  When simulation advances for multiple seconds
  Then the moon position progresses clockwise around the star
  And orbit radius remains constant within floating point tolerance

Scenario: Planet collision damage contract
  Given the ship collides with any active planet
  When the collision resolves
  Then ship velocity reflects with restitution
  And hull decreases by SURVIVAL_CONFIG.PLANET_COLLISION_DAMAGE once per impact event

Scenario: Performance guardrail under normal gameplay
  Given three active planets and standard visual effects enabled
  When a 60-second run is simulated on target desktop profile
  Then frame pacing stays within 60 FPS target window
  And no persistent degradation appears after repeated planet interactions
```

---

## Notes for Implementation Alignment

- Current runtime already supports multiple planets through `planets: Planet[]` in `updateShip`.
- Current spawn behavior in `packages/core/src/lib/physics/planets.ts` is procedural (`minCount` to `maxCount`) and should be aligned with this spec if PBI-032 requires deterministic 3-planet defaults.
- If procedural spawning is retained, this spec should be updated in the same change with revised DoD and scenarios.
