# Ship mount planner

Status: live local prototype, 2026-11-03. Human experience review and full
production handoff verification remain pending.

## Context

The designer needs to arrange ship mounts visually and hand the exact decided
values to an agent for implementation. The copied document must identify the ship,
mounts, coordinate convention and original layout well enough that implementation
requires no measurement from screenshots or guessed transformations.

Version one moves and rotates existing mounts. Linked, mirrored editing is required.
Mount creation, deletion, type changes, resizing, hull editing and flight tuning
are outside this version. The tool is a Lab authoring surface, not a player editor.

Related contracts: [ship builder](ship-builder.md),
[Lab instrument](lab-instrument.md), [design system](design-system-core.md).
Structure follows ASDLC's [Spec](https://asdlc.io/patterns/the-spec/) and
[Living Specs](https://asdlc.io/practices/living-specs/) guidance.

## Architecture

### Production boundaries

- Route: `/lab/mount-planner`.
- Production starting layouts come from `buildMounts` in
  `packages/mode-a/src/lib/build-renderer.ts`. Its stable mount keys, groups,
  indices, types, dimensions and existing `linkedTo` relationships are retained.
- Chassis and preview loadouts use the contracts in
  `packages/mode-a/src/lib/schemas/loadout.ts`.
- Hulls, fittings, layering and mount transforms use the production renderer.
  Implementation must expose a shared geometry override where needed rather than
  copy a renderer into the Lab. The default production path stays unchanged.
- Define and test a strict Zod document schema before implementing the editor;
  implemented location: `packages/mode-a/src/lib/mount-planner.ts`.
- Editing changes a local draft only. Copying a document does not change game
  definitions, player saves or deployed behavior. Persistence across sessions is
  provided by copying and loading documents; server storage is outside v1.

### Editing and preview

Select any production chassis and begin with its current layout. Select mounts
on the ship or by their labels. Drag to move, use a rotation control to rotate,
and provide numeric position and angle fields for precise editing. Pointer and
touch interaction and keyboard-accessible numeric controls are required.

Show the ship-local origin and axes, the selected mount's identity and exact
values, and its link partner when present. View zoom, pan and rotation affect
only the view. Numerical edits and direct manipulation update the same draft.
Any snapping is explicit and visible; display formatting never changes values.

Preview empty mount footprints and compatible fitted parts using real game art.
Provide enlarged inspection and a flight-scale preview using production
`BUILD_FLIGHT_SCALE` (currently 0.65). Preview loadout choices do not alter the
mount layout. Compare the draft with the captured original using the same framing.
Overlapping or off-hull mounts remain editable and exportable: placement judgment
belongs to the designer, not an invented automatic hull constraint.

Undo and redo cover geometry and link edits; one drag is one operation. Reset
restores the captured original layout and links and is itself undoable. Switching
ships or loading another document must preserve or explicitly resolve unsaved
work before replacing it.

### Required linked editing

Linking is a first-class v1 feature, including visible link state and selecting
either member to edit the pair. Mirror reflection is across the ship's longitudinal
x axis: `(x, y, angle) -> (x, -y, -angle)`.

Production-linked mounts begin linked and remain linked. The designer can also
link two otherwise independent mounts of the same type and dimensions, or unlink
such a planner-created pair. A mount belongs to at most one pair; self-links and
cycles are invalid. Linking uses the currently selected mount as the source and
mirrors its geometry onto the partner as one undoable edit. Unlinking retains the
current geometry. A single centerline mount can remain unlinked.

Moving or rotating either member immediately updates its partner, including
numeric edits, undo, redo and reset. Exports contain explicit resolved geometry
for both members as well as their relationship. Production `linkedTo` also
expresses fitting coupling; planner-created geometry links do not silently change
which parts a player may equip independently.

### Copy and load contract

Copy layout produces one complete, versioned JSON document containing:

- `version: 1` and a fixed document kind identifying the mount planner.
- Production chassis ID, not merely its display name.
- Coordinate convention: production ship-local origin and units, +x forward,
  +y to the ship's right, and radians with the production Canvas rotation sign.
  The UI may show degrees with explicit units; conversion happens at the boundary.
- `baseline`: the full original mount geometry and identity metadata, including
  production links. This snapshot makes geometry changes detectable without
  depending on a human-readable label or a repository revision alone.
- `mounts`: every mount's stable key, group, index, type, width, height, x, y and
  angle, including unchanged mounts. Identity metadata and dimensions are read-only.
- `mirrorPairs`: explicit pairs and whether they originate in production or the
  planner. Preview loadout is included separately to reproduce the fitted view.

JSON serialization preserves finite numeric values without export-only rounding.
Repeated export of an unchanged draft is deterministic. Loading an export restores
its geometry, links and preview loadout; view framing and undo history need not
round-trip. Import validates unique and complete mount keys, immutable metadata,
finite coordinates/angles, supported version and chassis, compatible preview
loadout, valid links and mirrored geometry. A documented floating-point tolerance
may be used for angle conversion and mirror comparisons, never visual estimation.

Compare the captured baseline against current production on load. A mismatch is
shown explicitly with the affected mounts. Preserve the supplied document for
inspection and copying; mark it stale and keep editing disabled until the designer
starts a fresh current layout. V1 does not silently rebase old decisions.

Invalid input lists actionable field errors and leaves the current draft intact.
Clipboard failure presents the same complete document as selectable text and does
not report a successful copy.

### Agent handoff

The copied document is the implementation artifact. An agent checks the baseline,
maps mount keys to current production definitions, applies the resolved geometry,
and verifies that production rendering and geometry match the document. Changes
to geometry shared with engine forces, nozzle positions or hit targets must reach
those consumers consistently. The tool itself does not promise flight simulation
or assess handling; human layout review and automated fidelity checks are separate.

## Contract

### Definition of Done

- [ ] Every production chassis opens with geometry equal to `buildMounts`.
- [ ] Dragging, rotation controls and numeric edits update preview and export.
- [ ] Required production links and designer-created mirror pairs obey reflection
  when either member is edited; invalid pairs are rejected.
- [ ] Undo, redo and reset restore geometry and link state atomically.
- [ ] Production art previews empty and fitted mounts, enlarged and at flight scale.
- [ ] Original/draft comparison uses identical framing; view changes preserve values.
- [ ] Copy/load round-trips all mount values, identities, links and preview loadout.
- [ ] Strict schema validation rejects malformed documents without losing edits.
- [ ] Baseline mismatch identifies stale layouts without silently adopting them.
- [ ] Clipboard failure exposes a complete manual-copy fallback.
- [ ] A representative exported layout applied to production reproduces the
  planner's geometry, fitting placement, nozzle origins and hit targets.
- [ ] Owner reviews manipulation, linked editing, readability and visual fidelity
  on desktop and landscape touch. Record this separately from automated results.

### Regression guardrails

- Production geometry and player loadouts remain unchanged by planner interaction.
- Ship-local values are independent of viewport size, zoom, pan and preview angle.
- Mount identities and existing fitting coupling survive editing and handoff.
- Planner and game share rendering and geometric transforms.
- Exported precision is sufficient to reproduce the approved layout; no screenshot
  measurement is part of the implementation contract.

### Scenarios

```gherkin
Scenario: Exact linked handoff
  Given a linked pair of mounts
  When I set one mount to x = -12, y = -15 and angle = 0.5 radians
  Then its partner is x = -12, y = 15 and angle = -0.5 radians
  And copying and loading preserves both geometries and their link

Scenario: Edit the other member
  Given a linked pair
  When I drag either member
  Then the other member follows by reflection across the ship's x axis
  And one undo restores both mounts

Scenario: Add a planning link
  Given two independent mounts of matching type and dimensions
  When I link them with the first selected
  Then the second mirrors the first
  And their equipment choices remain independent
  And unlinking preserves both positions

Scenario: Change the view
  Given a decided layout
  When I zoom, pan or rotate the preview
  Then the exported mount values are unchanged

Scenario: Invalid pasted document
  Given an edited draft
  When I load a document with duplicate mount keys or an invalid mirror pair
  Then I see the offending fields
  And my edited draft remains intact

Scenario: Production has moved on
  Given a saved document whose baseline differs from current production
  When I load it
  Then the tool identifies the mismatch and marks the document stale
  And the supplied values remain available to inspect and copy
  And editing requires a fresh current layout
```

## Prototype evidence — 2026-11-03

The Lab route implements geometry editing, required production mirror links,
additional designer pairs, production-renderer previews, undo/redo/reset and JSON
copy/load. Ship switches and document loads retain the previous draft in Undo.
Angles are shown directly in radians. Empty-background dragging pans the view;
rotation and zoom are view controls. Mount types and dimensions remain fixed.

The document schema and geometry helpers live in
`packages/mode-a/src/lib/mount-planner.ts`, with unit coverage beside them.
Browser coverage lives in `tests/browser/mount-planner.spec.ts`. The renderer
accepts optional mount geometry; its default production behavior is unchanged.
Mirrored comparisons use an absolute tolerance of 1e-10.

This prototype has not applied an exported design to production flight geometry;
nozzle/force integration handoff and owner experience review remain unchecked.

### Design-system alignment — 2026-11-03

The planner consumes shared `.btn` variants for commands and choices, `Toggle`
for ship/view selection, and `RingSlider` for zoom and mount rotation. Inspector
fields follow the Lab numeric-field treatment. Canvas mounts use the production
builder slot palette and renderer, including empty/occupied states, linked marks
and selection brackets; no additional rectangular slot outlines are drawn.
Displays use the shared display surface and shadow tokens.

### Preview modes and automatic framing — 2026-11-03

The contents chooser has three modes: Fitted shows installed parts with builder
slot markings; In-game uses production flight drawing without slot markings;
Empty shows empty builder slots. These are view choices and preserve the exported
layout and preview loadout. Flight-scale inspection remains available separately.

The main view initially fits the hull, fittings, slot labels, selection brackets
and link guides to the available canvas, with padding. It refits after resize,
ship or preview changes and completed mount edits. During dragging the transform
stays fixed. Manual pan or zoom leaves automatic framing; Fit ship restores it.
Framing uses conservative fitting/label bounds, so decorative art has breathing
room. Camera changes never alter ship-local mount values.
