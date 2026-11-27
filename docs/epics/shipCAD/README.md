# Epic Draft: ShipCAD

Uncommitted epic draft, started 2026-11-27. Lives in `docs/epics/shipCAD/` rather than `docs/plans/` because it maps a larger, undecided enterprise. Nothing here modifies specs until explicitly agreed for implementation.

### Companion documents

- [02 — Lighting, Mirror X & 11-Step LCH Colormaps](02-lighting-and-colormaps.md)
- [03 — Workspace, Self-Contained SVG & Agent Brief](03-svg-and-agent-brief.md)

---

## 1. Purpose & Scope

**ShipCAD** is a Lab sub-app (`/lab/ship-cad`) backed by a dedicated workspace package (`packages/ship-cad`, `@void-drift/ship-cad`) for authoring low-poly Void Drift **ships**.

*(With zoom and scale, the exact same engine could author ship parts/weapons later, but non-ship parts are explicitly out of scope for now.)*

### Working decisions — Direction (2026-11-27)

1. **Ships only:** Scoped strictly to ship hull authoring and fleet-scale inspection.
2. **Layered 2.5D object stack:** A ship contains multiple independent low-poly objects layered bottom-to-top (e.g. wings, main fuselage, dorsal spine, gunmetal frame, yellow equipment pods). Layer stack order sets overlap between objects; mean vertex `z` sorts triangles inside a single object.
3. **`Mirror X` toggle:** Most ships are bilaterally symmetric. Each object (or the active authoring session) has a **`Mirror X`** toggle across the bow-up centreline (`x_cad = 0`): vertices and triangles authored on one side mirror live across `x_cad = 0`, while lighting evaluates independently on the true port and starboard 3D normals. Asymmetric ships or off-axis pods simply turn `Mirror X` off on that object.
4. **Pure algorithmic shading (3D normal + `z` height bias):** Vertices live at `(x_cad, y_cad, z)` in ship units. Raising a spine ridge tilts port faces toward the upper-left light (bright) and starboard faces away from it (dark), while higher `z` adds a small elevation bias so high flat dorsal decks step lighter than low flat wings — **always quantized strictly into the 11 discrete colormap shades (`0..10`)**, with zero manual per-triangle overrides.
5. **Three 11-step `lch(...)` colormaps, strictly CAD-only:** `ship` (hull whites/cyan-slates), `weapon` (gunmetal blacks), and `equipment` (chartreuse yellows) are all **11-step perceptual LCH ramps** owned exclusively inside `packages/ship-cad`. They must **never** be exported into or contaminate `packages/mode-a`.
6. **Manufacturer cockpits — always on top, `add` / `remove` / `move(x, y)` only:** Place canonical **Aegis**, **Daehan**, or **LHI** cockpits above all hull objects at their exact production dimensions and orientation. No scaling, stretching, or rotation.
7. **Reference sketch underlay & local draft autosave:** v1 includes a calibrated PNG/JPG reference image underlay (opacity + scale slider) behind the unit grid for tracing sketches, and auto-saves the active working draft in `localStorage` across refreshes while `.svg` Export/Import remains the canonical save/load format.
8. **Self-contained `.svg` + Agent Integration `.md`:** The exported `.svg` holds both clean vector polygons/gradients and embedded `<metadata>` CAD data (acting as its own lossless save file and machine-readable source). A paired `.md` brief instructs an agent how to wire the ship into `packages/mode-a`; there is no programmatic runtime ship importer in the game.

---

## 2. Package & Isolation Boundary

Following `docs/specs/factory/monorepo/spec.md`:

```text
packages/ship-cad/            # "@void-drift/ship-cad" — CAD-only, never imported by game runtime
├── package.json              # Depends on zod, @void-drift/core, @void-drift/mode-a (read-only reference)
└── src/
    ├── index.ts
    └── lib/
        ├── schemas/          # Zod schemas: ShipCadDoc, LayerObject, Vertex3D, Triangle, CockpitPlacement
        ├── colormaps.ts      # CAD-only 11-step LCH colormaps: ship, weapon, equipment
        ├── lighting.ts       # Pure algorithmic 3D normal + z-bias -> discrete step 0..10
        ├── mesh.ts           # Standard vertex/edge/triangle ops, Mirror X, local z-sort, bounds
        ├── cockpits.ts       # Canonical Aegis, Daehan, LHI stamps Always-On-Top (Canvas + SVG defs)
        ├── svg-io.ts         # Lossless SVG serializer & parser (resolved fills + <metadata> JSON)
        └── agent-brief.ts    # Generates the markdown integration brief for an agent
```

- **Zero contamination of `mode-a`:** `packages/mode-a` never depends on `@void-drift/ship-cad`. When an agent integrates a ship into `mode-a`, polygon colors are written as self-contained CSS `lch(...)` strings read directly from the exported SVG.
- **Zero production bundle weight:** Only `/lab/ship-cad` in `apps/web` imports `@void-drift/ship-cad`.
- **Exact game parity in preview:** `ship-cad` reads `BUILD_FLIGHT_SCALE = 0.65`, fleet hull silhouettes (`WASP`, `SCOUT`, `FIGHTER`, `CRUISER`, `FIDDLER`), and `cockpit-material.ts` visual rules directly from `@void-drift/mode-a`.
