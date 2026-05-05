# Feature: Ship Lab Chassis Preview

**Status:** PLANNED  
**Target Version:** 0.4.0

## Blueprint

### Context
Ship selection is being added for v0.4.0 with three chassis profiles (`scout`, `balanced`, `tank`).
To keep balancing fast and deterministic, the Lab must support direct chassis preview and stat inspection without starting gameplay.

This spec defines the minimal Lab tooling required to validate:
- visual differentiation of ship variants
- profile stat wiring from shared runtime config
- parity between Lab values and in-game behavior

### Architecture

#### 1. Data Source (Single Source of Truth)

Ship chassis data must come from the production profile config in `@void-drift/mode-a`.

Lab must not duplicate constants for:
- thrust multiplier
- turn multiplier
- hull multiplier
- power drain multiplier
- zoom default

All displayed values should be read from the parsed/validated profile map used by gameplay.

#### 2. Lab Controls

Update `apps/web/src/components/lab/LabShipInspector.svelte`:
- add a chassis selector (`scout`, `balanced`, `tank`)
- show readonly profile stat table for active chassis
- keep controls keyboard and touch accessible

Control requirements:
- touch targets are at least 44px height on coarse pointers
- keyboard navigation supports tab + enter/space selection

#### 3. Lab Preview Renderer

Update `apps/web/src/components/lab/LabShipMain.svelte`:
- pass selected chassis id/profile into ship drawing path
- render variant geometry and tint exactly as gameplay expects
- no new per-frame object allocations in render loop

The Lab canvas should immediately reflect chassis changes.

#### 4. Optional Debug Hooks (Non-Blocking)

If helpful for balancing, include optional readonly deltas against `balanced` profile, e.g.:
- thrust: `+15%`
- hull: `-20%`

This is display-only and does not alter runtime config.

### UI Contract

#### Chassis Selector
- label: `Chassis`
- options: `Scout`, `Balanced`, `Tank`
- default: `Balanced`

#### Profile Stats Panel

Show these fields for the active chassis:
- `thrustMultiplier`
- `turnMultiplier`
- `hullMultiplier`
- `powerDrainMultiplier`
- `zoomDefault`

Formatting:
- multipliers displayed to 2 decimals
- zoom displayed to 2 decimals

### Anti-Patterns
- Do not hardcode a second profile list in Lab components.
- Do not introduce gameplay-only state machine logic into Lab.
- Do not use external assets for variant previews.

## Contract

### Definition of Done
- [ ] `/lab/entities/ship` can switch between all 3 chassis.
- [ ] Stat panel updates with the selected chassis profile.
- [ ] Preview visuals change by chassis in the same way as gameplay renderer.
- [ ] Lab profile values match production config values exactly.
- [ ] `pnpm -r check` and `pnpm -r build` pass.

### Regression Guardrails
- **Parity:** Lab and gameplay read the same profile source.
- **Performance:** No frame-time regression caused by Lab preview plumbing.
- **UX:** Mobile interactions remain reliable and touch-safe.
