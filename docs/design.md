# Experience design

Read for visual, control, camera, or feedback changes. This document owns experience
principles; feature specs own exact behavior and acceptance scenarios.

## Intent

A minimal, high-contrast neon space game with readable motion, satisfying inertia,
and short challenging survival runs. Three ships should be understandable choices.
Players select a ship; developers tune flight in the Lab and promote accepted values
to versioned configuration. Feel and fidelity require human playtesting.

## Shared visual language

- Tokens: `packages/core/src/lib/styles/tokens.css`; shared classes in that styles
  directory; application-level styles in `apps/web/src/styles.css`.
- Use shared variables for UI colors, fonts, spacing, and sizes. Add a missing token
  deliberately, with a Lab example, rather than accumulating component literals.
- Procedural drawing lives in `packages/core/src/lib/assets/`; effects live in
  `packages/core/src/lib/effects/`. Avoid external image/audio assets unless necessary.
- Use native CSS and global classes for basic HTML elements; avoid trivial component
  wrappers for buttons and links. Larger interaction components remain appropriate.
- Consume the established design system during feature work. Changes to its definitions
  are explicit design work, documented and demonstrated in `/lab` in the same change.
- Canvas geometry and simulation values belong in their typed configuration, not CSS.

## Interaction and motion

- Laptop/desktop keyboard play is the primary development experience.
- Maintain landscape phone play with two simultaneous touch controls and targets of
  at least 44 CSS pixels. Handle touch release/cancellation and lost focus safely.
- Connect controls to real game input and give visible feedback for activation.
- Keep controls and instructions consistent. Do not add shooting or extra buttons
  without an agreed gameplay requirement.
- Favor responsive control, readable trails, and measured impact feedback over realism.
  Aim for 60 FPS; report the device and scenario used for performance measurements.

## Camera and arena

The owner's Star Control 2 reference includes both automatic framing/zoom and arena
edge wrapping. Develop these together using Lab trials. The alpha frames the ship and central star, snaps between five zoom levels in both directions,
and snaps after antipodal circular wrapping. Padding and response are tunable in the Lab.
Zoom jumps intentionally invite reorientation; world-space effects remain attached to the scene.

## Lab practice

The Lab is an experience-design surface, not just an asset gallery. Its trials should
use production systems and expose relevant parameters, reset/replay, and shareable
configuration. `/lab/flight` implements tuning, pause/step/reset, fixed replay, JSON import/export
and shareable URL configuration. Asset inspectors remain available in `/lab`.

Use fixed viewport, seed, and simulation time for visual evidence. Keep capture
environments explicit. Review visual baseline changes; never silently refresh images
to hide regressions. Show accepted design changes in the real game as well as the Lab.

## Exploratory studies

`/lab/studies` holds proposals and decision records, distinct from canonical Lab
examples and flight trials. Use `.agents/skills/design-study/SKILL.md` for this loop.
Study-local experiments do not establish shared design rules. See
[design studies](specs/design-studies.md) for acceptance and promotion boundaries.

## Application-wide buttons

The accepted study at `/lab/studies/buttons` records the rationale; `/lab/buttons`
is the canonical interactive reference. Shared definitions are in core
`styles/buttons.css`, with foundations in `styles/tokens.css`.

Game startup, pause/continue, setup, and mode-selection buttons navigate game states.
Player actions save designs/settings or reset data. Hierarchy follows the current
user goal, so navigation can be primary. Use links for URL navigation and buttons
for in-app state transitions or commands. Settings currently persist on change;
this promotion does not introduce a new save flow or a ship designer.

Use `.button-group.button-group--vertical` for transparent equal-width menu groups.
Use `.button-group.button-group--strip` for anchored groups on a solid void surface;
put related actions in `.button-group__section`. Strip hosts use
`.button-group-frame` for container queries. Both modes use 8px padding and minimum
gaps; strips stack below 580px of host width and retain the solid background.
Vertical groups have a private 320px maximum width. Preserve meaningful DOM/tab order.

Buttons retain angled corners, lime filled/ghost variants, and red consequences.
Shared states include an inset focus ring, disabled opacity with suppressed hover,
selected indication, and reduced-motion behavior. Busy buttons must be disabled by
the owning interaction; ARIA alone does not prevent activation. Link buttons retain
44px minimum targets. Native game engine touch controls remain specialized controls.

Public foundations express shared control/state/motion values; `--_name` properties
own component composition per architecture.md. Existing `--button-*` names remain
compatibility aliases. Do not reuse unrelated tokens merely because numbers match.

Implemented consumers: game start/pause/run-complete groups, flight Lab commands,
settings navigation, leaderboard action strip, canonical Lab, and study examples.
The audit retains original findings and explicitly records promotion decisions.

Retrospective evidence: the owner valued the situation-first explanation. Review
that lesson at the end of the factory loop before changing standing skill guidance.

## Fighter silhouette

The accepted 02.9 clipped-tip Lance is now the shared custom Fighter in the designer
and flight. Preserve its flat facets, black forward cockpit, stacked deck mounts,
tight aft pair, and rotated side mounts. `/lab/builder` demonstrates the production
renderer and test flight. The original Fighter-only selection restriction has
been superseded by the Heavy and Scout integrations below; saved builds and stock
profiles remain intact.
The ship-builder spec records geometry-derived turning and collision limitations;
human fidelity and handling review remains pending.


## Heavy cruiser silhouette

Long bevel 08 with the accepted forward-engine and bow-slot layout is implemented
for Heavy Corvette (`tank`). The shared `cruiser.ts` definition preserves the slim
faceted hull, two black forward cockpit panes, axial deck fittings and triangular
aft mounts. A small armored nose platform supports the bow fitting. `/lab/builder`
demonstrates the real renderer and flight systems. Fighter and Heavy Corvette are
selectable; Scout is also enabled by the integration below. The earlier
Fighter-only statement is superseded.
Owner approval established the direction despite reservations about visual polish;
human review of the delivered bow attachment and flight handling remains pending.

## Scout silhouette

The accepted 02.5 / 06 Integrated trident and 02.6 screenshot placement from
`/lab/studies/scout-firefly` are implemented for the custom Scout. Preserve its six
flat planes, swept knives, continuous pointed keel and black round light-bulb
cockpit with its thin collar. The forward side pair stays tightly packed at ±49°;
H and A remain axial. All three chassis are selectable, with version-1 saves intact.
`/lab/builder?chassis=scout` is the canonical shared renderer and playable test flight;
`/builder?chassis=scout` opens the same build in the app.

The Scout now uses the same mount-relative weapon graphics as Fighter/Heavy instead
of its legacy oversized barrels, keeping fittings clear of the cockpit. The accepted
side footprints overlap slightly; their centers and keyboard targets remain distinct.
Engines are surface/deck-mounted: the aft exhaust can overlay the pointed keel,
without cutting away accepted hull geometry. Human review of close-packed fittings,
plumes, circular collision and fast turning remains pending. Gravity, friction and
stock scored ships are unchanged.

## Builder slot language

Accepted study: /lab/studies/ship-slot-language. Slot overlays appear only in the
builder; flight shows the hull and equipped items. Shared compatibility distinguishes
Engine E, Weapon W, Equipment Q (weapons/utilities), and Universal +. Occupancy
determines inverse acid-lime/void-dark fill and border treatment, with linked
secondaries non-selectable and using the same border color for their connectors.
The ship-builder spec owns exact appearance and fitting rules; /lab/builder uses
the production renderer. The preserved study reference documents accepted intent.


## Ion effects — 0.4.1

The accepted Light/Heavy comparison in `/lab/studies/ion-engines-2026-10-31#sizes`
is promoted to the core ion beam painter. `/lab/ion-engines` compares the shared
renderer with a frozen approved reference; `/lab/builder` uses it in fitted flight.
Only `ion` and `heavy-ion` emit the new styles. Per-mark identity preserves mixed
loadouts and already-emitted residue. Fusion, plasma and untyped legacy exhaust
retain the generic painter.

Light keeps mint-cyan; Heavy has a cooler blue-cyan halo and residue, 1.4× beam
length and 1.45× width. Both keep the near-white core and transparent ends.
Complete marks overlap, inherit 80% ship velocity with 45 units/s backward drift,
and fade quadratically over 0.65 seconds. Rotation affects new emissions only.
Engine bodies, thrust, limits, mass, energy, controls, gravity and friction are
unchanged by this ion-effects integration. The accepted demo shares Light's
motion/output across both variants solely for visual comparison; real fitted
flight retains each engine's existing output behavior.

The ion Lab retains the accepted replay from rest with the Light build driving both
variants: fixed 60 Hz steps, four engine substeps, forward thrust, a one-sided turn
from 4–4.75 s, release at 5.25 s, and an end at 7 s. There is no random input or seed.
Each 480 × 330 canvas tracks the ship at (320, 165) with scale 2.4. Checkpoint buttons
reconstruct firing (tick 45), turning (270), release residue (330), and expired residue
(360). The browser test compares both variants against the preserved reference at
those moments. The reference retains its painter and replay code but consumes shared
physics, hull drawing and plume lifecycle; this is a painter-fidelity check, not an
independent baseline for changes to those shared systems or a human motion review.
