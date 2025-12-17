# Feature: Internal Asset Gallery (Workbench)

**Status:** ✅ COMPLETED (2024)  
**Current Version:** 0.0.4

## Blueprint

### Context
To decouple asset development from gameplay logic, we have implemented a "Workbench" route at `/gallery`. This allows designers and developers to tune procedural generation parameters (like ship colors, star pulses, or particle physics) in real-time without navigating the game loop or networking stack.

**Achievement:** Clean separation of developer tools from production game via Astro file-system routing.

### Architecture
- **Route:** `/gallery` (File-system routing via Astro).
- **Location:** `apps/web/src/pages/gallery.astro`
- **Components:**
  - `Gallery.svelte`: Main workbench container (`apps/web/src/components/Gallery.svelte`).
  - Individual asset renderers imported from `@void-drift/engine`.
- **Asset API:** Pure functions accepting `ctx` and `props`.
  - `drawShip(ctx, props)` → `packages/engine/src/lib/renderers/ship.ts`
  - `drawStar(ctx, props)` → `packages/engine/src/lib/assets/star.ts`

### Anti-Patterns
- **Do NOT** load the full `GameLoop` in the Gallery. Only the `Renderer` or specific draw functions should run.
- **Do NOT** hardcode gallery assets; they should be the exact same functions used in production.
- **Do NOT** bundle the Gallery route in production builds (tree-shaken automatically by Astro).

## Contract

### Definition of Done
- [x] Visiting `/gallery` loads the Workbench UI.
- [x] `drawShip` and `drawStar` can be rendered in isolation.
- [x] Gallery uses the same render functions as production game (no duplication).
- [x] Gallery route is completely separate from game route (no hash routing).

### Regression Guardrails
- **Performance:** Inspector updates must not trigger full-page reloads.
- **Isolation:** Crashes in the Gallery must not affect the main Game Loop entry point.
- **Build Safety:** Gallery should not increase production bundle size (route-based code splitting).

### Scenarios

**Scenario: Accessing Gallery** ✅
- Given I navigate to `localhost:4321/gallery`
- When the page loads
- Then the Gallery UI appears
- And I see canvas previews of game assets
- **Status:** VERIFIED - Works as specified

**Scenario: Asset Isolation** ✅
- Given I am viewing the Gallery
- When an asset render function throws an error
- Then the Gallery shows an error state
- But the main game at `/` remains unaffected
- **Status:** VERIFIED - Routes are completely isolated

**Scenario: Shared Rendering Logic** ✅
- Given the `drawShip` function in `packages/engine/src/lib/renderers/ship.ts`
- When it is imported by both Gallery and GameWrapper
- Then both render identical ship visuals
- And changes to the function affect both contexts
- **Status:** VERIFIED - Zero code duplication

## Current Implementation

### File Structure
```
apps/web/src/
├── pages/
│   ├── index.astro        → Game (/)
│   └── gallery.astro      → Workbench (/gallery)
└── components/
    └── Gallery.svelte     → Gallery UI component

packages/engine/src/
├── lib/
│   ├── renderers/
│   │   └── ship.ts        → drawShip() function
│   └── assets/
│       └── star.ts        → drawStar() function
```

### Asset Functions
All procedural drawing functions are exported from `@void-drift/engine`:
- `drawShip(ctx: CanvasRenderingContext2D, props: ShipDrawProps)`
- `drawStar(ctx: CanvasRenderingContext2D, star: Star, time: number)`

These functions are consumed by:
1. **Game:** `GameWrapper.svelte` → Renders during gameplay
2. **Gallery:** `Gallery.svelte` → Renders in isolation for tuning

### Future Enhancements
- [ ] Add real-time parameter sliders (color, size, animation speed)
- [ ] Add "Export" functionality to save asset configurations
- [ ] Add screenshot/recording capability for asset documentation
- [ ] Add physics visualization (gravity wells, collision bounds)

---

**Gallery Status: OPERATIONAL** 🎨  
**Access:** Navigate to `/gallery` during development
