# PBI-021: Package Restructure

**Status:** TODO  
**Priority:** HIGH  
**Estimate:** 5 Story Points  
**Phase:** 6 (Foundation)  
**Target Version:** v0.1.1

---

## User Story

**As a** developer  
**I want** the codebase split into shared core and mode-specific packages  
**So that** Mode A and future Mode B don't pollute each other with unrelated code

---

## Context

Currently all game logic lives in `packages/engine`. This monolithic structure will cause problems when Mode B (multiplayer) is added:
- Survival-specific code (resources, death, timer) mixed with shared code
- No clear ownership boundaries
- Risk of accidental coupling between modes

This PBI splits `engine` into:
- `packages/core` — Shared physics, entities, assets, core schemas
- `packages/mode-a` — Survival-specific logic for VOID DRIFT

**This is a pure refactor** with no functional changes. The game should run identically after restructure.

---

## Acceptance Criteria

### Package Split
- [x] `packages/engine` removed
- [x] `packages/core` created with package name `@void-drift/core`
- [x] `packages/mode-a` created with package name `@void-drift/mode-a`
- [x] All files moved to appropriate package (see File Mapping below)
- [x] `mode-a` depends on `core` in package.json

### Core Package (`@void-drift/core`)
Contains shared code used by any game mode:
- [ ] `src/lib/physics/` — Newtonian motion, gravity, collision detection
- [ ] `src/lib/entities/` — Ship, Star, Planet data structures and behavior
- [ ] `src/lib/assets/` — All procedural drawing functions
- [ ] `src/lib/schemas/` — Core schemas (Position, Velocity, Entity base types)
- [ ] `src/lib/config.ts` — PHYSICS constants only (MAX_SPEED, DRAG, etc.)
- [ ] `src/index.ts` — Public exports

### Mode-A Package (`@void-drift/mode-a`)
Contains survival-specific code:
- [ ] `src/lib/schemas/` — GameState, Resources, DeathCause, Settings schemas
- [ ] `src/lib/game-loop.ts` — Survival game loop with timer, death detection
- [ ] `src/lib/death.ts` — checkDeath(), handleDeath() functions
- [ ] `src/lib/config.ts` — SURVIVAL_CONFIG constants
- [ ] `src/index.ts` — Public exports

### Import Updates
- [ ] All `@void-drift/engine` imports in `apps/web` updated
- [ ] Imports use correct package (`core` vs `mode-a`)
- [ ] No circular dependencies introduced

### Build & Test
- [ ] `pnpm -r build` succeeds
- [ ] `pnpm -r check` has zero TypeScript errors
- [ ] Game runs identically to v0.1.0 (manual verification)
- [ ] Gallery page still works

---

## File Mapping

### Current → Core

| Current Path | New Path |
|-------------|----------|
| `engine/src/lib/engine/Physics.ts` | `core/src/lib/physics/Physics.ts` |
| `engine/src/lib/engine/Camera.ts` | `core/src/lib/physics/Camera.ts` |
| `engine/src/lib/engine/Input.ts` | `core/src/lib/entities/Input.ts` |
| `engine/src/lib/engine/Renderer.ts` | `core/src/lib/entities/Renderer.ts` |
| `engine/src/lib/assets/*` | `core/src/lib/assets/*` |
| `engine/src/lib/config.ts` (PHYSICS only) | `core/src/lib/config.ts` |

### Current → Mode-A

| Current Path | New Path |
|-------------|----------|
| `engine/src/lib/schemas/game-state.ts` | `mode-a/src/lib/schemas/game-state.ts` |
| `engine/src/lib/schemas/settings.ts` | `mode-a/src/lib/schemas/settings.ts` |
| `engine/src/lib/engine/game-loop.ts` | `mode-a/src/lib/game-loop.ts` |
| `engine/src/lib/config.ts` (SURVIVAL only) | `mode-a/src/lib/config.ts` |

---

## Technical Implementation

### 1. Create Core Package

```bash
mkdir -p packages/core/src/lib/{physics,entities,assets,schemas}
```

**package.json:**
```json
{
  "name": "@void-drift/core",
  "version": "0.1.1",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "zod": "^3.x"
  }
}
```

### 2. Create Mode-A Package

```bash
mkdir -p packages/mode-a/src/lib/schemas
```

**package.json:**
```json
{
  "name": "@void-drift/mode-a",
  "version": "0.1.1",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "@void-drift/core": "workspace:*",
    "zod": "^3.x"
  }
}
```

### 3. Update pnpm-workspace.yaml

Already includes `packages/*`, so new packages are auto-discovered.

### 4. Update apps/web/package.json

```json
{
  "dependencies": {
    "@void-drift/core": "workspace:*",
    "@void-drift/mode-a": "workspace:*"
  }
}
```

### 5. Update Imports in apps/web

**Before:**
```typescript
import { Ship, updatePower, SURVIVAL_CONFIG } from '@void-drift/engine';
```

**After:**
```typescript
import { Ship } from '@void-drift/core';
import { updatePower, SURVIVAL_CONFIG } from '@void-drift/mode-a';
```

---

## Definition of Done

- [ ] `packages/engine` deleted
- [ ] `packages/core` exists with correct structure
- [ ] `packages/mode-a` exists with correct structure
- [ ] All imports updated in `apps/web`
- [ ] `pnpm -r build` succeeds
- [ ] `pnpm -r check` has zero errors
- [ ] Game plays identically to v0.1.0
- [ ] Gallery page works
- [ ] No circular dependencies
- [ ] Version bumped to 0.1.1

---

## Testing Checklist

### Build Verification
- [ ] `pnpm install` succeeds
- [ ] `pnpm -r build` succeeds
- [ ] `pnpm -r check` has zero errors

### Runtime Verification
- [ ] Game loads without console errors
- [ ] Menu overlay displays
- [ ] Start game works
- [ ] Ship moves with thrust
- [ ] Power/Hull bars update
- [ ] Sun zones work (refuel + burn)
- [ ] Planet collision damages hull
- [ ] Death detection works (all 3 causes)
- [ ] Game Over screen displays
- [ ] Restart works
- [ ] Settings page works
- [ ] Control inversion works

### Gallery Verification
- [ ] `/gallery` route loads
- [ ] All asset previews render
- [ ] Resource bar sliders work

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Circular dependency | Build fails | Careful planning of what goes where |
| Missing export | Runtime error | Comprehensive import updates |
| Type errors | Build fails | Run `pnpm -r check` frequently during refactor |
| Broken functionality | User-facing bug | Manual testing of all features |

---

## Out of Scope

- ❌ New features
- ❌ Code improvements beyond restructure
- ❌ Mode B package creation (future)
- ❌ Test coverage changes

---

## Notes

**Why Now:**
- Clean foundation before adding Firebase complexity
- Easier to restructure with smaller codebase
- Prevents tech debt accumulation

**Future Mode B:**
When Mode B is started, create `packages/mode-b` following the same pattern:
```
packages/mode-b/           # @void-drift/mode-b
└── src/lib/
    ├── schemas/           # Lobby, Player, Weapon
    ├── sync.ts            # Firestore state sync
    └── config.ts          # COMBAT_CONFIG
```

---

## Sign-Off

**Specification Author:** @Lead  
**Assigned To:** @Dev  
**Reviewer:** TBD  
**Approved:** ⏳ Pending

---

**Related Documents:**
- [Phase 6 Roadmap](../PHASE-6-ROADMAP.md)
- [Project Vision](../project-vision.md)
- [Monorepo Migration Spec](../specs/monorepo_migration.md)
