# Settings System Specification

**Status:** DRAFT  
**Phase:** 5 (Survival Core)  
**Related PBI:** PBI-018

---

## Overview

The settings system provides persistent user preferences for Void Drift. Settings are stored locally in the browser and apply immediately without requiring a game restart.

---

## Design Goals

1. **Simplicity** - Minimal API surface, easy to add new settings
2. **Persistence** - Settings survive browser sessions (localStorage)
3. **Reactivity** - UI and game logic react to setting changes automatically
4. **Validation** - Runtime validation prevents corrupt state
5. **Framework-agnostic storage** - Core logic independent of Svelte

---

## Architecture

### Why nanostores

We use [nanostores](https://github.com/nanostores/nanostores) with the `@nanostores/persistent` plugin for settings storage.

**Rationale:**
- Framework-agnostic atoms that work with Svelte, React, or vanilla JS
- Built-in localStorage persistence with `persistentAtom`
- Automatic JSON serialization/deserialization
- Reactive subscriptions without boilerplate
- Tiny footprint (~1KB)
- Clean separation: storage logic lives outside Svelte components

**Alternative considered:** Plain localStorage + Svelte `$state`
- Rejected because it couples storage logic to Svelte components
- Harder to share state between components
- Manual subscription management

---

## Data Model

### Settings Schema

```typescript
// packages/engine/src/lib/schemas/settings.ts
import { z } from 'zod';

export const SettingsSchema = z.object({
  invertControls: z.boolean(),
});

export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  invertControls: false,
};
```

### Storage Key

```
void-drift:settings
```

### Stored Format

```json
{
  "invertControls": false
}
```

---

## Store Implementation

### Core Store

```typescript
// apps/web/src/lib/stores/settings.ts
import { persistentAtom } from '@nanostores/persistent';
import { SettingsSchema, DEFAULT_SETTINGS, type Settings } from '@void-drift/engine';

export const settings = persistentAtom<Settings>(
  'void-drift:settings',
  DEFAULT_SETTINGS,
  {
    encode: JSON.stringify,
    decode: (str) => {
      try {
        const parsed = JSON.parse(str);
        return SettingsSchema.parse(parsed);
      } catch {
        return DEFAULT_SETTINGS;
      }
    },
  }
);
```

### Usage in Svelte

```svelte
<script lang="ts">
  import { useStore } from '@nanostores/svelte';
  import { settings } from '../lib/stores/settings';

  const $settings = useStore(settings);
</script>

<input 
  type="checkbox" 
  checked={$settings.invertControls}
  onchange={() => settings.set({ ...$settings, invertControls: !$settings.invertControls })}
/>
```

### Usage in Engine (non-reactive read)

```typescript
import { settings } from '../lib/stores/settings';

// Get current value (snapshot)
const currentSettings = settings.get();
if (currentSettings.invertControls) {
  // swap controls
}
```

---

## Settings Reference

### v0.1.0 Settings

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `invertControls` | boolean | `false` | Swap left/right engine controls |

### Future Settings (Post-v0.1.0)

These are **not** in scope for v0.1.0 but inform the extensible design:

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `soundEnabled` | boolean | `true` | Master sound toggle |
| `musicVolume` | number | `0.7` | Music volume (0-1) |
| `sfxVolume` | number | `0.8` | SFX volume (0-1) |
| `showFPS` | boolean | `false` | Debug FPS counter |
| `touchSensitivity` | number | `1.0` | Touch control sensitivity |

---

## Control Inversion Logic

When `invertControls` is `true`:

| Input | Normal Behavior | Inverted Behavior |
|-------|-----------------|-------------------|
| Left key / Left touch | Left engine fires | Right engine fires |
| Right key / Right touch | Right engine fires | Left engine fires |
| Both keys / Both touch | Both engines fire | Both engines fire (unchanged) |

**Implementation in Input handler:**

```typescript
export function applyInputToShip(
  input: InputState,
  ship: Ship,
  invertControls: boolean
): void {
  const left = invertControls ? input.rightThruster : input.leftThruster;
  const right = invertControls ? input.leftThruster : input.rightThruster;
  
  // Apply thrust based on swapped values
  if (left) ship.fireLeftThruster();
  if (right) ship.fireRightThruster();
}
```

---

## Dependencies

### npm packages

```bash
# In apps/web
pnpm add nanostores @nanostores/persistent @nanostores/svelte
```

| Package | Version | Purpose |
|---------|---------|---------|
| `nanostores` | ^0.11 | Core atom store |
| `@nanostores/persistent` | ^0.10 | localStorage persistence |
| `@nanostores/svelte` | ^0.5 | Svelte integration (`useStore`) |

---

## File Structure

```
packages/engine/src/lib/
└── schemas/
    └── settings.ts          # Zod schema + defaults (shared)

apps/web/src/
├── lib/
│   └── stores/
│       └── settings.ts      # Persistent nanostore
├── components/
│   └── Settings.svelte      # Settings UI
└── pages/
    └── settings.astro       # Settings route
```

---

## Error Handling

### Corrupt localStorage

If localStorage contains invalid JSON or data that fails Zod validation:

1. Log warning to console
2. Return `DEFAULT_SETTINGS`
3. Next `settings.set()` will overwrite corrupt data

### localStorage unavailable

If `localStorage` is undefined (SSR, private browsing restrictions):

1. Store operates in memory-only mode
2. Settings reset on page reload
3. No error thrown (graceful degradation)

---

## Testing Checklist

### Unit Tests

- [ ] `SettingsSchema.parse()` accepts valid settings
- [ ] `SettingsSchema.parse()` rejects invalid settings
- [ ] Default settings pass validation

### Integration Tests

- [ ] Settings persist across page reloads
- [ ] Corrupt localStorage falls back to defaults
- [ ] Control inversion applies immediately in-game
- [ ] Settings UI reflects current store state

### Manual Tests

- [ ] Toggle works with mouse click
- [ ] Toggle works with keyboard (Space/Enter)
- [ ] Settings page is accessible via `/settings`
- [ ] "Back to Game" navigation works
- [ ] Mobile: toggle is tappable (44px target)

---

## Out of Scope (v0.1.0)

- Cloud sync (Firebase settings storage)
- Settings import/export
- Settings reset button
- Gamepad-specific settings
- Per-profile settings

---

## References

- [nanostores documentation](https://github.com/nanostores/nanostores)
- [@nanostores/persistent](https://github.com/nanostores/persistent)
- [PBI-018: Settings Route](../backlog/PBI-018-Settings-Route.md)
- [Survival Core Spec](./survival-core.md)
