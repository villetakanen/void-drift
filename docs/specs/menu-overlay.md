# Menu Overlay Specification

**Status:** DRAFT  
**Phase:** 5 (Survival Core)  
**Related PBI:** PBI-018 (Settings), PBI-017 (Game State)

---

## Overview

The menu overlay provides the entry point to the game. It displays when the game is in `MENU` state and allows players to start the game or access settings.

---

## Design Goals

1. **Minimal** - Clean, uncluttered design matching void aesthetic
2. **Accessible** - Works with keyboard, mouse, and touch
3. **Responsive** - Adapts to mobile and desktop
4. **Non-blocking** - Game canvas renders behind overlay (visual appeal)

---

## Visual Design

### Layout

```
┌─────────────────────────────────────────┐
│                                         │
│              ∅·Δ                        │  <- Logo (existing)
│                                         │
│                                         │
│         ┌─────────────────┐             │
│         │   TAP TO START  │             │  <- Primary CTA button
│         └─────────────────┘             │
│                                         │
│             Settings                    │  <- Secondary link
│                                         │
│                                         │
│            α 0.1.0                      │  <- Version (existing)
└─────────────────────────────────────────┘
```

### Colors & Styling

| Element | Color | Notes |
|---------|-------|-------|
| Overlay background | `var(--color-overlay)` | Semi-transparent void (new token) |
| Start button background | `transparent` | Ghost button style |
| Start button border | `var(--color-neon-blue)` | 2px solid |
| Start button text | `var(--color-neon-blue)` | Uppercase, letter-spacing |
| Start button hover | `var(--color-neon-blue)` bg, `var(--color-void)` text | Inverted |
| Settings link | `var(--color-text-dim)` | Subtle, not competing with CTA |
| Settings link hover | `var(--color-text)` | Brightens on hover |

### New Design Token

Add to `styles.css`:

```css
--color-overlay: rgba(5, 5, 16, 0.9);
/* Semi-transparent void for modal overlays */
```

This token should also be used by `GameOver.svelte` (currently uses hardcoded `rgba(10, 10, 15, 0.95)`).

### Typography

| Element | Size | Weight | Style |
|---------|------|--------|-------|
| Start button | 1.25rem | 500 | Uppercase, 0.1em letter-spacing |
| Settings link | 0.875rem | 400 | Normal case |

### Spacing

- Start button: `padding: var(--spacing-md) var(--spacing-xl)`
- Gap between button and settings: `var(--spacing-lg)`
- Minimum touch target: 44px height

---

## Behavior

### State Visibility

| Game State | Overlay Visible |
|------------|-----------------|
| `MENU` | Yes |
| `PLAYING` | No |
| `GAME_OVER` | No (GameOver modal shows instead) |

### Start Game Triggers

The game starts (transitions to `PLAYING`) when:

1. **Click/tap** the "TAP TO START" button
2. **Press any key** (except Tab, Escape, or modifier keys)
3. **Touch anywhere** on the overlay (mobile convenience)

### Settings Navigation

- Clicking "Settings" navigates to `/settings`
- Returning from `/settings` returns to `MENU` state (fresh start)
- Settings link uses standard `<a href="/settings">` (no SPA routing needed)

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Cycle focus: Start button → Settings link |
| Enter/Space | Activate focused element |
| Any other key | Start game (when not focused on Settings) |

### Focus Management

- On overlay mount, focus the "TAP TO START" button
- Visible focus ring on interactive elements
- Focus trapped within overlay while visible

---

## Accessibility

### ARIA

```html
<div class="menu-overlay" role="dialog" aria-modal="true" aria-label="Game menu">
  <button class="start-button" autofocus>TAP TO START</button>
  <a href="/settings" class="settings-link">Settings</a>
</div>
```

### Requirements

- [x] Focus visible on all interactive elements
- [x] Keyboard navigable (Tab, Enter, Space)
- [x] Touch targets >= 44px
- [x] Sufficient color contrast (WCAG AA)
- [x] Screen reader announces "Game menu" dialog

---

## Responsive Design

### Desktop (> 768px)

- Centered content
- Start button: normal size
- Hover states active

### Mobile (≤ 768px)

- Centered content
- Start button: slightly larger touch target
- No hover states (touch-based)
- Full overlay tap starts game (in addition to button)

### Portrait Warning

The existing rotate overlay takes precedence. Menu overlay only shows in landscape or on desktop.

---

## Component Structure

### File

`apps/web/src/components/MenuOverlay.svelte`

### Props

```typescript
interface Props {
  onStart: () => void;  // Called when game should start
}
```

### Implementation Notes

```svelte
<script lang="ts">
  let { onStart }: Props = $props();
  
  let startButton: HTMLButtonElement;
  
  function handleKeydown(event: KeyboardEvent) {
    // Ignore navigation keys
    if (['Tab', 'Escape', 'Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) {
      return;
    }
    
    // Don't start if focused on settings link
    if (document.activeElement?.classList.contains('settings-link')) {
      return;
    }
    
    onStart();
  }
  
  function handleOverlayClick(event: MouseEvent) {
    // Only start if clicking overlay background, not the settings link
    if ((event.target as Element).closest('.settings-link')) {
      return;
    }
    onStart();
  }
  
  $effect(() => {
    // Focus start button on mount
    startButton?.focus();
    
    // Listen for any key press
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

<div 
  class="menu-overlay" 
  role="dialog" 
  aria-modal="true" 
  aria-label="Game menu"
  onclick={handleOverlayClick}
>
  <div class="menu-content">
    <button 
      bind:this={startButton}
      class="start-button"
      onclick={onStart}
    >
      TAP TO START
    </button>
    
    <a href="/settings" class="settings-link">Settings</a>
  </div>
</div>
```

---

## Integration

### GameWrapper.svelte Changes

```svelte
<!-- Add import -->
import MenuOverlay from "./MenuOverlay.svelte";

<!-- Add to HUD overlay section -->
{#if state.status === "MENU"}
  <MenuOverlay onStart={startGame} />
{/if}

<!-- Add startGame function -->
function startGame() {
  state.status = 'PLAYING';
  state.startTime = Date.now();
}
```

### Input System Changes

Remove automatic start-on-input from `updateTimer()` since the menu overlay now handles it explicitly.

```typescript
// game-loop.ts - updateTimer should NOT auto-start
export function updateTimer(state: GameState): void {
  // Only update elapsed time during gameplay
  if (state.status === 'PLAYING' && state.startTime !== null) {
    state.elapsedTime = (Date.now() - state.startTime) / 1000;
  }
}
```

---

## Animation

### Fade Out on Start

When game starts, overlay fades out:

```css
.menu-overlay {
  transition: opacity 0.3s ease;
}

.menu-overlay.hidden {
  opacity: 0;
  pointer-events: none;
}
```

Consider a brief delay before hiding to allow the fade animation.

---

## Testing Checklist

### Visual

- [ ] Overlay covers viewport with semi-transparent background
- [ ] Game canvas visible behind overlay
- [ ] Start button centered and styled correctly
- [ ] Settings link visible below button
- [ ] Logo and version visible (from existing HUD)

### Interaction

- [ ] Click start button → game starts
- [ ] Press any key → game starts
- [ ] Tap overlay (mobile) → game starts
- [ ] Click settings link → navigates to `/settings`
- [ ] Return from settings → shows menu overlay

### Keyboard

- [ ] Tab cycles between start button and settings link
- [ ] Enter/Space activates focused element
- [ ] Focus ring visible on focused element
- [ ] Any key starts game (when not on settings link)

### Mobile

- [ ] Touch start button → game starts
- [ ] Touch anywhere on overlay → game starts
- [ ] Touch settings link → navigates to settings
- [ ] Touch targets are 44px minimum

### State

- [ ] Overlay visible in MENU state
- [ ] Overlay hidden in PLAYING state
- [ ] Overlay hidden in GAME_OVER state
- [ ] After restart, overlay visible again

---

## Out of Scope (v0.1.0)

- Logo animation on menu
- Sound on start
- Difficulty selection
- Player name entry
- "Continue" option (no save system)
- Social links
- Credits

---

## References

- [Survival Core Spec](./survival-core.md) - Game state machine
- [Settings System Spec](./settings-system.md) - Settings navigation
- [PBI-017: Timer & Death Logic](../backlog/PBI-017-Timer-Death-Logic.md) - State transitions
- [PBI-018: Settings Route](../backlog/PBI-018-Settings-Route.md) - Settings page
