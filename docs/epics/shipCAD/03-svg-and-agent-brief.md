# 03 — Workspace, Self-Contained SVG & Agent Brief

Draft part of the [ShipCAD epic](README.md), 2026-11-27.

---

## 1. `/lab/ship-cad` Sub-App Layout & Controls

Targeting `>= 1280px` desktop viewports using Void Drift's shared Lab tokens, surfaces, and controls:

### Left rail — Layers & Cockpits

- **Ship metadata & underlay**: Working name & slug (e.g. `manta`), grid snap selector (`1.0` / `0.5` units), fleet silhouette reference toggle, and **PNG/JPG sketch tracing underlay** behind the grid with **opacity** and **scale** sliders.
- **Cockpit list (Always on Top)**:
  - Buttons to **Add** `Aegis`, `Daehan`, or `LHI` cockpit.
  - Each added cockpit shows only `(x, y)` position fields (with `Center X` quick button) and **Remove**. Cockpits always render above all hull objects at exact production scale and orientation.
- **Object stack (ordered top-to-bottom)**:
  - Add, delete, duplicate, rename, hide/lock, and drag/step to reorder objects.
  - Per-object **Colormap** selector (`ship`, `weapon`, `equipment`).
  - Per-object **`Mirror X`** switch (default **On**, toggleable per object so asymmetric pods can coexist with a mirrored hull).

### Center stage — 2.5D Mesh Viewport

- Bow-up unit grid with emphasised `x = 0` mirror axis and `y = 0` origin crosshair.
- **Standard mesh interaction**:
  - **Select / Move**: Click or marquee-select vertices (or a cockpit); drag in `(x, y)` snapped to grid; `Delete` removes selected vertices/triangles.
  - **Draw / Extrude**: Click 3 vertices (existing or newly placed) to form a triangle; drag from an existing triangle edge to extrude a new connected triangle; click an edge midpoint handle to split two adjacent triangles cleanly without T-junction seams.
  - **`z` height control**: When one or more vertices (e.g. a centreline spine chain) are selected, scrub or step `z` via slider / keyboard (`[` / `]` or Up/Down). Connected port and starboard faces immediately step through the active 11-shade LCH colormap.
  - **Display modes**: Lit preview (default), Lit + wireframe + vertex `z` badges, Wireframe only, Silhouette check.

### Right rail — Live Game & Fleet Preview

- **`0.65×` Flight-scale preview** (`BUILD_FLIGHT_SCALE`) on dark void backdrop — permanent check that small details still read under 30–60 px.
- **`1.0×` Native & Enlarged Hangar preview**.
- **Fleet comparison strip**: Current ship drawn at matching scale beside Wasp, Scout, Fighter, Corvette, and Fiddler.
- **Readouts & Actions**:
  - Dimensions in game units: `nose` (`+x`), `stern` (`-x`), `fullLength`, `width`, `inertiaPerMass`, total rendered triangles.
  - **Draft persistence & I/O**: Working state auto-saves to `localStorage` so page reloads never lose progress; **Import `.svg`**, **Export `.svg`**, and **Export Integration `.md`** (download or copy) handle canonical file save/load and handoff.

---

## 2. Self-Contained SVG Format (`<ship>.svg`)

A single `.svg` file is simultaneously:
1. A clean, standard vector illustration (viewable anywhere, zero strokes on hull planes, native SVG cockpit gradients).
2. ShipCAD's lossless editable project file.
3. The complete machine-readable geometry source for an agent.

```xml
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="-30 -55 60 110"
  data-ship-cad-version="1"
  data-ship-id="manta"
>
  <title>Manta — ShipCAD master</title>
  <metadata id="ship-cad-data" type="application/vnd.void-drift.ship-cad+json"><![CDATA[
    {
      "version": 1,
      "id": "manta",
      "name": "Manta",
      "coordinates": {
        "cad": "bow-up: +x right, +y aft, +z up; ship units",
        "game": "ship-local: +x forward (-cad.y), +y right (+cad.x); ship units"
      },
      "objects": [
        {
          "id": "wings",
          "name": "Wings",
          "colormap": "weapon",
          "mirrorX": true,
          "vertices": [
            { "id": "v1", "x": 0, "y": -12, "z": 2 },
            { "id": "v2", "x": -24, "y": 14, "z": 0 },
            { "id": "v3", "x": 0, "y": 18, "z": 1 }
          ],
          "triangles": [["v1", "v2", "v3"]]
        }
      ],
      "cockpits": [
        { "id": "c1", "kind": "lhi", "cadX": 0, "cadY": -8, "gameX": 8, "gameY": 0 }
      ],
      "derivedGameGeometry": {
        "nose": 42,
        "stern": -26,
        "fullLength": 68,
        "width": 48,
        "inertiaPerMass": 593.33
      }
    }
  ]]></metadata>

  <defs>
    <!-- Native SVG linearGradients, radialGradients & clipPaths for placed cockpits -->
  </defs>

  <!-- Bottom-to-top layered objects; mirrored & z-sorted triangles in draw order -->
  <g id="obj-wings" data-object="wings" data-colormap="weapon">
    <polygon points="0,-12 -24,14 0,18" fill="lch(33.0% 5.0 260.1)" />
    <polygon points="0,-12 0,18 24,14" fill="lch(18.5% 4.5 258.9)" />
  </g>

  <!-- Cockpits always on top -->
  <g id="cockpit-c1" data-cockpit="lhi" transform="translate(0 -8)">
    <!-- Canonical LHI two-pane glass + #bba14e perimeter -->
  </g>
</svg>
```

---

## 3. Agent Integration Brief (`<ship>-integration.md`)

Because ships are added or updated in Void Drift by an agent editing TypeScript (never loaded dynamically at runtime), ShipCAD generates a ready-to-hand-off markdown brief paired with the `.svg`:

1. **Summary & Hull Figures**:
   - Ship ID & display name placeholders, `nose` (`length`), `stern`, `fullLength`, `width`, `inertiaPerMass`, and total facet count.
2. **Resolved `+x` Forward Facets & Cockpits**:
   - Pre-converted `facets: readonly { points: readonly [number, number][]; color: string }[]` in exact bottom-to-top draw order, with `lch(...)` fills baked in so `packages/mode-a` has zero dependency on `packages/ship-cad`.
   - Cockpit descriptor(s): `{ kind: "aegis" | "daehan" | "lhi", x: gameX, y: gameY }` plus fallback `#000000` silhouette polygons when `cockpitMaterial = false`.
3. **File-by-File Integration Instructions for `packages/mode-a`**:
   - **Master SVG**: Store `<ship>.svg` under `packages/mode-a/src/lib/art/ships/<ship>.svg` (if keeping masters in-repo alongside engines/weapons).
   - **Hull module**: Create or update `packages/mode-a/src/lib/<ship>.ts` exporting the resolved `facets`, cockpit offset(s), bounds, and `inertiaPerMass`.
   - **Cockpit rendering**: Ensure `packages/mode-a/src/lib/cockpit-material.ts` draws `aegis` / `daehan` / `lhi` at the specified `(gameX, gameY)` offset (preserving all existing ships verbatim).
   - **Renderer & Catalog** (when registering a playable hull rather than enemy-only art):
     - `packages/mode-a/src/lib/build-renderer.ts` (`drawBuild`, initial `buildMounts` placeholders).
     - `packages/mode-a/src/lib/stabilizers.ts` (stabilizer placement).
     - `packages/mode-a/src/lib/schemas/ship-profile.ts`, `config.ts`, and `schemas/loadout.ts` (`CHASSIS`, `LoadoutSchema`, `defaultLoadout`).
   - **Human decisions explicitly flagged (never guessed by the tool)**:
     - `mass`, `baseSpeed`, `releaseClass` (`"preview"` vs `"scored"`), slot counts/types, stabilizer mode, and follow-up slot tuning in `/lab/mount-planner`.
