# Phase 7: Content & Polish — Implementation Roadmap

**Versions:** v0.2.x → v0.3.0
**Status:** 🚧 PLANNING
**Goal:** Add gameplay variety with multiple planets and enhance "game feel" with visual juice and audio.

---

## Executive Summary

Phase 7 shifts focus from infrastructure (architecture/high scores) to **User Experience**. We will transform the arena from a static single-planet system to a dynamic multi-planetary system, and implement the "Juice" philosophy defined in the project vision (screen shake, particles, sound).

**Why This Matters:**
- **Variety:** Multiple planets create shifting gravity landscapes, forcing players to adapt navigation strategies.
- **Immersion:** Audio and visual feedback (Screen Shake, Sound FX) turn a "tech demo" into a "game".
- **Retention:** "Juice" makes the core loop satisfying significantly increasing "one more run" appeal.

---

## Phase 7 Components

### Track A: Gameplay Variety (v0.2.x)

#### PBI-032: Multi-Planet System
**Priority:** HIGH
**Estimate:** 5 Story Points
**Target Version:** v0.2.1

**What It Does:**
- Refactor `SURVIVAL_CONFIG` to support an array of planets instead of a single object.
- Update `packages/core/.../physics` to calculate gravity and collisions for `N` planets.
- Configure 3 specific planets for the default mode:
    1. **The Rock:** Existing large planet, slow orbit.
    2. **The Gas:** Medium planet, faster orbit, larger gravity well.
    3. **The Moon:** Small, fast, erratic orbit (optional: retrograde).

**Success Criteria:**
- Physics engine handles multiple gravity sources correctly (vector addition).
- Collisions work on all planets.
- No significant performance drop (maintain 60fps).

**Link:** [PBI-032: Multi-Planet System](./backlog/PBI-032-Multi-Planet-System.md)

---

### Track B: The "Juice" (v0.3.0)

#### PBI-033: Visual Juice (Screen Shake & Impacts)
**Priority:** MEDIUM
**Estimate:** 3 Story Points
**Target Version:** v0.2.2

**What It Does:**
- Implement a **Screen Shake** system controlled by a "trauma" value that decays over time.
    - Impact = High trauma.
    - Near miss / Boost = Low trauma.
- **Hull Damage Feedback:** Visual flash or color shift on ship when taking damage.
- **Particle Refinement:** smoother fades, color variance based on speed/source.

**Success Criteria:**
- Collisions cause visible screen shake (2-4px).
- Damage is visually apparent without looking at the HUD.
- "Trauma" system feels responsive but not nauseating.

**Link:** [PBI-033: Visual Juice](./backlog/PBI-033-Visual-Juice.md)

---

#### PBI-034: Audio System (Web Audio API)
**Priority:** HIGH
**Estimate:** 8 Story Points
**Target Version:** v0.3.0

**What It Does:**
- Implement a `SoundManager` class using the Web Audio API.
- **Procedural Audio Generation:**
    - **Thrust:** Noise node + Lowpass filter (modulated by throttle).
    - **Collision:** Sawtooth/Square wave decay (retro explosion sound).
    - **Get Ready:** Simple arpeggio or chime on start.
    - **Death:** Noise burst.
- **Settings Integration:** Add "Mute" and "Volume" to Settings page.
- **No External Assets:** All sounds synthesized at runtime to keep bundle size small.

**Success Criteria:**
- Sounds play on user interaction (resolves AudioContext restriction).
- Thrust sound modulates with input.
- Audio matches the "Neon/Retro" aesthetic.
- Can be muted via Settings.

**Link:** [PBI-034: Audio System](./backlog/PBI-034-Audio-System.md)

---

### Track C: Optimization (v0.3.x)

#### PBI-035: Mobile Performance Audit
**Priority:** LOW
**Estimate:** 3 Story Points
**Target Version:** v0.3.1

**What It Does:**
- Profile the game on mid-range devices (iPhone 12 / Pixel 5 class).
- Optimize canvas rendering:
    - Use offscreen canvas for static background elements (stars, grid).
    - Reduce particle count on mobile if needed.
    - Optimize collision detection spatial partitioning (if necessary).

**Success Criteria:**
- 60fps maintained during heavy action on target devices.
- Battery usage analyzed and minimized.

**Link:** [PBI-035: Mobile Performance Audit](./backlog/PBI-035-Mobile-Performance.md)

---

## Dependencies

- **PBI-032 (Multi-Planet)** must be completed before visual tuning, as it changes the play space.
- **PBI-034 (Audio)** is the largest task and can proceed in parallel with Track A.

---

## Success Metrics

### Gameplay
- **Variety:** Players encounter different orbital configurations each run (due to planet speeds).
- **Feedback:** Damage is instantly recognized via visual/audio cues (improving reaction times).

### Technical
- **Performance:** Adding 2 planets and audio processing does not dip FPS below 60.
- **Bundle Size:** Remains small (no MP3/WAV files added).

---

## Out of Scope (Phase 8+)

- **Mode B (Multiplayer):** Still deferred.
- **New Ships:** Custom hulls/skins deferred.
- **Power-ups:** Shield/Magnet/etc deferred.

---

## Sign-Off

**Target Completion:** Q2 2025
