---

generated:
  by: "openai-codex/gpt-6.2-sol"
  at: "2026-11-24T13:22:52+02:00"
verified: []

---

# Ship mount planner

## Blueprint

### Context

The designer needs to arrange ship mounts visually and hand the exact decided
values to an agent for implementation. The copied document must identify the ship,
mounts, coordinate convention and original layout well enough that implementation
requires no measurement from screenshots or guessed transformations.

The planner moves and rotates existing mounts, supports mirrored editing, and
routes existing production-linked slot crossbars. Mount creation, deletion, type
changes, resizing, hull editing and flight tuning are outside its scope. The tool
is a Lab authoring surface, not a player editor.

Related contracts: [Hangar](../spec.md), [Ships](../../ships/spec.md),
[Motion instrument](../../../lab/motion-instrument/spec.md), [design system](../../../factory/design-system/spec.md).
Structure follows ASDLC's [Spec](https://asdlc.io/patterns/the-spec/) and
[Living Specs](https://asdlc.io/practices/living-specs/) guidance.

### Architecture

#### Production boundaries

- Route: `/lab/mount-planner`.
- Production starting layouts come from `buildMounts` in
  `packages/mode-a/src/lib/build-renderer.ts`. Its stable mount keys, groups,
  indices, types, dimensions and existing `linkedTo` relationships are retained.
- Chassis and preview loadouts use the contracts in
  `packages/mode-a/src/lib/schemas/loadout.ts`.
- Hulls, fittings, layering and mount transforms use the production renderer.
  Implementation must expose a shared geometry override where needed rather than
  copy a renderer into the Lab. The default production path stays unchanged.
- The strict Zod document schema lives at: `packages/mode-a/src/lib/mount-planner.ts`.
- Editing changes a local draft only. Copying a document does not change game
  definitions, player saves or deployed behavior. Persistence across sessions is
  provided by copying and loading documents.

#### Editing and preview

Select any production chassis and begin with its current layout. Select mounts
on the ship or by their labels. In the editable draft, pressing an unselected
mount with a mouse or by touch selects it immediately, visibly marks the selection,
and shows its details. That entire gesture is selection only, even if the pointer
travels far enough that it would otherwise be a drag.

Move a mount directly, without a separate Move mode, by starting a fresh gesture
on a mount already selected at the start of that gesture. Movement begins only
once pointer travel distinguishes a deliberate drag from a shaky click or tap.
Both selection-only gestures and gestures that stay below that threshold leave
layout geometry, the linked partner and undo/redo history unchanged.

Use a rotation control to rotate and keyboard-accessible numeric position and
angle fields for precise edits. Show the ship-local origin and axes, the selected
mount's identity and exact values, and its link partner when present. View zoom,
pan and rotation affect only the view. Numerical edits and direct manipulation
update the same draft. Any snapping is explicit and visible; display formatting
never changes values.

Preview empty mount footprints and compatible fitted parts using real game art.
Provide enlarged inspection and a flight-scale preview using production
`BUILD_FLIGHT_SCALE` (currently 0.65). Preview loadout choices do not alter the
mount layout. Compare the draft with the captured original using the same framing.
Overlapping or off-hull mounts remain editable and exportable: placement judgment
belongs to the designer, not an invented automatic hull constraint.

Undo and redo cover geometry and link edits; a completed drag that changes the
layout is one operation. Reset restores the captured original layout and links
and is itself undoable. Switching ships or loading another document must preserve
or explicitly resolve unsaved work before replacing it.

#### Required linked editing

Linking includes visible link state and selecting
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

#### Editing production slot crossbars

In Fitted and Empty, place a handle at the midpoint of each existing production
crossbar, the middle segment of the path from `buildSlotLinks` in
`packages/mode-a/src/lib/build-renderer.ts`. Identify it by the secondary mount
key, as in `CHASSIS[chassis].slotLinkLines`. Drawing, handle placement and framing
use the same resolved paths, with an override local to the planner preview.
Planner-created mirror pairs get no crossbar path or handle.

Pressing an unselected handle selects it immediately, visibly distinguishes it
and shows the pair identity and signed crossbar X in ship units. As with mounts,
the whole first gesture is selection only. Only a fresh mouse or touch gesture
on the already selected handle can move it, after the existing deliberate-drag
threshold. Compute displacement along ship-local X, not a fixed screen axis:
positive is forward, negative is aft. The two bends share that X; the legs
continue to meet the existing mount positions. The edit leaves all mount
geometry, mirror pairs and fittings unchanged.

The value is an absolute signed offset from the ship-local origin, not a delta
from the captured crossbar. The inspector lets a keyboard user select a crossbar
and commit its exact value. Dragging and committing a finite number both snap to
the nearest 0.5 ship unit, including integers (ties away from zero). The readout
shows the actual stored value. Selection, pointer jitter, dragging that ends at
the starting snapped value, and canceled drags leave geometry and history
unchanged once the gesture ends.

Completed changes participate in draft history: one changed drag or committed
field change is one undoable operation. Reset restores the captured routing along
with the rest of the original layout in one undoable operation. Original is
read-only and shows the captured crossbar positions; Draft retains the edits.
Automatic framing in Fitted and Empty includes both sets of paths and their
handles so Original and Draft use identical framing. Keep the transform fixed
during a drag and refit after a completed edit when automatic framing is active.
In-game and flight-scale previews show no crossbars, handles or selection
markings for them and offer no crossbar editing.

#### Copy and load contract

Copy layout produces one complete canonical v2 JSON document containing:

- `version: 2` and `kind: "ship-mount-plan"`.
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
  planner. `previewLoadout` is included separately to reproduce the fitted view.
- Two required maps, `baselineSlotLinkLines` (captured production) and
  `slotLinkLines` (resolved draft). Both are keyed by the secondary mount keys
  whose baseline mount has `linkedTo`, independent of `mirrorPairs` ordering.
  Both contain every such key and only those keys, even when all values are
  unchanged; ships without production links use `{}`. Values are finite JSON
  numbers on the exact origin-relative 0.5 grid, with no import rounding or
  tolerance. Fresh capture uses the authored catalog values exactly; a catalog
  value outside that grid is unsupported by the planner, not silently rounded.

JSON serialization preserves finite numeric values without export-only rounding.
Repeated export of an unchanged draft is deterministic. Loading an export restores
its geometry, links, crossbar routing and preview loadout; view framing and undo
history need not round-trip. Import validates strict version-specific shapes,
unique and complete mount keys, immutable metadata, finite coordinates/angles,
supported chassis, compatible preview loadout, valid links, mirrored geometry
and both crossbar maps. A documented floating-point tolerance may be used for
angle conversion and mirror comparisons, never crossbar values.

For valid v2 input, compare both captured baselines with current production,
including crossbar keys and exact numeric positions. Report affected mounts and
secondary crossbar keys explicitly, including additions and removals. A mismatch
marks the supplied document stale: preserve it for read-only inspection and
copying, with no silent rebase. Editing requires starting a fresh current layout.

Existing strict v1 documents are import-only. They carry no crossbar decisions
or crossbar baseline. If the mount baseline matches current production and its
crossbars can be captured, use the current authored positions for both v2 maps,
retain all v1 edits, and report that current routing was adopted, not recovered
or verified from the legacy document. Subsequent copies are v2. If the v1 mount
baseline is stale or current crossbars cannot be captured, keep the supplied v1
read-only and copyable as v1, with the reason shown; do not invent a baseline or
upgrade it. A v1 document carrying either new map is invalid.

Invalid input lists actionable field errors and leaves the current draft intact.
Clipboard failure presents the same complete document as selectable text and does
not report a successful copy.

#### Agent handoff

The copied document is the implementation artifact. Before applying approved
values, an agent checks both captured baselines against current production and
stops on drift for a fresh designer decision. For crossbar changes, map each
secondary key to its chassis catalog entry and use the resolved absolute X
verbatim. Verify that Hangar Plan renders and frames the same shared paths;
a crossbar-only handoff changes neither flight geometry nor fitting coupling.
For mount changes, map mount keys to their definitions and verify matching
geometry and rendering; changes shared with engine forces, nozzle positions or
hit targets must reach those consumers consistently. The tool does not assess
handling; human layout review and automated fidelity checks are separate.



#### Design-system alignment

The planner consumes shared `.btn` variants for commands and choices, `SegmentedControl`
for ship/view selection, and `RingSlider` for zoom and mount rotation. Inspector
fields follow the Lab numeric-field treatment. Canvas mounts use the production
builder slot palette and renderer, including empty/occupied states, linked marks
and selection brackets; no additional rectangular slot outlines are drawn.
Displays use the shared display surface and shadow tokens.

#### Preview modes and automatic framing

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

Preview part uses one labelled native dropdown containing only compatible parts
and Empty where permitted. It retains the current fitting and uses the inspector
field tokens, keeping the controls compact.

Range controls preserve the document’s exact values on initialization. Browser
step normalization is applied only after explicit user input; opening the planner
or selecting a mount must not quantize its angle.

#### Exhaust-direction guides

In Fitted and Empty views, every engine-compatible mount (engine and universal)
shows a dotted lime line from its rear edge toward exhaust, ending in a small
dotted arrowhead, using the same stroke pattern as the line. Direction is mount-local negative x rotated by the mount angle,
regardless of the installed part. Guides follow edits and view rotation and are
included in automatic framing. In-game and flight-scale previews omit them.

### Constraints

- Shared controls and visual tokens follow the [choice-control contract](../../../factory/design-system/choices/spec.md).
- Edits remain local drafts and exports preserve finite numeric precision.
- Production rendering and mount identities are shared with the game.
- The Lab supports viewports at least 1280px wide.

## Contract

### Definition of Done

- Every production chassis opens with mount geometry equal to `buildMounts` and
  original crossbars equal to its authored `slotLinkLines`.
- Mouse and touch distinguish selecting a mount from deliberately dragging an
  already-selected mount. Rotation controls, numeric edits and deliberate drags
  update preview and export.
- Required production links and designer-created mirror pairs obey reflection
  when either member is edited; invalid pairs are rejected.
- Midpoint selection, deliberate dragging and keyboard input edit only the
  selected production crossbar on its exact ship-local X grid.
- Undo, redo and reset restore mount geometry, link state and crossbar routing
  atomically.
- Production art previews empty and fitted mounts, enlarged and at flight scale.
- Original/draft comparison uses identical framing; view changes preserve values.
- Copy/load round-trips mount values, identities, links, crossbar positions and
  preview loadout.
- Strict schema validation rejects malformed documents without losing edits.
- Baseline mismatch identifies stale layouts without silently adopting them.
- Clipboard failure exposes a complete manual-copy fallback.
- A representative exported layout applied to production reproduces the
  planner's geometry, fitting placement, nozzle origins and hit targets.
- Manipulation, linked editing, readability and visual fidelity support screens at least 1280px wide; designer acceptance remains separate from automated checks.

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

Scenario: Select a mount with a click or tap
  Given an editable draft and an unselected mount in a linked pair
  When I click it with the mouse or tap it by touch
  Then the mount is visibly selected and its details are shown
  And the layout, linked partner and undo and redo history are unchanged

Scenario: Pointer travel during selection does not move a mount
  Given an editable draft and an unselected mount in a linked pair
  When I press that mount with a mouse or by touch
  Then the mount is visibly selected and its details are shown before release
  When I move far enough to start a drag on an already-selected mount and release
  Then neither mount moves during the gesture or on release
  And the layout and undo and redo history are unchanged

Scenario: Small pointer travel on the selected mount does not move it
  Given an editable draft with a member of a linked pair already selected
  When I press it with a mouse or by touch, move less than is needed to start
    a deliberate drag, and release
  Then the mount remains visibly selected with its details shown
  And the layout, linked partner and undo and redo history are unchanged

Scenario: Deliberately move either member of a linked pair
  Given an editable draft with one member of a linked pair already selected
  When I start a fresh mouse or touch gesture on that member and complete a
    deliberate drag, without entering a separate Move mode
  Then the selected member moves and its partner follows during the drag by
    reflection across the ship's x axis
  And one undo restores both mounts to their positions before the drag

Scenario: Add a planning link
  Given two independent mounts of matching type and dimensions
  When I link them with the first selected
  Then the second mirrors the first
  And their equipment choices remain independent
  And no production crossbar path or handle is added
  And unlinking preserves both positions

Scenario: Select a production crossbar without moving it
  Given an editable Fitted or Empty draft and an unselected production crossbar
  When I press its midpoint handle with mouse or touch and move before release
  Then it is visibly selected and its pair and exact signed X are shown on press
  And even deliberate travel in this gesture leaves layout and history unchanged
  When I press the selected handle again but move less than the drag threshold
  Then its position and history are still unchanged

Scenario: Route a crossbar along ship-local X
  Given a selected crossbar at X = -40 and a rotated, zoomed view
  When a fresh deliberate drag travels 1.3 ship units forward and also sideways
  Then the crossbar is at X = -38.5 with both bends at that X
  And the mounts, fittings and links are unchanged
  And undo restores X = -40 in one step and redo restores X = -38.5
  And the production catalog has not changed

Scenario: Edit a crossbar from the keyboard and compare the original
  Given an editable draft with a production crossbar at its original X = -40
  When I select it and enter and commit -38 using only the keyboard
  Then the readout and draft store -38 exactly
  When I commit -37.8
  Then the readout and draft still show -38 without adding a history step
  When I switch to Original
  Then I see the original route at X = -40 in the same framing as Draft
  And Original cannot be edited
  When I switch back to Draft and reset
  Then I see the captured route again and one undo restores X = -38

Scenario: Frame schematic routes only in marked views
  Given automatic framing and a selected production crossbar in Fitted or Empty
  When I drag the crossbar beyond the hull
  Then the camera remains fixed until the drag ends
  When I release
  Then the production route and midpoint handle fit inside the framed view
  When I inspect In-game or the flight-scale preview
  Then neither the crossbar nor its handle or selection marking is drawn

Scenario: Round-trip a crossbar draft and reject off-grid data
  Given a draft with a crossbar at X = -38.5 and a captured X = -40
  When I copy and load the v2 document
  Then Draft restores -38.5 and Original restores -40
  When I change either map's value to -38.25 and load it
  Then the offending field is reported without snapping or replacing the draft

Scenario: Reject crossbar maps that do not match the captured production pairs
  Given a v2 document with one production pair and one planner-created pair
  When I load it with the production secondary key missing from either map
    or a planner-created pair key added to either map
  Then the offending map and key are reported and my current draft is unchanged

Scenario: Load a legacy document that did not author crossbars
  Given a strict v1 document with a current mount baseline and edited mounts
  When I load it against a catalog with on-grid crossbars
  Then the existing mount edits are restored
  And the notice says both maps adopt current production routing
  And the next copy is v2

Scenario: Preserve a stale legacy document without upgrading it
  Given a strict v1 document with a mount baseline that differs from production
  When I load it
  Then the supplied v1 remains copyable and read-only without a routing baseline

Scenario: Apply an approved crossbar-only handoff
  Given an approved v2 draft whose two captured baselines still match production
  When the agent applies the resolved crossbar X at the named secondary key
  Then the Hangar Plan draws and frames the same route as the draft
  And flight geometry and fitting coupling are unchanged

Scenario: Detect routing drift without mount drift
  Given a v2 document whose mount baseline still matches production
  But one authored crossbar X has since changed in the catalog
  When I load it or check the copied document for handoff
  Then the affected secondary key identifies the mismatch
  And loading preserves the supplied routes for read-only inspection and copying
  And handoff stops rather than applying the decided X to a drifted baseline

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
