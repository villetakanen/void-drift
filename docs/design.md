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
renderer and test flight. Scout/Corvette designer selection is disabled pending
resolved designs; their saved builds and stock profiles remain available internally.
The ship-builder spec records geometry-derived turning and collision limitations;
human fidelity and handling review remains pending.
