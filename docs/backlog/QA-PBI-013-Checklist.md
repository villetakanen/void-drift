# QA Checklist: PBI-013 Game Viewport & Camera

**Status:** Ready for Testing  
**Feature:** 16:9 Viewport Constraint + Camera Tracking  
**Build:** Latest (post-PBI-013)

---

## Pre-Test Setup

- [ ] Pull latest code from repository
- [ ] Run `pnpm install` to ensure dependencies are up-to-date
- [ ] Run `pnpm --filter web dev` to start development server
- [ ] Open browser to `http://localhost:4321`

---

## Test Suite 1: Viewport Aspect Ratio

### Test 1.1: Desktop - Standard Resolution
- [ ] Open game on 1920x1080 display (or resize window to this size)
- [ ] **Expected:** Game fills entire window with no black bars
- [ ] **Expected:** Canvas appears sharp, not blurry
- [ ] **Expected:** Logo (∅·Δ) visible in top-left corner

### Test 1.2: Desktop - Ultrawide Monitor
- [ ] Resize browser window to ultrawide ratio (e.g., 2560x1080 or wider)
- [ ] **Expected:** Black bars (letterboxing) appear on left and right sides
- [ ] **Expected:** Game viewport remains 16:9 aspect ratio
- [ ] **Expected:** No extra game world visible compared to 1920x1080
- [ ] **Expected:** Ship wrapping boundaries unchanged (no ultrawide advantage)

### Test 1.3: Desktop - Portrait Orientation
- [ ] Resize browser window to tall/narrow ratio (e.g., 1080x1920)
- [ ] **Expected:** Black bars appear on top and bottom
- [ ] **Expected:** Game viewport scales to fit width
- [ ] **Expected:** All UI elements remain visible

### Test 1.4: Desktop - Square Window
- [ ] Resize browser window to square (e.g., 1080x1080)
- [ ] **Expected:** Letterboxing on either top/bottom or sides
- [ ] **Expected:** 16:9 aspect ratio maintained
- [ ] **Expected:** No distortion or stretching of game objects

### Test 1.5: Dynamic Resize
- [ ] Start at 1920x1080, then slowly drag window edge to make it wider
- [ ] **Expected:** Game container smoothly scales
- [ ] **Expected:** No flashing or layout jumps
- [ ] **Expected:** Ship position remains consistent (no "teleporting")

---

## Test Suite 2: Camera Tracking

### Test 2.1: Camera Follows Ship
- [ ] Launch game and observe ship starting position
- [ ] **Expected:** Ship is initially centered in viewport (or slightly offset)
- [ ] **Expected:** Camera position matches ship position
- [ ] Thrust ship forward using WASD or touch controls
- [ ] **Expected:** Camera smoothly follows ship movement
- [ ] **Expected:** No jittery or stuttering camera motion
- [ ] **Expected:** Ship stays roughly centered during movement

### Test 2.2: Camera Smoothing
- [ ] Thrust ship to build up speed, then release all controls
- [ ] **Expected:** Camera continues to follow ship as it drifts
- [ ] **Expected:** Camera "lags behind" slightly (smooth interpolation)
- [ ] **Expected:** Camera eventually catches up when ship slows down
- [ ] Thrust ship in one direction, then immediately thrust opposite direction
- [ ] **Expected:** Camera smoothly changes direction, no instant snap

### Test 2.3: Camera at World Boundaries
- [ ] Thrust ship to the edge of the world (triggers wrapping)
- [ ] **Expected:** Camera follows ship smoothly during wrap
- [ ] **Expected:** Background/stars create illusion of continuous space
- [ ] **Expected:** No visible "seam" or abrupt transition

### Test 2.4: Camera Performance
- [ ] Open browser DevTools → Performance tab
- [ ] Record 10 seconds of gameplay with active ship movement
- [ ] Stop recording and analyze
- [ ] **Expected:** Consistent 60 FPS (16.67ms per frame)
- [ ] **Expected:** No frame drops or long tasks
- [ ] **Expected:** Camera.update() takes <0.5ms per frame

---

## Test Suite 3: HUD & UI Overlay

### Test 3.1: Logo Display
- [ ] Check top-left corner of game viewport
- [ ] **Expected:** Logo "∅·Δ" is visible
- [ ] **Expected:** Logo uses Noto Sans Math font (sharp mathematical symbols)
- [ ] **Expected:** Logo has neon blue color (#D4FF00 / acid lime)
- [ ] **Expected:** Logo has subtle glow effect (text-shadow)

### Test 3.2: Controls Hint
- [ ] Check bottom-center of game viewport (desktop)
- [ ] **Expected:** Text reads "WASD / Arrows to Thrust"
- [ ] Switch to mobile device or use touch emulation
- [ ] **Expected:** Text changes to "Tap Sides to Thrust"

### Test 3.3: Version Display
- [ ] Check bottom-right corner of game viewport
- [ ] **Expected:** Version number displayed (e.g., "α 0.0.1")
- [ ] **Expected:** Text is dim/subtle (not distracting)

### Test 3.4: Touch Zone Feedback
- [ ] On mobile or with touch emulation, tap left side of screen
- [ ] **Expected:** Left zone lights up with subtle white overlay
- [ ] **Expected:** Overlay has cyan/lime glow effect
- [ ] Tap right side of screen
- [ ] **Expected:** Right zone lights up independently
- [ ] **Expected:** Both zones can be active simultaneously

### Test 3.5: HUD Stability
- [ ] Thrust ship around the world for 30 seconds
- [ ] **Expected:** All HUD elements remain fixed in screen space
- [ ] **Expected:** Logo, controls hint, and version do NOT move with camera
- [ ] **Expected:** No z-index issues (HUD always on top)

---

## Test Suite 4: Mobile & Responsive

### Test 4.1: Mobile Portrait Warning
- [ ] Open game on mobile device in portrait orientation
- [ ] **Expected:** Full-screen overlay appears
- [ ] **Expected:** Message reads "VOID DRIFT - Please Rotate Device"
- [ ] **Expected:** Overlay has dark background (--color-void)
- [ ] Rotate device to landscape
- [ ] **Expected:** Overlay disappears immediately
- [ ] **Expected:** Game becomes playable

### Test 4.2: Mobile Landscape Gameplay
- [ ] Hold device in landscape orientation
- [ ] **Expected:** Game fills screen with 16:9 viewport
- [ ] **Expected:** Touch zones work on left/right halves of screen
- [ ] **Expected:** Ship responds to touch input
- [ ] **Expected:** No issues with notches or safe areas (iOS)

### Test 4.3: Tablet (iPad)
- [ ] Test on iPad or tablet device
- [ ] **Expected:** Game scales appropriately for larger screen
- [ ] **Expected:** Touch targets are easy to hit (minimum 44px)
- [ ] **Expected:** Logo and UI scale proportionally

### Test 4.4: Small Screens
- [ ] Test on small mobile device (e.g., iPhone SE, 375x667)
- [ ] **Expected:** Logo scales down (32px font size)
- [ ] **Expected:** Controls hint remains readable
- [ ] **Expected:** No text overflow or clipping

---

## Test Suite 5: Coordinate Systems

### Test 5.1: Ship Position Consistency
- [ ] Note ship's world position (if debug overlay available)
- [ ] Resize window from 1920x1080 to 1280x720
- [ ] **Expected:** Ship remains at same world coordinates
- [ ] **Expected:** Ship appears in same relative screen position

### Test 5.2: Star Gravity Behavior
- [ ] Thrust ship near the central star
- [ ] **Expected:** Gravitational pull works correctly
- [ ] **Expected:** Gravity strength consistent regardless of window size
- [ ] Circle around star at edge of influence radius
- [ ] **Expected:** Smooth orbital motion (no jitter)

### Test 5.3: World Wrapping
- [ ] Note that world is 1920x1080 logical units
- [ ] Thrust ship to X > 1920
- [ ] **Expected:** Ship wraps to X = 0
- [ ] Thrust ship to Y > 1080
- [ ] **Expected:** Ship wraps to Y = 0
- [ ] Test negative directions (X < 0, Y < 0)
- [ ] **Expected:** Wrapping works symmetrically

---

## Test Suite 6: Cross-Browser

### Test 6.1: Chrome/Edge (Chromium)
- [ ] Test all functionality in latest Chrome
- [ ] **Expected:** All tests pass

### Test 6.2: Firefox
- [ ] Test all functionality in latest Firefox
- [ ] **Expected:** All tests pass
- [ ] **Expected:** Canvas rendering is crisp (no AA issues)

### Test 6.3: Safari (macOS)
- [ ] Test all functionality in latest Safari
- [ ] **Expected:** All tests pass
- [ ] **Expected:** CSS transforms work correctly

### Test 6.4: Safari (iOS)
- [ ] Test on iPhone/iPad
- [ ] **Expected:** Touch input works correctly
- [ ] **Expected:** No issues with viewport units (vw/vh)
- [ ] **Expected:** Orientation lock/unlock works

---

## Test Suite 7: Edge Cases

### Test 7.1: Rapid Window Resize
- [ ] Rapidly drag window edge back and forth for 5 seconds
- [ ] **Expected:** No crashes or errors
- [ ] **Expected:** Game remains playable
- [ ] **Expected:** No memory leaks (check DevTools Memory tab)

### Test 7.2: Extreme Aspect Ratios
- [ ] Resize window to very wide (4000x600)
- [ ] **Expected:** Heavy letterboxing, but game still playable
- [ ] Resize window to very tall (600x4000)
- [ ] **Expected:** Heavy letterboxing top/bottom
- [ ] **Expected:** No layout breaks

### Test 7.3: Page Visibility Changes
- [ ] Start game, then switch browser tabs
- [ ] Wait 10 seconds, then switch back
- [ ] **Expected:** Game loop resumes correctly
- [ ] **Expected:** No time discontinuity (dt calculation correct)

### Test 7.4: DevTools Inspection
- [ ] Open DevTools while game is running
- [ ] Inspect game-container element
- [ ] **Expected:** Width/height are exactly 16:9 ratio
- [ ] **Expected:** Canvas internal resolution is 1920x1080
- [ ] Inspect camera transform in Renderer
- [ ] **Expected:** ctx.translate() applied correctly

---

## Regression Tests

### Regression 1: Physics Unchanged
- [ ] Ship thrust behavior feels identical to pre-PBI-013
- [ ] Star gravity strength unchanged
- [ ] Ship drag/friction unchanged
- [ ] Max speed unchanged

### Regression 2: Input Handling
- [ ] Keyboard controls (WASD/Arrows) work identically
- [ ] Touch zones work identically
- [ ] No input lag introduced

### Regression 3: Performance
- [ ] FPS is same or better than pre-PBI-013
- [ ] No new memory leaks
- [ ] Build time unchanged

---

## Sign-Off

**Tested By:** _______________  
**Date:** _______________  
**Browser(s):** _______________  
**Device(s):** _______________  

**Issues Found:** _______________  
**Blocker Issues:** _______________  

**Approval:** [ ] PASS / [ ] FAIL

**Notes:**