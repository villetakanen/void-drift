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
edge wrapping. Develop these together using Lab trials. The alpha frames the ship and central star, zooms out immediately, smooths zoom-in,
and snaps after antipodal circular wrapping. Padding and response are tunable in the Lab.
Keep spatial relationships legible and avoid disorienting traversal across the arena.

## Lab practice

The Lab is an experience-design surface, not just an asset gallery. Its trials should
use production systems and expose relevant parameters, reset/replay, and shareable
configuration. `/lab/flight` implements tuning, pause/step/reset, fixed replay, JSON import/export
and shareable URL configuration. Asset inspectors remain available in `/lab`.

Use fixed viewport, seed, and simulation time for visual evidence. Keep capture
environments explicit. Review visual baseline changes; never silently refresh images
to hide regressions. Show accepted design changes in the real game as well as the Lab.
