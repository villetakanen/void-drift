# Feature: Internal Asset Lab (Workbench)

**Status:** ACTIVE  
**Current Version:** 0.1.0

## Blueprint

### Context
To decouple asset development from gameplay logic, we have implemented a "Lab" route at `/lab`. This allows designers and developers to tune procedural generation parameters (like ship colors, star pulses, or particle physics) in real-time, in isolated environments, without navigating the game loop or networking stack.

**Achievement:** Clean separation of developer tools from production game via Astro file-system routing, with granular addressability for each asset and a robust 3-column grid layout.

### Architecture
- **Base Route:** `/lab` (Index of all experiments).
- **Sub-Routes:**
  - **Entity Labs:** `/lab/entities/ship`, `/lab/entities/star`, `/lab/entities/planet`.
  - **System Labs:** `/lab/resources`, `/lab/typography`, `/lab/buttons`.
- **Location:**
  - Entities: `apps/web/src/pages/lab/entities/*.astro`
  - Systems: `apps/web/src/pages/lab/*.astro`

### Entity Template
To ensure consistency, all **Entity Labs** follow a primary template:
1.  **3-Column Grid**: 
    - **Nav Rail (SSG)**: Global navigation.
    - **Stage (Mixed)**: Static Header + Interactive Svelte Main.
    - **Inspector (CSR)**: Parameter controls and Real-time Stats.

### Asset API
Pure functions accepting `ctx` and `props`.
- `drawShip(ctx, props)` → `packages/core/src/lib/assets/ship.ts`
- `drawStar(ctx, props)` → `packages/core/src/lib/assets/star.ts`
- `drawPlanet(ctx, props)` → `packages/core/src/lib/assets/planet.ts`
- `drawResourceBar(ctx, props)` → `packages/core/src/lib/assets/resource-bar.ts`

### Anti-Patterns
- **Do NOT** use `LabStats` in System Labs (e.g., Resources). Systems should have their own tailored debug views.
- **Do NOT** load the full `GameLoop` in the Lab. Only the `Renderer` or specific draw functions should run.
- **Do NOT** bundle the Lab routes in production builds.

## Contract

### Definition of Done
- [x] Visiting `/lab` loads the Lab Index.
- [x] Visiting `/lab/entities/ship` loads the Ship Workbench.
- [x] Lab uses the same render functions as production game (no duplication).
- [x] Lab routes are completely separate from game route.

### Regression Guardrails
- **Performance:** Inspector updates must not trigger full-page reloads (Isolated CSR).
- **Isolation:** Crashes in the Lab must not affect the main Game Loop entry point.
- **Build Safety:** Lab should not increase production bundle size.

## UI Layout (The "workbench" Grid)
The Lab uses a CSS Grid layout to maximize screen real estate and separate concerns.

**Grid Structure:**
```text
| logo (SSG)      | page-title (SSG)       | inspector (CSR) |
| tray (SSG)      | main (CSR)             | inspector (CSR) |
```

**Columns:**
1.  **Nav Rail (250px):** `logo` (Brand) + `tray` (Navigation Links).
    *   *Tech:* Astro (Static).
2.  **Stage (1fr):** `page-title` (Header) + `main` (Interactive Canvas/Preview).
    *   *Tech:* Header is Astro (Static). Main is Svelte (Client-side).
    *   *Scrolling:* `main` scrolls-y if content overflows (unless it's a fixed Canvas).
3.  **Inspector (300px):** `side-pane` (Controls + Stats).
    *   *Tech:* Svelte (Client-side) via isolated island.
    *   *Scrolling:* Scrolls-y independently.

---

**Lab Status: ACTIVE** 🚀  
**Access:** Navigate to `/lab` during development
