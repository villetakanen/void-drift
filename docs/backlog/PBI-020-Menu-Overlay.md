# PBI-020: Menu Overlay

**Status:** TODO  
**Priority:** HIGH  
**Estimate:** 2 Story Points  
**Phase:** 5 (Survival Core)  
**Target Version:** v0.1.0

---

## User Story

**As a** player  
**I want** a menu screen when the game loads  
**So that** I can start the game intentionally and access settings

---

## Context

Currently the game starts immediately on first input with no visible menu UI. Players have no way to navigate to the settings page from the game.

This PBI adds a menu overlay that:
- Shows "TAP TO START" button
- Provides a link to Settings
- Gives players control over when the game begins

**Dependencies:**
- ✅ PBI-017 (Game state machine with MENU state exists)
- ✅ PBI-018 (Settings page exists)

---

## Acceptance Criteria

### Menu Overlay Display
- [x] Overlay visible when game is in `MENU` state
- [x] Overlay hidden when game is in `PLAYING` state
- [x] Overlay hidden when game is in `GAME_OVER` state
- [x] Game canvas renders behind overlay (visible through semi-transparent background)
- [x] Existing logo and version display remain visible

### Visual Design
- [x] Semi-transparent background using `var(--color-overlay)` token
- [x] "TAP TO START" button centered on screen
- [x] Button uses ghost style (transparent bg, neon-blue border)
- [x] "Settings" link below the button
- [x] Settings link uses dim text color, brightens on hover

### Start Game Interaction
- [x] Click/tap "TAP TO START" button → game starts
- [x] Press any key (except Tab, Escape, modifiers) → game starts
- [x] Tap anywhere on overlay (mobile) → game starts
- [x] Game transitions to `PLAYING` state and timer begins

### Settings Navigation
- [x] "Settings" link navigates to `/settings`
- [x] Returning from `/settings` shows menu overlay (MENU state)

### Keyboard Accessibility
- [x] Tab cycles focus between start button and settings link
- [x] Enter/Space activates focused element
- [x] Focus ring visible on focused elements
- [x] Start button receives focus on overlay mount

### Mobile Support
- [x] Touch targets minimum 44px
- [x] Tapping overlay background starts game
- [x] Settings link remains tappable (doesn't start game)

---

## Technical Implementation

### New Design Token

**File:** `apps/web/src/styles.css`

```css
--color-overlay: rgba(5, 5, 16, 0.9);
/* Semi-transparent void for modal overlays */
```

### New Component

**File:** `apps/web/src/components/MenuOverlay.svelte`

```svelte
<script lang="ts">
  let { onStart }: { onStart: () => void } = $props();
  
  let startButton: HTMLButtonElement;
  
  function handleKeydown(event: KeyboardEvent) {
    if (['Tab', 'Escape', 'Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) {
      return;
    }
    if (document.activeElement?.classList.contains('settings-link')) {
      return;
    }
    onStart();
  }
  
  function handleOverlayClick(event: MouseEvent) {
    if ((event.target as Element).closest('.settings-link')) {
      return;
    }
    onStart();
  }
  
  $effect(() => {
    startButton?.focus();
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

<style>
  .menu-overlay {
    position: fixed;
    inset: 0;
    background: var(--color-overlay);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }
  
  .menu-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-lg);
  }
  
  .start-button {
    background: transparent;
    border: 2px solid var(--color-neon-blue);
    color: var(--color-neon-blue);
    padding: var(--spacing-md) var(--spacing-xl);
    font-size: 1.25rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s ease, color 0.15s ease;
  }
  
  .start-button:hover {
    background: var(--color-neon-blue);
    color: var(--color-void);
  }
  
  .start-button:focus-visible {
    outline: 2px solid var(--color-neon-blue);
    outline-offset: 4px;
  }
  
  .settings-link {
    color: var(--color-text-dim);
    text-decoration: none;
    font-size: 0.875rem;
    transition: color 0.15s ease;
    padding: var(--spacing-sm);
  }
  
  .settings-link:hover {
    color: var(--color-text);
  }
  
  .settings-link:focus-visible {
    outline: 2px solid var(--color-neon-blue);
    outline-offset: 2px;
  }
</style>
```

### GameWrapper Changes

**File:** `apps/web/src/components/GameWrapper.svelte`

1. Import MenuOverlay
2. Add `startGame()` function
3. Render MenuOverlay when `state.status === "MENU"`
4. Remove auto-start from input handling

### game-loop.ts Changes

**File:** `packages/engine/src/lib/engine/game-loop.ts`

Modify `updateTimer()` to not auto-start on input - menu overlay handles start explicitly.

### GameOver.svelte Changes

**File:** `apps/web/src/components/GameOver.svelte`

Update to use `var(--color-overlay)` instead of hardcoded `rgba(10, 10, 15, 0.95)`.

---

## Definition of Done

- [x] All acceptance criteria met
- [x] Menu overlay displays in MENU state
- [x] Start button and settings link functional
- [x] Keyboard navigation works
- [x] Mobile touch works
- [x] `--color-overlay` token added to design system
- [x] GameOver.svelte updated to use overlay token
- [x] Zero TypeScript errors (`pnpm -r check`)
- [ ] Manual QA complete

---

## Testing Checklist

### Visual
- [ ] Overlay covers viewport
- [ ] Game canvas visible behind overlay
- [ ] Start button styled correctly (ghost button)
- [ ] Settings link visible and styled
- [ ] Logo and version visible through overlay

### Start Game
- [ ] Click start button → game starts, overlay disappears
- [ ] Press Space → game starts
- [ ] Press Enter → game starts
- [ ] Press any letter key → game starts
- [ ] Tab key does NOT start game
- [ ] Escape key does NOT start game

### Settings Navigation
- [ ] Click settings link → navigates to /settings
- [ ] Tab to settings link, press Enter → navigates
- [ ] Return from settings → menu overlay visible

### Mobile
- [ ] Tap start button → game starts
- [ ] Tap overlay background → game starts
- [ ] Tap settings link → navigates (does NOT start game)

### State Transitions
- [ ] Game loads → MENU state → overlay visible
- [ ] Start game → PLAYING state → overlay hidden
- [ ] Die → GAME_OVER state → GameOver modal (not menu)
- [ ] Restart → MENU state → overlay visible

---

## Out of Scope

- Logo animation
- Sound effects
- Difficulty selection
- Credits screen
- Social links

---

## Related Documents

- [Menu Overlay Spec](../specs/menu-overlay.md)
- [Settings System Spec](../specs/settings-system.md)
- [PBI-017: Timer & Death Logic](./PBI-017-Timer-Death-Logic.md)
- [PBI-018: Settings Route](./PBI-018-Settings-Route.md)
