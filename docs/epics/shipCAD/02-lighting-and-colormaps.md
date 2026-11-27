# 02 — Lighting, Mirror X & 11-Step LCH Colormaps

Draft part of the [ShipCAD epic](README.md), 2026-11-27.

---

## 1. Coordinates & `Mirror X`

### CAD authoring space vs. game space

- **CAD authoring space (bow-up on screen):**
  - `x` (`across`): horizontal axis across the ship. `x = 0` is the centreline, `x < 0` is port (left), `x > 0` is starboard (right).
  - `y` (`aft`): vertical axis on screen. `y < 0` is bow/forward (up), `y > 0` is stern/aft (down).
  - `z`: height out of the screen (`z >= 0` typically; `z = 0` baseline).
- **Game ship-local space (`packages/mode-a`, `+x` forward, `+y` right):**
  - `gameX = -y`, `gameY = x`.
- **Scale:** 1 CAD unit = 1 `mode-a` ship unit (`BUILD_FLIGHT_SCALE = 0.65` in flight).

### `Mirror X` geometry & asymmetric lighting

Each layered Object carries `mirrorX: boolean` (default `true`):

1. When `mirrorX = true`, every authored triangle on the port side (or spanning vertices on `x = 0`) automatically generates its mirrored counterpart across `x = 0`:
   - Vertex `(x, y, z)` mirrors to `(-x, y, z)`.
   - Vertices on the centreline (`x = 0`) are shared between both sides so spine ridges stay watertight with zero seam gaps.
   - Triangle winding reverses on the mirrored copy `(A, B, C) -> (A', C', B')` so both sides keep outward `+z` surface normals.
2. **Lighting is evaluated after mirroring:** Because the light vector comes from **upper-left (port-forward-above)**, a port slope normal `(-nx, ny, nz)` faces into the light (landing on steps `0..4`), while its mirrored starboard twin `(+nx, ny, nz)` faces away from the light (landing on steps `6..10`). Raising one centreline vertex `(0, y, z)` immediately lights the port face bright and shades the starboard face dark.

---

## 2. Pure Algorithmic Shading into 11 Steps (`0..10`)

Every object produces **only** the 11 discrete colors of its chosen colormap (`step = 0` brightest → `step = 10` darkest). No intermediate colors and no manual per-triangle overrides exist.

### Normal + `z` elevation score

For a triangle with 3D vertices $\mathbf{p}_1, \mathbf{p}_2, \mathbf{p}_3$ in CAD units:

1. **Outward unit normal:**
   $$\mathbf{n} = \text{normalize}((\mathbf{p}_2 - \mathbf{p}_1) \times (\mathbf{p}_3 - \mathbf{p}_1))$$
   flipped if $n_z < 0$ so $n_z \ge 0$.
2. **Directional upper-left light:**
   Let $\mathbf{L} = \text{normalize}(-0.62,\ -0.32,\ 0.72)$ (port-left, slightly forward/above — tunable globally during calibration).
   Notice a flat horizontal deck $\mathbf{n} = (0, 0, 1)$ has $\mathbf{n} \cdot \mathbf{L} = L_z$.
3. **Tilt term + gentle `z` height bias:**
   Let $z_{\text{mean}} = (z_1 + z_2 + z_3) / 3$, clamped to a reference height ceiling $Z_{\text{ref}}$ (e.g. `12` ship units):
   $$s_{\text{tilt}} = \mathbf{n} \cdot \mathbf{L} - L_z$$
   $$s_{\text{height}} = k_z \cdot \left(\frac{\text{clamp}(z_{\text{mean}}, 0, Z_{\text{ref}})}{Z_{\text{ref}}}\right)$$
   $$S = \text{clamp}(0.5 - k_{\text{tilt}} \cdot s_{\text{tilt}} - s_{\text{height}},\ 0,\ 1)$$
   $$\text{step} = \text{round}(S \times 10) \in \{0, 1, \dots, 10\}$$

What this guarantees:

- At `z = 0`, a flat horizontal wing ($s_{\text{tilt}} = 0, s_{\text{height}} = 0$) lands on **step `5`** (exact neutral middle of the 11 shades).
- A flat horizontal spine deck raised to `z = 6..10` ($s_{\text{tilt}} = 0, s_{\text{height}} > 0$) steps `1..2` shades brighter (**step `3` or `4`**) than a low flat wing at `z = 0`, while still outputting only valid palette steps.
- Steep upper-left facing bevels at high `z` reach **step `0`** (brightest highlight strip); steep starboard/aft-falling bevels reach **steps `8..10`** (deepest shadow).

---

## 3. CAD-Only 11-Step LCH Colormaps

Owned strictly inside `packages/ship-cad/src/lib/colormaps.ts` (never imported by `packages/mode-a`). All 33 colors below are verified inside the sRGB gamut and anchored to measured LCH values of existing Void Drift artwork:

- **`ship` anchors:** `FIGHTER.facets` (`#c8f4f0` = `lch(93.0% 15.5 191.2)` down to `#264d6b` = `lch(31.0% 22.9 253.5)`).
- **`weapon` anchors:** `ion-cannon-art.ts` / `drone-art.ts` (`#52575f` = `lch(36.7% 5.4 262.8)` down to `#12171e` = `lch(7.5% 5.8 262.6)`).
- **`equipment` anchors:** `utility-art.ts` / `potential-well-art.ts` (`#cedb17` = `lch(84.3% 81.9 103.6)`, `#87920f` = `lch(58.1% 60.1 104.5)`, `#71780d` = `lch(48.5% 51.6 103.5)`, aligned with `--color-brand` hue `104.87°`).

### Draft 11-step tables (`0` brightest → `10` darkest)

| Step | `ship` (Hull whites / cyan-slate) | `weapon` (Gunmetal blacks) | `equipment` (Equipment yellow) | Typical surface |
| --- | --- | --- | --- | --- |
| `0` | `lch(93.0% 15.5 191.0)` | `lch(44.0% 5.5 261.0)` | `lch(92.0% 84.0 104.0)` | High ridge / steep port-fore bevel |
| `1` | `lch(86.5% 17.7 197.3)` | `lch(40.4% 5.3 260.7)` | `lch(86.0% 79.0 104.0)` | Strong port bevel |
| `2` | `lch(80.0% 19.8 203.6)` | `lch(36.7% 5.2 260.4)` | `lch(80.0% 74.0 104.0)` | Moderate port slope |
| `3` | `lch(73.5% 21.6 209.9)` | `lch(33.0% 5.0 260.1)` | `lch(74.0% 69.0 104.0)` | Gentle port slope / high flat spine |
| `4` | `lch(67.0% 22.9 216.2)` | `lch(29.4% 4.9 259.8)` | `lch(68.0% 64.0 104.0)` | Raised flat deck / mild fore tilt |
| `5` | `lch(60.5% 23.8 222.5)` | `lch(25.8% 4.8 259.5)` | `lch(62.0% 59.0 104.0)` | Neutral flat wing / deck (`z = 0`) |
| `6` | `lch(54.0% 24.0 228.8)` | `lch(22.1% 4.6 259.2)` | `lch(56.0% 54.0 104.0)` | Mild starboard / aft tilt |
| `7` | `lch(47.5% 23.6 235.1)` | `lch(18.5% 4.5 258.9)` | `lch(50.0% 49.0 104.0)` | Moderate starboard slope |
| `8` | `lch(41.0% 22.7 241.4)` | `lch(14.8% 4.3 258.6)` | `lch(44.0% 44.0 104.0)` | Steep starboard slope |
| `9` | `lch(34.5% 21.2 247.7)` | `lch(11.1% 4.2 258.3)` | `lch(38.0% 39.0 104.0)` | Deep away-facing bevel |
| `10` | `lch(28.0% 19.4 254.0)` | `lch(7.5% 4.0 258.0)` | `lch(32.0% 34.0 104.0)` | Steepest recessed shadow |

*(Curves can be visually tuned on a calibration sheet in `/lab/ship-cad` once we view them at `1.0×` and `0.65×` on the dark void backdrop.)*
