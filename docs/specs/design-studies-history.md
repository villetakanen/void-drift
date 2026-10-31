# Historical design-study records

Archived on 29 October 2026 from the reusable specification. These are historical
accounts, including stale descriptions and rejected proposals, not current contracts.
Consult for factory diagnosis or specific research, not as mandatory new-cycle input.
Current adopted product guidance lives in docs/design.md and relevant feature specs.

## Pilot limits

The button study uses local fixtures for replay and saving; it neither runs simulation
nor persists blueprints. Its native confirmation dialog supports Escape and focus return.
No button proposal is yet a production design rule. The first real discussion and
promotion will validate the remaining workflow; no automated orchestration service exists.

## Button pilot revision 2

The owner clarified two application purposes: game-state navigation and actions on
application data, including saving player ship designs/settings and resetting forms.
Lab tooling inherits the same styling and hierarchy. The lead interactive example
now demonstrates startup, play, pause/continue, setup, and mode-two navigation as
local fixtures. Exact visual design remains exploratory; this direction is recorded
in docs/design.md, not treated as acceptance of the prototype appearance.

## Button pilot revision 3

Owner feedback: retain the situation-first explanation and revisit its value at the
end-of-loop retrospective. This is a recorded lesson candidate, not a new rule.
The examples now consume core styles/buttons.css and its filled, ghost, and danger
classes, preserving existing angled corners and colors. Study-local CSS handles
composition and provisional disabled/selected/focus states; production styles are
unchanged. Layout alternatives remain under review.

## Button pilot revision 4

Replace the equal-width strip comparison with two explicit container patterns:
transparent vertical groups with equal-width buttons, and solid-background action
strips retaining anchored groups. The study selector applies either pattern to the
same examples. Narrow strips stack groups deliberately and preserve their solid
background; this responsive behavior is a proposal awaiting review.

## Button pilot revision 5

Button containers retain padding even when transparent. Padding on all four sides
matches the button gap: normal vertical spacing is 16px and minimal action-strip
spacing is 8px, using existing tokens. Anchored groups can have additional flexible
space. Box sizing keeps this padding within the container width on narrow panels.

## Button pilot revision 6

Owner review found 16px vertical spacing too loose. Vertical padding and button gaps
now both use `--spacing-sm` (8px), matching the unchanged strip minimum. This
supersedes revision 5’s vertical value while preserving equal padding and gaps.

## Button pilot revision 7 — token audit

Owner endorsed the current baseline and requested token traceability before promotion.
The study includes an inventory in ButtonTokenAudit.astro covering button geometry,
variants, states, both layout containers, and surrounding example surfaces. It lists
authored values, token chains, literal overrides, and proposed system-level tokens.
Component-only and flight-domain tokens are distinguished from reusable foundations.
Structural CSS and fixture dimensions are identified separately. Research-page framing
is explicitly outside the button-pattern inventory. No proposed token is implemented
or accepted by this audit. Update the inventory alongside subsequent style changes.

## Button pilot revision 8 — private composition

Architecture now distinguishes public design contracts from component-private
`--_name` properties. The audit revises candidates: local spacing/radius aliases,
button cut geometry, width constraints, and transition composition can be private;
shared palette, spacing, typography, focus, accessibility, and motion remain public
concerns. The study renames its own spacing alias to `--_group-spacing`. Production
`--button-*` migration remains proposed, pending consumer review. No visual change.

## Promotion completed

Core buttons.css supplies both 8px container patterns and shared states. tokens.css
defines control/state/motion foundations, while --_ properties own composition.
Compatibility --button-* aliases remain. The study consumes production patterns
and retains its original audit with a promotion record. /lab/buttons demonstrates
both patterns, hierarchy, state transitions, and token ownership. Application menus,
flight Lab, leaderboard, and settings navigation use those definitions. Specialized
engine touch controls retain their gameplay-specific presentation.

Browser coverage checks equal vertical widths, token-driven padding/gaps, narrow-strip
stacking, focus and keyboard activation, disabled/busy states, and reduced motion.
The prior 120px/172px study minimum widths were dropped in favor of content sizing.
No persistence contracts or simulation constants changed.

## Planetary bodies study — 2026-10-29

Exploratory at `/lab/studies/planetary-bodies`. Owner requested meaning and reasons
before the experience of size and speed. Owner clarified that moons are the same
kind of gravitational body as planets, with an orbit around a planet. No distinct
moon hazard role is implied. The current game’s named Moon orbits the star.

The first study records recognition, route choice and close passage as hypotheses,
then compares current bodies with three intended experiences: spacious/slow,
substantial route-shaping bodies, and a restless system. Fixed paired viewports,
synchronised time, a ship scale reference, orbit guides and a planet-relative view
isolate perceived scale and motion. Paused initial state, native keyboard controls,
reset, timeline and ten-second advances support repeatable observation. Narrow
layouts stack equal-scale panels. These are observation fixtures, not flight trials.

Production `drawPlanet`, `drawShip`, current configuration and the extracted
`updatePlanetOrbit` equation are reused. Parenting is study-only; gravity, collisions,
resources and production camera are not simulated. No runtime body settings change.
Presets are proposed values; no direction is accepted. Human review of meaning and
motion remains open, followed by real flight review before any promotion.

## Planetary bodies fresh framing — 2026-10-29

The owner's fresh brief establishes spectacle, slingshot speed beyond ordinary flight,
and collision obstacles as purposes. Planets orbit the sun and moons orbit planets;
they share a gameplay model, without a moon-of-moon tier at the intended scale.
The same stable study page now leads with this brief and a proposed purpose synthesis.
Earlier material remains collapsed as context, not acceptance under the fresh brief.
Purpose review is pending. The proposed first investigation compares bypass, close pass,
and planet–moon encounters, followed by repeatable real-system flight evidence.
Whether gravity assists are optional opportunity or essential survival skill is the
current creative boundary for owner judgment. No runtime changes or acceptance implied.
