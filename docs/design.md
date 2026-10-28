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

## Application-wide button intent

Owner direction, 2026-10-28: game startup, pause/continue, setup, and mode-selection
screens represent game states. Their navigation buttons may be primary actions.
Player-facing data actions include saving ship designs, saving settings, reverting
edits, and resetting forms. Hierarchy follows the current goal, not the technical
category of navigation versus mutation. Links represent URL destinations; buttons
perform in-app state transitions and commands.

Game screens, player tools, settings, and Lab tooling share one button styling and
hierarchy. Context determines grouping and availability, not a separate Lab visual
language. Exact placement, appearance, and state treatments remain exploratory in
`/lab/studies/buttons`; revision 2 records this clarification. Shared styles have not
yet been changed to match the study.

Button-container direction (study revision 4): vertical groups place equal-width
buttons one below another on a transparent container, typically for game-state
screens. Horizontal action strips use a constant solid background and anchored
groups for supporting and main actions. Both use the existing shared button
appearance. Exact spacing, order, and narrow-strip adaptation remain under review;
these container patterns are demonstrated in the study, not yet integrated.

Spacing direction (study revision 6): each button container has equal outer padding
and minimum button gap, regardless of background transparency. The study maps
vertical and strip spacing to `--spacing-sm` (8px), after the owner found
16px vertical spacing too loose. Anchoring can add flexible space between groups without
reducing that minimum. Production integration remains pending.
