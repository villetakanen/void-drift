# Ship parts: art, placement and the utility artwork page

Open planning document, started 24 November 2026. It maps what we need to touch
and discuss around ship part artwork and how the game draws parts on ships. It
is a map of the territory and settles nothing unless a point is marked agreed
with a date.

## Where this started

`/lab/utility-artwork` (`apps/web/src/pages/lab/utility-artwork.astro`) is a
legacy page that still exists for a reason, but it mixes three jobs:

- **Part art.** The utility gallery (storage, solar, gravity and repair art at
  enlarged and mounted scale) and the Light Ion Cannon fitting.
- **Game behaviour.** The Ion Cannon and Ion Point Defence encounters, running
  the production simulation.
- **How the game draws a part across ships.** The Gravity coil and Potential
  Well fleet comparisons: every hull, at enlarged, native and flight scale.

It also carries loose ends:

- It uses `StudyLayout` with a study phase and status, while
  `apps/web/src/data/lab-pages.ts` registers it as a production Lab page.
- It imports two study components, `components/studies/IonCannonFitting.svelte`
  and `components/studies/PotentialWellSizing.astro`, which their studies
  also use.
- The [Ion Point Defence](../specs/game/ion-point-defence/spec.md) and
  [Light Ion Cannon](../specs/game/light-ion-cannon/spec.md) specs name this
  page as the "equipment Lab" that hosts their encounters.
- Three studies link to it: gravity-coil-form, resource-capacity and
  energy-support.

## Working direction

The direction the conversation is leaning, still to be written into specs:

- **Design system: a part's art.** Each part's master, derived faces, poses
  and Hangar card on a family page under `/lab/ds/`.
- **Lab: how the game draws and places parts on ships.** Design tools to
  author placement, and tools to inspect the result across hulls, slots and
  scales.
- The individual art pieces belong in the design system.

## First deliverable: a part placement design tool

A Lab design tool, a sibling to the [Mount planner](../specs/game/hangar/mount-planner/spec.md).
The Mount planner moves slots on a ship. This tool moves a part inside a slot.

What it should let a designer do:

- Pick a hull, a slot and a part, for example the Fighter's left forward slot
  with a given engine or weapon.
- View the part on top of the hull or beneath it.
- Move the part along its slot and see where it sits relative to the slot's
  footprint.
- Choose what the placement is measured from. Some parts should sit from the
  slot's centre, some from its end, and some reach forward of the slot.
- Compare the result at enlarged, native and flight scale, using the
  production renderer.
- Hand the chosen values to an agent, the way the Mount planner copies a
  document.

What exists today:

- A part's placement is a single number: `mount` in `PartSchema`
  (`packages/mode-a/src/lib/schemas/loadout.ts`), in part units along the
  slot's axis, +x forward. It applies on every hull.
- Hulls can add their own adjustment. The Scout aligns each side engine's front
  with its hull edge in `engineOffset` (`packages/mode-a/src/lib/build-renderer.ts`).
- Whether a part is drawn above or beneath the hull is set per mount and
  hull: `underHull` on a mount, with per-chassis defaults in the renderer's
  `below` rule. A part cannot choose it today.
- The Mount planner already draws real fittings through a shared geometry
  override and copies a strict JSON document. Its preview, framing and handoff
  habits are the natural starting point.

To discuss before speccing:

- **Reference points.** Is placement one offset from a fixed origin, or a pair
  of anchors: a point on the slot (aft end, centre, fore end) and a point on the
  part (its own origin, nozzle, front)? The second matches "this part starts
  from the end of the slot", but it changes `PartSchema` and every consumer of
  `mount`.
- **Above or beneath.** Is it a preview toggle, a per-part property, a per-slot
  property as today, or a part default that a slot can override?
- **Per hull or per part.** How do the Scout's hull-specific adjustment and any
  future ones show in the tool, and can a designer author them there?
- **Consumers.** Placement feeds the nozzle and plume start, weapon muzzles,
  collision envelopes and the Hangar card's own frame. The tool's handoff must
  name which of these a change reaches.
- **Home.** A separate Design tool, or a mode of the Mount planner.

Specs it would touch: a new tool spec under `docs/specs/lab/` or beside the
Mount planner under `docs/specs/game/hangar/`; [Parts](../specs/game/parts/spec.md)
for the mount point rule; [Ships](../specs/game/ships/spec.md) if layering
moves from slots to parts.

## Later: the rest of the territory

### Design system part pages

- The [ship part artwork spec](../specs/factory/design-system/artwork/spec.md)
  defines family pages for engines and weapons. Support parts have no page.
- `/lab/ds/weapons` shows only the Plasma rifle. The Parts spec says every
  part's art has a design-system page, so the weapon page would list the whole
  catalog and name the parts without a master.
- Open: whether family pages list the full catalog, and what a page shows for a
  part that has no master yet.

### Concept art in the game package

- `UTILITY_ART` in `packages/mode-a/src/lib/utility-art.ts` holds storage,
  solar, gravity and repair art. Only the gravity art is drawn in play, from
  `build-renderer.ts`. Solar and repair are not catalog parts.
- Open: keep them as concept art in the design system, or retire them. Also
  unchecked: which art the catalog's Loading coil (`coil`) draws.

### A Lab tool for inspecting parts across ships

- Pick any catalog part and see it as the game draws it on every hull and every
  slot that accepts it, at enlarged, native and flight scale; engines with their
  plume at full output; weapons firing in an encounter.
- Built from the catalog, so a new part appears without a per-part component.
  The fleet comparisons and both encounters on the utility artwork page would
  become views of it.
- Open: whether this is one tool with the placement designer, or a separate
  inspection tool. Which spec hosts the weapon encounters.

### Retiring the utility artwork page

- Once its sections have homes, the page goes. Open: redirect
  `/lab/utility-artwork` to its successor, since frozen studies link to it.
- The two study components stay with their studies, or the studies are
  captured as images once nothing else uses them.
- The Ion Point Defence and Light Ion Cannon specs change their encounter host
  in the same change.
