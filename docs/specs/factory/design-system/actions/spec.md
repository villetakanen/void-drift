---

generated:
  by: "openai-codex/gpt-6"
  at: "2026-11-24T15:54:03.685383+00:00"
verified: []

---

# Actions

## Blueprint

### Context

Commands, navigation links and fitting cards share recognizable action and availability states.

### Architecture

Shared definitions live in `packages/core/src/lib/styles/buttons.css`,
`tokens.css` and `apps/web/src/components/inputs/ActionGroup.svelte`;
`/lab/ds/actions` demonstrates action states and live group navigation. The
accepted reference is `/lab/studies/buttons-2026-11-11#whole`.

- Actions include commands and navigation. Commands use native buttons; navigation uses native links. Use a single filled call to
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
- `.btn-blocked` adds a 12% alert-role background tint to an unavailable normal
  or filled action. Its brackets use the alert role at 65% opacity; its label
  mixes 65% alert with 35% muted text in sRGB for a subdued red. Geometry and disabled behavior remain
  unchanged; ordinary unavailable actions retain their muted labels and frames.
  This error-blocked state means a correctable prerequisite prevents the action;
  ordinary unavailability (including a launch already underway) has no alert tint.
  It has no hover or pressed feedback and stays non-activatable. It is distinct
  from danger actions, which command a destructive operation. Hosts supply a
  visible explanation and associate it with the affected action.
- `.text-link` uses lime text and a 1px underline at 20% lime; hover,
  focus and held brighten the line to full lime. Unavailable links have muted
  text and no line. Owners must suppress activation of aria-disabled links.
- Bracket and underline changes ease over the fast duration; reduced motion removes transitions.
- Ghost, danger and link-button variants, shared focus rings, disabled fade and
  pressed indicators remain available for their existing consumers.
- Standalone action links have the same minimum height, padding, typography and group width as buttons, with underlined link appearance and a visible focus outline. Sentence links retain inline geometry.
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

#### Action-group navigation

- ActionGroup composes native buttons styled with `.btn`, button-styled links and standalone links styled with `.text-link.action-link`, retaining
  their native semantics and activation. Its wrapper is a group with an optional
  `label`; grouping supplies neither menu, toolbar nor application semantics.
- `navigation="native"` is the default: layout only. Directional navigation is
  opt-in through `navigation="directional"`; existing CSS groups stay native.
- `layout` is vertical (default), horizontal or strip. Vertical uses Up/Down;
  horizontal uses Left/Right, following visual direction in RTL. Strip uses the
  existing 580px container threshold and switches to Up/Down when stacked.
  Horizontal stays in one row. DOM and Tab order stay unchanged.
- Home/End focus the first/last available action. `wrap=true` (default) cycles
  at the ends; false clamps there. Movement changes real DOM focus without
  activating or selecting. Keyboard focus uses the shared visible focus state.
- All available actions retain normal Tab stops. Tab and Shift+Tab leave the
  group normally. Enter and Space keep native button/link activation behavior;
  pointer and touch activate directly. The group never sets initial focus,
  traps focus or restores it: the screen/dialog owns those policies.
- Arrow traversal skips disabled, aria-disabled, hidden, inert and non-tabbable
  actions. Aria-disabled actions may retain native Tab discovery; their owner
  suppresses activation. Empty groups do not capture keys.
- Only unmodified navigation keys originating on an available action in this
  group are handled. Nested groups, editable controls and composite widgets
  keep their own keys. Only handled keys suppress browser defaults.
- Screen-reader reading keys remain available through native semantics;
  operation through Tab and native activation is sufficient without arrows.
- The canonical Actions page documents the API and demonstrates native,
  vertical, horizontal, unavailable, wrap, no-wrap and responsive behavior.

### Constraints

- Commands use buttons; navigation uses links, in sentences or action groups.
- A primary action is visually distinct from normal actions.
- Hosts suppress unavailable activation while shared definitions own visual states.

## Contract

### Definition of Done

- Normal, filled and unavailable actions use the shared cut shape and brackets.
- Focus, hover, held and reduced-motion states remain recognizable.
- Part-choice frames and sanction bands follow the shared action edge.
- The canonical Actions page demonstrates the shared variants and group navigation.
- Directional groups move visible DOM focus while native Tab and activation remain usable.

### Regression guardrails

- DOM and keyboard order survive responsive group layout.
- Existing supported ghost, danger and link-button variants retain their consumer behavior.

### Scenarios

```gherkin
Scenario: Native grouping preserves browser navigation
  Given a ActionGroup with default navigation
  When I press an arrow key on an action
  Then the group leaves the key unhandled
  And every available action remains in the native Tab order

Scenario: Navigate without activating
  Given a directional vertical group with an unavailable action between two available actions
  When I press Down on the first available action
  Then visible DOM focus moves to the next available action without activation
  When I press Home and then End
  Then focus moves to the first and then the last available action
  When I press Down
  Then focus wraps to the first available action

Scenario: Stop at the edge when wrapping is disabled
  Given a directional horizontal group with wrap false
  When I press Right on its last available action in left-to-right layout
  Then focus stays on that action

Scenario: Follow responsive strip orientation
  Given a directional strip group with its first action focused
  When its host width stacks the group vertically
  And I press Down
  Then focus moves to the next available action in unchanged DOM order

Scenario: Leave and activate through native controls
  Given a directional group
  When I Tab through its last available action
  Then focus can leave the group
  And native keyboard, pointer and touch activation remain available

Scenario: Preserve nested and modified key behavior
  Given a directional group containing a nested editable control and another group
  When a key originates in either nested control or uses a modifier
  Then the outer group leaves the key unhandled

Scenario: Identify the primary action
  Given a group of commands with one primary action
  When the group renders
  Then the primary action uses the filled treatment and the others use normal actions

Scenario: Inspect an error-blocked action
  Given an unavailable action blocked by a correctable prerequisite
  When it renders with the blocked modifier
  Then a subtle alert tint distinguishes it from ordinary unavailability
  And its label is softened alert-red and its brackets are alert-red
  And it remains without hover or pressed feedback
  And a visible associated explanation identifies the blocking condition
  And activation remains suppressed

Scenario: Inspect an unavailable action
  Given an unavailable normal action
  When a pointer moves over it
  Then its unavailable frame remains visible without hover feedback
  And activation remains suppressed
```

```gherkin
Scenario: Navigation link in an action group
  Given a vertical action group containing a button and a standalone link
  Then the link occupies the same width and minimum height as the button
  And it appears as underlined text
  When arrow navigation moves from the button to the link
  Then the link receives visible keyboard focus
  And Enter follows its native destination
```
