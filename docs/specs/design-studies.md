# Design studies

Status: button pilot accepted by the owner; promotion authorized and pending.

## Context

Conversation produces inspectable design proposals before shared implementation changes.
The first pilot investigates button situations, hierarchy, states, and action composition.

## Contract

- `/lab/studies` lists studies; `/lab/studies/<slug>` provides a stable review URL.
- `apps/web/src/data/studies.ts` validates metadata with Zod before rendering.
- Each page identifies the question, examples, recommendation, open questions,
  meaningful decision history, and integration status.
- Exploratory → accepted → integrated distinguishes owner acceptance from delivery.
  Agents record acceptance only when the owner explicitly settles the direction.
- Experimental styles remain scoped to study components; fixture behavior is labeled.
- Iteration keeps the URL and records significant feedback and reasons. Git retains detail.
- Promotion updates shared implementation, canonical Lab examples, and relevant design
  guidance/specs; the study retains rationale and links to the resulting destinations.
- Keyboard operation and narrow layouts are reviewed separately from gameplay feel.

## Scenarios

Given an operator describes a design problem, the agent extracts a bounded brief and
creates interactive examples at a stable URL with unresolved decisions visible.

Given feedback changes the direction, the same study is revised and the reason recorded;
shared production styles remain unaffected until deliberate integration.

Given a study is accepted but implementation is unfinished, its status is accepted,
not integrated. Unavailable checks and pending human review remain explicit.

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
