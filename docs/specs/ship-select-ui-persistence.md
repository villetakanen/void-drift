# Feature: Ship Select UI + Persistence

**Status:** PLANNED  
**Target Version:** 0.4.0

## Blueprint

### Context
Ship profiles and Lab chassis preview are in place. The next step is to expose ship choice in the gameplay entry flow so players can intentionally pick a chassis before each run.

This feature adds:
- a ship selector in the start menu
- persisted selection in settings
- guaranteed application of selected profile on start/restart

### Architecture

#### 1. Settings Schema Extension

Update `packages/mode-a/src/lib/schemas/settings.ts`:
- add `selectedShipId` using `ShipProfileIdSchema`
- set default to `DEFAULT_SHIP_PROFILE_ID`

```typescript
export const SettingsSchema = z.object({
  invertControls: z.boolean(),
  selectedShipId: ShipProfileIdSchema,
});
```

Persisted shape is backward-compatible by applying defaults when old local data is missing `selectedShipId`.

#### 2. Menu Overlay Selector

Update `apps/web/src/components/MenuOverlay.svelte`:
- add `Ship` selector UI with 3 options (`Scout`, `Balanced`, `Tank`)
- display short stats summary for selected ship
- keep controls touch-safe (>=44px target) and keyboard accessible

Menu controls should not interfere with existing tap/click-to-start behavior.

#### 3. Game Start/Restart Wiring

Update `apps/web/src/components/GameWrapper.svelte`:
- read `selectedShipId` from settings store
- resolve profile via `SHIP_PROFILE_BY_ID`
- apply selected profile on `startGame()` and `restartGame()`

At minimum for PBI-042:
- visual identity (tint + variant) must follow selected ship in-game
- profile selection must be stable and deterministic at run start

#### 4. Store Contract

Update web settings store (current `apps/web/src/lib/stores/settings`) so:
- `selectedShipId` is included in defaults
- writes are validated through `SettingsSchema`
- existing settings migration path handles missing field safely

### UX Contract

#### Selector Behavior
- default: `Balanced`
- user choice persists across reload
- choice is reflected immediately in menu summary

#### Accessibility
- keyboard navigation: tab + enter/space
- mobile target size: >=44px
- visible focus states retained

### Anti-Patterns
- Do not duplicate ship profile constants in web UI.
- Do not read from Lab-only state for gameplay selection.
- Do not bypass schema parse for settings reads/writes.

## Contract

### Definition of Done
- [ ] Start menu includes ship selector with 3 variants.
- [ ] Selected ship persists across page reload.
- [ ] New game and restart consistently apply selected ship.
- [ ] In-game ship visuals match selected profile.
- [ ] `pnpm -r check` and `pnpm -r build` pass.

### Regression Guardrails
- **Input Safety:** Start button and menu interactions still behave correctly on touch and desktop.
- **Data Safety:** Legacy settings without `selectedShipId` load without crashing.
- **Type Safety:** No `any` introduced in schema/store integration.
