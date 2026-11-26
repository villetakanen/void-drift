# Void Drift — Design Study: Nuclear Fission Effect Family

## Part 1: Period Study

### 1. Star Control II (Super Melee) (1992)
- **Visual Composition:** Explosions (such as those from destroyed ships or the Kohr-Ah's Mines) are composed of circular, expanding, pixelated rings and debris particles that change color from white to yellow, orange, and red. Thruster plume states rely on small, alternating 2-to-3 frame animated "flame" sprites.
- **Staging over Time:** High-contrast burst frames (white) instantly peak and then quickly decay through a predictable color ramp. Frame rate is low, but the contrast between the white-hot burst and the dark void creates high-impact feedback.
- **Transferable Principle:** *High initial contrast.* An instant "frame-zero" white flash, followed by rapid decay, is the most effective way to communicate high kinetic energy without needing high-fidelity particle simulation.
- **Verification:** Checked against original The Ur-Quan Masters / Star Control II 3DO & PC releases.

### 2. Master of Orion II (1996)
- **Visual Composition:** Weapon explosions utilize pre-rendered sprite animations with high-frequency particle debris and circular expansion patterns. Missiles and engines use trail-particle fading and frame-by-frame pulsing states.
- **Size & Danger:** Huge visual scale communicated danger. Capital-ship destructions or large weapon impacts used sprawling chain-reaction explosions, whereas small impacts or engine flickers utilized localized, brief burst patterns.
- **Transferable Principle:** *Visual Accumulation & Spatial Scaling.* Scaling an effect is best achieved by scaling the stamp footprint and density, rather than just stretching the assets. Stacking smaller, overlapping high-frequency "debris" assets creates a far heavier feel than simple uniform scaling.
- **Verification:** Checked against Master of Orion II: Battle at Antares combat gameplay.

### 3. SubSpace / Continuum (1997)
- **Visual Composition:** Rapid, 2D sprite-based engine trails and weapon explosions, heavily utilizing additive (screen/color) blending against a flat dark background.
- **Transferable Principle:** *Blending for Intensity.* When doing cheap 2D graphics without shaders, using overlapping, additive stamps (where overlapping elements rapidly climb to pure white) simulates intense heat and brightness even with a low particle count.
- **Verification:** Recalled from memory.

---

## Part 2: Visual Concept Document

See `fission-concept-sheet.jpg` for the full frame-strip visual sheet and `preview.html` for a live Canvas 2D implementation.

### Rendering Stack Constraints
| Layer | Holds | Blend |
| --- | --- | --- |
| World | Solid faceted ships, bodies | `normal` |
| FX | Accumulated light; decays each 60 Hz tick (half-life 0.1 s), new stamps added in world space | `screen` |
| FX glow | 1/8-resolution copy of FX, upscaled, `blur(12px)`, 90% opacity | `screen` |
| LFX | Crisp per-frame light redrawn from current state, no history, no blur | `hard-light` |

### Stamp Dictionary
1. **Pulse Point:** Sharp multi-pointed radial starburst stamp (`#f4ffd6` core to `#c6ff32` tips) used at frame-zero ignition and peak overlap.
2. **Shock Ring:** Concentric thin-line expansion ring (`#c6ff32` → `#3ac428`) stepped outward in discrete ticks to mark the pressure wave without obscuring the hull.
3. **Shatter Pattern:** High-contrast asymmetric spark/debris cluster stamped on `FX` so overlapping ticks smear and climb toward white-hot cores.

### Anatomy Over Time (60 Hz)

#### 1. Fission Engine Plume (0.45 s cycle, ~0.18 s thrust)
- **0 ms (Frame 1):** Tight white-hot ignition spike behind the nozzle on `LFX` (`#f4ffd6`).
- **30 ms (Frame 2):** Expanding jagged plasma disk (`#e8ff9a` / `#c6ff32`) on `LFX` + initial stamp on `FX`.
- **90 ms (Frame 3):** Crisp green shock ring (`#3ac428` / `#c6ff32`) detaches and expands in world space on `FX` while the ship accelerates away.
- **180 ms (Frame 4):** Thrust ends; residual energetic ring and sparse shatter sparks decay on `FX`.
- **300 ms (Frame 5):** Engine is dark; faint green afterglow fades on `FX` and `FX glow`.
- **450 ms (Frame 6):** Fully inactive until the next pulse cycle.

#### 2. Drone Detonation
- **0 ms (Start):** Compact hot fission spark at the detonation point.
- **+16 ms (Peak):** Multi-stamp starburst overlap climbs to pure white-hot core (`#f4ffd6` → `#c6ff32`) on `FX` + `LFX`.
- **+64 ms (Shock):** Expanding double shock ring with radial shatter streaks; dark inner cavity on `LFX` (`hard-light`) carves contrast into the center.
- **+128 ms (Decay):** Rings break into green-deep cloud/debris stamps (`#3ac428`) while `FX glow` carries the soft nuclear bloom.
- **+250 ms (Dispersion):** Faint outer filaments and sparse cooling embers.
- **+500 ms:** Clear void (`lch(1.57% 4.76 285.25)`).
