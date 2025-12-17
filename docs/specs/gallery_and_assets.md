# Feature: Internal Asset Gallery (Workbench)

## Blueprint

### Context
To decouple asset development from gameplay logic, we require a hidden "Workbench" route (`/#gallery`). This allows designers and developers to tune procedural generation parameters (like ship colors, star pulses, or particle physics) in real-time without navigating the game loop or networking stack.

### Architecture
- **Route:** `/#gallery` (Hash-based routing in `App.svelte`).
- **Components:**
  - `Gallery.svelte`: Main container.
  - `Inspector.svelte`: UI for tweaking values (sliders, color pickers).
- **Asset API:** Pure functions accepting `ctx` and `props`.
  - `drawShip(ctx, props)`
  - `drawStar(ctx, props)`

### Anti-Patterns
- **Do NOT** load the full `GameLoop` in the Gallery. Only the `Renderer` or specific draw functions should run.
- **Do NOT** hardcode gallery assets; they should be the exact same functions used in production.
- **Do NOT** allow the Gallery to be visible in the public production build (unless behind a feature flag or dev route).

## Contract

### Definition of Done
- [ ] Visiting `/#gallery` loads the Workbench UI.
- [ ] Validating that `drawShip` and `drawStar` can be rendered in isolation.
- [ ] Changing a slider in the Inspector visibly updates the asset in real-time.

### Regression Guardrails
- **Performance:** Inspector updates must not trigger full-page reloads.
- **Isolation:** Crashes in the Gallery must not affect the main Game Loop entry point.

### Scenarios
**Scenario: Tuning Ship Color**
- Given I am on `/#gallery`
- And the Ship asset is selected
- When I change the `primaryColor` picker to Red
- Then the rendered Ship immediately turns Red
- And the change does NOT require a page refresh

**Scenario: Validating Physics Bounds**
- Given I am inspecting the `Star` asset
- When I enable "Debug View"
- Then the `influenceRadius` circle is visible
- And I can visually confirm its size relative to the star core
