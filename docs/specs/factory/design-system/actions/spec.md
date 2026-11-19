---

title: "Spec: Actions"
status: draft
generated:
by: "openai-codex/gpt-6.1-sol"
at: "2026-11-19T12:32:56+02:00"
verified:
- by: "openai-codex/gpt-6.1-sol"
  at: "2026-11-19T12:33:38+02:00"

---

# Spec: Actions

## Blueprint

### Context

Commands, navigation links and fitting cards share recognizable action and availability states.

### Architecture

Shared definitions live in `packages/core/src/lib/styles/buttons.css` and
`tokens.css`; `/lab/ds/actions` demonstrates the action language. The
accepted reference is `/lab/studies/buttons-2026-11-11#whole`.

- Actions command; links belong in sentences. Use a single filled call to
  action alongside normal actions. Buttons have cut corners, a minimum 44px
  target, and 8px vertical and 16px horizontal padding.
- `.btn.btn-normal` has a regular label and a pane at elevation 2 on the
  void or elevation 3 on a panel, supplied by `--button-ground`. Its 1px
  brackets leave the middle 40% open across top and bottom. Brackets use
  `--color-bracket` at rest, action lime on hover and keyboard focus.
  Held, the pane takes a 28% action tint.
- `.btn.btn-filled` retains its lime fill and pointer brightness; held it
  dims to 0.85 brightness. Keyboard focus draws dark 2px brackets inset 3px.
- Unavailable normal and filled buttons have no fill, a muted label and
  full-opacity brackets; the filled button's brackets remain lime. This frame
  is the one exception to lime marking what can be acted on or selected.
  Unavailable controls do not respond visually to a pointer.
- `.text-link` uses lime text and a 1px underline at 20% lime; hover,
  focus and held brighten the line to full lime. Unavailable links have muted
  text and no line. Owners must suppress activation of aria-disabled links.
- Bracket and underline changes ease over the fast duration; reduced motion removes transitions.
- Ghost, danger and link-button variants, shared focus rings, disabled fade and
  pressed indicators remain available for their existing consumers.
- Vertical groups retain 8px gaps. Existing strip groups remain on a void
  surface and stack below 580px of host width. Preserve DOM and tab order.


Survival countdown uses Saira Stencil 700 outlines (SIL OFL), in Android green, as transient run-status information.

#### Part-choice frames and sanction marker

The `btn-card` variant of a normal button keeps the cut shape, brackets,
pointer, keyboard focus, held feedback and transitions, with a transparent
resting body and no pressed underline. Its composed owner supplies the fitted
or blocked fill. An `unsanctioned-band` is as wide as the button corner cut,
uses the host's `--btn-edge`, and follows that edge through dim, lit and red
states. `/lab/ds/actions` demonstrates these shared definitions.

### Constraints

- Commands use buttons and sentence navigation uses links.
- A primary action is visually distinct from normal actions.
- Hosts suppress unavailable activation while shared definitions own visual states.

## Contract

### Definition of Done

- Normal, filled and unavailable actions use the shared cut shape and brackets.
- Focus, hover, held and reduced-motion states remain recognizable.
- Part-choice frames and sanction bands follow the shared action edge.
- The canonical Actions page demonstrates the shared variants.

### Regression guardrails

- DOM and keyboard order survive responsive group layout.
- Existing supported ghost, danger and link-button variants retain their consumer behavior.

### Scenarios

```gherkin
Scenario: Identify the primary action
  Given a group of commands with one primary action
  When the group renders
  Then the primary action uses the filled treatment and the others use normal actions

Scenario: Inspect an unavailable action
  Given an unavailable normal action
  When a pointer moves over it
  Then its unavailable frame remains visible without hover feedback
  And activation remains suppressed
```
