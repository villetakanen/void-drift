# PBI-018: Settings Route with Control Inversion

**Status:** TODO  
**Priority:** MEDIUM  
**Estimate:** 3 Story Points  
**Phase:** 5 (Survival Core)  
**Target Version:** v0.0.7

---

## User Story

**As a** player  
**I want** to customize my controls (invert left/right)  
**So that** I can play comfortably based on my preference or handedness

---

## Context

This is the fourth PBI for Phase 5 (Survival Core). It's independent of other Phase 5 PBIs and can be developed in parallel.

**Why Control Inversion Matters:**
- Left-handed players may prefer reversed controls
- Some players find inverted controls more intuitive
- Accessibility feature (different cognitive mappings)

**Storage Strategy:**
- localStorage (browser-specific, no Firebase needed)
- Settings are per-device, not per-user
- Simple key/value storage with Zod validation

**Dependencies:**
- ✅ Phase 4 complete (input system exists)
- Can develop in parallel with PBI-015/016/017

---

## Acceptance Criteria

### Settings Route
- [ ] `/settings` Astro page exists and is accessible
- [ ] Page has consistent Layout with game (same header/footer if applicable)
- [ ] Page displays "Settings" heading
- [ ] Page has "Back to Game" button/link (navigates to `/`)
- [ ] Page is mobile-responsive (readable on 320px width)

### Control Inversion Toggle
- [ ] Toggle/checkbox UI element labeled "Invert Controls"
- [ ] Subtitle/hint text: "Swap left/right engine controls"
- [ ] Toggle state reflects current setting from localStorage
- [ ] Clicking toggle saves immediately to localStorage
- [ ] Toggle is keyboard accessible (Space/Enter to activate)
- [ ] Toggle has visual feedback (checked/unchecked states)

### LocalStorage Persistence
- [ ] Settings saved to localStorage key: `void-drift:settings`
- [ ] Settings object validated with Zod schema
- [ ] Default value: `{ invertControls: false }`
- [ ] Settings load on game initialization
- [ ] Invalid/corrupt localStorage data falls back to defaults
- [ ] Settings persist across browser sessions
- [ ] Settings are browser-specific (not synced)

### Input System Integration
- [ ] Input handler accepts `invertControls` boolean parameter
- [ ] When `invertControls = true`:
  - Left input activates right engine
  - Right input activates left engine
- [ ] When `invertControls = false`:
  - Left input activates left engine (normal)
  - Right input activates right engine (normal)
- [ ] Control inversion applies to both keyboard and touch inputs
- [ ] Settings apply immediately (no restart required)

---

## Technical Implementation

### 1. Settings Schema & Storage

**File:** `apps/web/src/lib/settings.ts`

```typescript
import { z } from 'zod';

export const SettingsSchema = z.object({
  invertControls: z.boolean().default(false),
});

export type Settings = z.infer<typeof SettingsSchema>;

const SETTINGS_KEY = 'void-drift:settings';

/**
 * Load settings from localStorage with fallback to defaults
 */
export function loadSettings(): Settings {
  if (typeof localStorage === 'undefined') {
    return { invertControls: false };
  }
  
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) {
      return { invertControls: false };
    }
    
    const parsed = JSON.parse(stored);
    return SettingsSchema.parse(parsed);
  } catch (error) {
    console.warn('Failed to load settings, using defaults:', error);
    return { invertControls: false };
  }
}

/**
 * Save settings to localStorage with validation
 */
export function saveSettings(settings: Settings): void {
  if (typeof localStorage === 'undefined') {
    console.warn('localStorage not available');
    return;
  }
  
  try {
    const validated = SettingsSchema.parse(settings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(validated));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

/**
 * Clear all settings (reset to defaults)
 */
export function clearSettings(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(SETTINGS_KEY);
}
```

---

### 2. Settings Route

**File:** `apps/web/src/pages/settings.astro`

```astro
---
import Layout from '../layouts/Layout.astro';
import Settings from '../components/Settings.svelte';
---

<Layout title="Settings - Void Drift">
  <Settings client:load />
</Layout>
```

---

### 3. Settings Component

**File:** `apps/web/src/components/Settings.svelte`

```svelte
<script lang="ts">
  import { loadSettings, saveSettings, type Settings } from '../lib/settings';
  
  let settings = $state<Settings>(loadSettings());
  
  function toggleInvertControls() {
    settings.invertControls = !settings.invertControls;
    saveSettings(settings);
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      toggleInvertControls();
    }
  }
</script>

<div class="settings-container">
  <header>
    <h1>Settings</h1>
  </header>
  
  <section class="setting-group">
    <h2>Controls</h2>
    
    <label class="toggle-wrapper">
      <input 
        type="checkbox" 
        class="toggle-input"
        checked={settings.invertControls}
        onchange={toggleInvertControls}
        onkeydown={handleKeydown}
      />
      <span class="toggle-label">Invert Controls</span>
      <p class="toggle-hint">Swap left/right engine controls</p>
    </label>
  </section>
  
  <footer>
    <a href="/" class="back-button">← Back to Game</a>
  </footer>
</div>

<style>
  .settings-container {
    max-width: 600px;
    margin: 0 auto;
    padding: var(--spacing-lg);
    min-height: 100vh;
  }
  
  header {
    margin-bottom: var(--spacing-xl);
  }
  
  h1 {
    color: var(--color-neon-blue);
    font-size: 2.5rem;
    margin-bottom: var(--spacing-sm);
  }
  
  h2 {
    color: var(--color-white);
    font-size: 1.25rem;
    margin-bottom: var(--spacing-md);
  }
  
  .setting-group {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--color-neon-blue);
    border-radius: 8px;
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-md);
  }
  
  .toggle-wrapper {
    display: flex;
    flex-direction: column;
    cursor: pointer;
    padding: var(--spacing-sm);
    border-radius: 4px;
    transition: background 0.2s ease;
  }
  
  .toggle-wrapper:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .toggle-input {
    width: 20px;
    height: 20px;
    cursor: pointer;
    margin-right: var(--spacing-sm);
    accent-color: var(--color-neon-blue);
  }
  
  .toggle-label {
    font-size: 1.125rem;
    color: var(--color-white);
    font-weight: 500;
    margin-bottom: var(--spacing-xs);
  }
  
  .toggle-hint {
    font-size: 0.875rem;
    color: var(--color-gray);
    margin: 0;
  }
  
  footer {
    margin-top: var(--spacing-xl);
  }
  
  .back-button {
    display: inline-block;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-neon-blue);
    color: var(--color-void);
    text-decoration: none;
    border-radius: 4px;
    font-weight: 500;
    transition: filter 0.2s ease;
  }
  
  .back-button:hover {
    filter: brightness(1.2);
  }
  
  /* Mobile */
  @media (max-width: 640px) {
    .settings-container {
      padding: var(--spacing-md);
    }
    
    h1 {
      font-size: 2rem;
    }
  }
</style>
```

---

### 4. Input System Integration

**File:** `packages/engine/src/lib/engine/input.ts`

Update existing input handler to accept settings:

```typescript
import type { Ship } from '../types';
import type { InputState } from './input-state';

export function applyControls(
  ship: Ship,
  input: InputState,
  invertControls: boolean = false
): void {
  // Swap inputs if inversion enabled
  const leftActive = invertControls ? input.right : input.left;
  const rightActive = invertControls ? input.left : input.right;
  
  if (leftActive && rightActive) {
    // Both engines = forward thrust
    ship.applyThrust('forward');
  } else if (leftActive) {
    // Left engine only = rotate left + partial thrust
    ship.rotate(-1);
    ship.applyThrust('left');
  } else if (rightActive) {
    // Right engine only = rotate right + partial thrust
    ship.rotate(1);
    ship.applyThrust('right');
  }
}
```

---

### 5. Game Integration

**File:** `apps/web/src/pages/index.astro` (or main game component)

Load settings and pass to input handler:

```typescript
import { loadSettings } from '../lib/settings';

// On game initialization
const settings = loadSettings();

// In game loop (pass to input handler)
applyControls(ship, inputState, settings.invertControls);
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] `/settings` route is accessible and functional
- [ ] Settings component renders correctly
- [ ] Control inversion toggle works (visual state updates)
- [ ] localStorage saves/loads correctly
- [ ] Invalid localStorage data handled gracefully (fallback to defaults)
- [ ] Settings apply immediately in-game (no restart needed)
- [ ] Keyboard navigation works (Tab, Space, Enter)
- [ ] Mobile responsive (tested on 320px width)
- [ ] Zero TypeScript errors (`pnpm -r check`)
- [ ] Cross-browser tested (Chrome, Firefox, Safari)
- [ ] Code reviewed and approved

---

## Testing Checklist

### Route Tests

**Settings Page Access:**
- [ ] Navigate to `/settings` directly in URL bar
- [ ] Verify page loads without errors
- [ ] Verify "Settings" heading is visible
- [ ] Verify "Invert Controls" toggle is present

**Navigation:**
- [ ] Click "Back to Game" button
- [ ] Verify redirect to `/` (game page)
- [ ] Browser back button works correctly

---

### Toggle Tests

**Toggle Interaction:**
- [ ] Toggle starts unchecked (default state)
- [ ] Click toggle
- [ ] Verify visual state changes to checked
- [ ] Reload page
- [ ] Verify toggle remains checked (persistence)

**Keyboard Interaction:**
- [ ] Tab to toggle (verify focus ring)
- [ ] Press Space key
- [ ] Verify toggle activates
- [ ] Press Enter key
- [ ] Verify toggle activates

---

### LocalStorage Tests

**Save:**
- [ ] Enable control inversion
- [ ] Open DevTools → Application → Local Storage
- [ ] Verify key `void-drift:settings` exists
- [ ] Verify value is `{"invertControls":true}`

**Load:**
- [ ] Set localStorage manually: `localStorage.setItem('void-drift:settings', '{"invertControls":true}')`
- [ ] Navigate to `/settings`
- [ ] Verify toggle shows checked state

**Corruption Handling:**
- [ ] Set localStorage to invalid JSON: `localStorage.setItem('void-drift:settings', 'invalid')`
- [ ] Navigate to `/settings`
- [ ] Verify no crash (console warning expected)
- [ ] Verify toggle defaults to unchecked

**Clear:**
- [ ] Set localStorage
- [ ] Run `localStorage.clear()` in console
- [ ] Reload page
- [ ] Verify toggle defaults to unchecked

---

### Control Inversion Tests

**Normal Controls (invertControls = false):**
- [ ] Start game with normal settings
- [ ] Press `A` or Left Arrow
- [ ] Verify ship rotates left and applies left engine
- [ ] Press `D` or Right Arrow
- [ ] Verify ship rotates right and applies right engine

**Inverted Controls (invertControls = true):**
- [ ] Enable control inversion in settings
- [ ] Return to game
- [ ] Press `A` or Left Arrow
- [ ] Verify ship rotates RIGHT (inverted)
- [ ] Press `D` or Right Arrow
- [ ] Verify ship rotates LEFT (inverted)

**Touch Controls (Mobile):**
- [ ] Enable control inversion
- [ ] Open game on mobile device
- [ ] Tap left side of screen
- [ ] Verify right engine activates (inverted)
- [ ] Tap right side of screen
- [ ] Verify left engine activates (inverted)

**Immediate Application:**
- [ ] Start game with normal controls
- [ ] Navigate to `/settings` (game keeps running in background)
- [ ] Enable control inversion
- [ ] Return to game (no reload)
- [ ] Press controls
- [ ] Verify inversion applies immediately

---

### Mobile Responsiveness

**320px Width (iPhone SE):**
- [ ] Resize browser to 320px width
- [ ] Verify settings page is readable
- [ ] Verify toggle is tappable (min 44px target)
- [ ] Verify no horizontal scroll

**Portrait Mode:**
- [ ] Test on real mobile device
- [ ] Verify layout works in portrait
- [ ] Verify toggle is accessible

---

## Out of Scope

This PBI does NOT include:
- ❌ Additional settings (sound volume, difficulty, etc.)
- ❌ Cloud sync (Firebase settings storage)
- ❌ Settings export/import
- ❌ Gamepad remapping
- ❌ Sensitivity sliders
- ❌ Visual preview of control scheme
- ❌ In-game pause menu access to settings

---

## Dependencies

**Blocked By:**
- ✅ Phase 4 complete (input system exists)

**Blocks:**
- None (independent feature)

**Parallel Work:**
- PBI-015 (Resource HUD Design) — Can develop simultaneously
- PBI-016 (Resource Logic) — Can develop simultaneously
- PBI-017 (Timer & Death Logic) — Can develop simultaneously

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| localStorage disabled (privacy mode) | Settings don't persist | Graceful fallback to defaults, show info message |
| Settings don't apply without reload | Poor UX | Pass settings reactively to game loop |
| Toggle not accessible on mobile | Unusable for touch users | Ensure 44px min tap target, test on devices |
| Corrupt localStorage crashes game | Game unplayable | Wrap JSON.parse in try/catch, fallback to defaults |

---

## Notes

**Design Decisions:**
- localStorage chosen over cookies (no server-side needed)
- Single toggle for v0.1.0 (expand later if needed)
- Settings are device-specific (not user-specific) — simplifies architecture
- Immediate application (no "Apply" button) — better UX

**Accessibility:**
- Checkbox is native HTML input (screen reader compatible)
- Keyboard navigation fully supported
- Focus indicators preserved (no `outline: none`)
- High contrast text (WCAG AA)

**Future Enhancements (Post-v0.1.0):**
- [ ] Sound volume slider (master, SFX, music)
- [ ] Graphics quality toggle (particles on/off)
- [ ] Control sensitivity slider
- [ ] Visual control scheme preview
- [ ] Gamepad remapping UI
- [ ] Export/import settings JSON
- [ ] Reset to defaults button

---

## Sign-Off

**Specification Author:** @Lead  
**Assigned To:** @Dev  
**Reviewer:** TBD  
**Approved:** ⏳ Pending Review

---

**Related Documents:**
- [Survival Core Spec](../specs/survival-core.md)
- [PBI-015: Resource HUD Design](./PBI-015-Resource-HUD-Design.md) — Parallel work
- [PBI-016: Resource Logic](./PBI-016-Resource-Logic.md) — Parallel work
- [PBI-017: Timer & Death Logic](./PBI-017-Timer-Death-Logic.md) — Parallel work
- [Project Vision](../project-vision.md) — Phase 5