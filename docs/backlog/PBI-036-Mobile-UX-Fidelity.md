# PBI-036: Mobile UX Fidelity

**Status:** DONE  
**Priority:** HIGH  
**Estimate:** 2 Story Points  
**Phase:** 7 (Content & Polish)  
**Target Version:** v0.2.1  
**Epic:** [Phase 7: Content & Polish](../PHASE-7-ROADMAP.md)

---

## User Story

**As a** mobile player  
**I want** the game to occupy the full screen without browser chrome  
**So that** I feel immersed in the "Void" and don't accidentally trigger browser navigation gestures

---

## Context

This is a "Quick Win" PBI focused on transforming the web experience into a "Native App" feel on mobile devices. Currently, the browser address bar and navigation buttons take up significant vertical space and can cause layout shifts during gameplay.

**Why This Matters:**
- **Immersion:** Removing the address bar makes the game feel like a dedicated application.
- **Screen Real Estate:** Provides more room for the dual-canvas VFX stacks.
- **UX Reliability:** Prevents users from accidentally swiping "back" or "forward" while trying to navigate the ship.

---

## Blueprint

### 1. Fullscreen API Manager

Web browsers require a **User Gesture** (click/tap) to enter fullscreen mode. We will implement this as a utility that triggers when the user clicks the "Start Game" or "Play Again" button.

**File:** `packages/core/src/lib/ui/fullscreen.ts`

```typescript
export async function requestFullscreen(element: HTMLElement): Promise<void> {
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if ((element as any).webkitRequestFullscreen) {
      /* Safari/iOS support */
      await (element as any).webkitRequestFullscreen();
    } else if ((element as any).msRequestFullscreen) {
      await (element as any).msRequestFullscreen();
    }
  } catch (err) {
    console.warn("Fullscreen request failed:", err);
  }
}

export function isFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
}
```

### 2. PWA Meta Tags (The "Manifest-Lite")

Update the main entry point to include tags that tell mobile browsers how to treat the page when "Added to Home Screen" or opened in standalone mode.

**File:** `apps/web/src/layouts/Layout.astro` (or equivalent meta tag location)

```html
<!-- Mobile Chrome/Android -->
<meta name="mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#000000">

<!-- iOS Safari -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Void Drift">
```

### 3. Dynamic Viewport CSS

Use modern CSS units to ensure the game container always fills exactly the available space, accounting for browser chrome being shown or hidden.

**File:** `apps/web/src/styles/global.css`

```css
:root {
  /* Use dvh (Dynamic Viewport Height) for the game container */
  --game-height: 100dvh;
}

#game-container {
  height: var(--game-height);
  width: 100vw;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  background: #000;
}
```

---

## Acceptance Criteria

### Fullscreen Logic
- [ ] Game enters fullscreen mode when "Start Game" is clicked.
- [ ] Logic handles Safari (webkit) and standard Fullscreen API.
- [ ] Utility function `requestFullscreen` provided in `@void-drift/core`.

### Meta Tags & Branding
- [ ] iOS "Add to Home Screen" renders without Safari UI.
- [ ] Status bar is set to `black-translucent`.
- [ ] Android theme color set to match the Void aesthetic (#000000).

### Layout Consistency
- [ ] The game container uses `100dvh` (or fallback) to prevent gaps.
- [ ] No "jumping" or resizing artifacts when address bar hides/shows.
- [ ] Scroll is disabled on the body to prevent "bounce" on iOS Safari.

---

## Technical Implementation

### Step 1: Core Utility (20 min)
- Create `packages/core/src/lib/ui/fullscreen.ts`.
- Export from `packages/core/src/index.ts`.

### Step 2: UI Integration (30 min)
- Update `apps/web/src/components/MenuOverlay.svelte`.
- Add `onclick` handler to the Start button that calls `requestFullscreen(gameContainer)`.

### Step 3: CSS & Meta (20 min)
- Update `Layout.astro` with PWA meta tags.
- Update global CSS to use `dvh` units for the main viewport.

---

## Related Documents
- [Phase 7 Roadmap](../PHASE-7-ROADMAP.md)
- [PBI-035: Mobile Performance Audit](./PBI-035-Mobile-Performance.md)
- [Project Vision](../project-vision.md)
