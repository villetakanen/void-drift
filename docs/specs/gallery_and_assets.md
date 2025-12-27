# Feature: Internal Asset Lab (Workbench)

**Status:** IN PROGRESS  
**Current Version:** 0.0.5 (Refactor from Gallery)

## Blueprint

### Context
To decouple asset development from gameplay logic, we have implemented a "Lab" route at `/lab`. This allows designers and developers to tune procedural generation parameters (like ship colors, star pulses, or particle physics) in real-time, in isolated environments, without navigating the game loop or networking stack.

**Achievement:** Clean separation of developer tools from production game via Astro file-system routing, with granular addressability for each asset.

### Architecture
- **Base Route:** `/lab` (Index of all experiments).
- **Sub-Routes:**
  - `/lab/ship`: Ship rendering workspace.
  - `/lab/star`: Star rendering workspace.
  - `/lab/[...asset]`: Future assets.
- **Location:** `apps/web/src/pages/lab/**/*.astro`
- **Components:**
  - `LabLayout.astro`: Common shell for lab pages (navigation).
  - Specific rendering components (e.g., `LabShip.svelte`, `LabStar.svelte`).
- **Asset API:** Pure functions accepting `ctx` and `props`.
  - `drawShip(ctx, props)` → `packages/core/src/lib/assets/ship.ts`
  - `drawStar(ctx, props)` → `packages/core/src/lib/assets/star.ts`

### Anti-Patterns
- **Do NOT** load the full `GameLoop` in the Lab. Only the `Renderer` or specific draw functions should run.
- **Do NOT** hardcode lab assets; they should be the exact same functions used in production.
- **Do NOT** bundle the Lab routes in production builds (tree-shaken automatically by Astro or excluded via build config).

## Contract

### Definition of Done
- [ ] Visiting `/lab` loads the Lab Index.
- [ ] Visiting `/lab/ship` loads the Ship Workbench.
- [ ] Lab uses the same render functions as production game (no duplication).
- [ ] Lab routes are completely separate from game route.

### Regression Guardrails
- **Performance:** Inspector updates must not trigger full-page reloads.
- **Isolation:** Crashes in the Lab must not affect the main Game Loop entry point.
- **Build Safety:** Lab should not increase production bundle size.

### Scenarios

**Scenario: Accessing Lab Index**
- Given I navigate to `localhost:4321/lab`
- When the page loads
- Then I see a list of links to available asset workbenches
- **Status:** PENDING

**Scenario: Deep Linking to Asset**
- Given I share a link `localhost:4321/lab/ship`
- When a developer opens it
- Then they are taken directly to the Ship workbench
- And they don't have to scroll through a giant gallery
- **Status:** PENDING

**Scenario: Shared Rendering Logic**
- Given the `drawShip` function in `packages/engine/src/lib/renderers/ship.ts`
- When it is imported by both Lab and GameWrapper
- Then both render identical ship visuals
- **Status:** PENDING

## Current Implementation

### File Structure
```
apps/web/src/
├── pages/
│   ├── index.astro        → Game (/)
│   └── lab/
│       ├── index.astro    → Lab Index (/lab)
│       └── ship.astro     → Ship Workbench (/lab/ship)
└── components/
    └── lab/               → Lab-specific wrappers
        └── LabShip.svelte
```

## Lab Stats View

### Purpose
Display game-relevant statistics for each entity in the Lab, allowing designers and developers to understand the gameplay implications of visual parameters.

### Stats Panel Component
```typescript
interface LabStatsProps {
  entity: 'ship' | 'star' | 'planet';
  config: EntityConfig;
}
```

### Ship Stats View (`/lab/ship`)
| Stat | Value | Source |
|------|-------|--------|
| Mass | `ship.mass` | Physics weight |
| Thrust | `ship.thrust` | Acceleration force |
| Max Speed | `ship.maxSpeed` | Velocity cap |
| Deceleration | `ship.decel` | Passive drag |
| Hitbox Radius | `ship.radius` | Collision detection |

### Star Stats View (`/lab/star`)
| Stat | Value | Source |
|------|-------|--------|
| Class | `star.type` | O / B / A / F / G / K / M |
| Size Rating | `star.size` | Normalized scale (1 - 100) |
| Radius | `star.radius` | Visual/collision size |
| Mass | `star.mass` | Gravity strength |
| Gravity Range | `star.influenceRadius` | Gravitational well depth |
| Power Mult | `star.powerMultiplier` | Fuel regen efficiency |
| Burn Mult | `star.burnMultiplier` | Proximity damage rate |
| Zone 1/2/3 | `star.zones` | Scaled regen/burn boundaries |

### Planet Stats View (`/lab/planet`)
| Stat | Value | Source |
|------|-------|--------|
| Radius | `planet.radius` | Visual/collision size |
| Orbit Radius | `planet.orbitRadius` | Distance from sun |
| Orbit Speed | `planet.orbitSpeed` | Angular velocity |
| Color | `planet.color` | Surface color swatch |

### UI Layout (Inspector Sidebar)
```
┌─────────────────────┬───────────────────┐
│                     │  INSPECTOR        │
│                     ├───────────────────┤
│                     │  [ Presets ]      │
│                     │  > Class G (Sun)  │
│  [ Canvas Preview ] │                   │
│                     ├───────────────────┤
│                     │  [ Stats ]        │
│                     │  Size:    40      │
│                     │  Radius:  35px    │
│                     │  Mass:    600     │
│                     │  Zones:   ...     │
└─────────────────────┴───────────────────┘
```

### Implementation Location
- Component: `apps/web/src/components/lab/LabStats.svelte`
- Integration: Each lab page imports and configures LabStats

### Future Enhancements
- [ ] Add real-time parameter sliders (color, size, animation speed)
- [ ] Add "Export" functionality to save asset configurations
- [ ] Add screenshot/recording capability for asset documentation
- [ ] Add comparison view (side-by-side entity configs)

---

**Lab Status: UNDER CONSTRUCTION** 🚧  
**Access:** Navigate to `/lab` during development
