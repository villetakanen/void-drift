# Dialogs

**Status:** Current.
**Source of truth:** `apps/web/src/components/Dialog.svelte`,
`packages/core/src/lib/styles/surfaces.css`.
**Reference:** `/lab/surfaces` (live dialog demo).
**Look:** [Surfaces and layers](../../factory/design-system/spec.md#surfaces-and-layers).

## Context

Before S6 the game menu and run complete were full-stage glass overlays marked `aria-modal`, but
nothing stopped the keyboard reaching what they covered: Tab went on to both engine pads, the
HUD stayed visible under the glass, focus stayed on `<body>` when they opened, and pause was an
unlabelled banner. The audit (2026-11-01, finding 8) found no `inert` anywhere. This spec makes
one behaviour for every dialog, so the stage is isolated the same way on every screen.

## What counts as a dialog

A dialog interrupts a stage: it covers the game (or another live view) and asks the player to
choose before the stage carries on. Today:

| Dialog       | Screen                    | Label          | Escape           | Focus on open                                     |
| ------------ | ------------------------- | -------------- | ---------------- | ------------------------------------------------- |
| Paused       | game, builder test flight | "Paused"       | resumes (closes) | Resume                                            |
| Run complete | game, custom survival     | "Run complete" | does nothing     | Initials when shown, else return to launch source |

Not dialogs:

- Status messages (`.flight-message`, builder and leaderboard notices) announce; they don't
  interrupt. They are `role="status"` and never take focus.
- The Motion instrument's overlay pane is a disclosure: a menu button opens a pane over the
  instrument, which stays the subject. It keeps its own behaviour (motion-instrument.md): focus
  moves to its close button, Escape closes it and returns focus to the menu button.
- The opening screen is a normal game menu, with the shared scrim appearance but no modal behavior.

## Architecture

`Dialog.svelte` is the only dialog implementation. Props: `label` (accessible name),
`onclose` (Escape calls it; omit it where closing is not allowed), `returnFocus` (default true),
`class` (extra panel classes), and the content.

Structure: the host is positioned and holds two siblings, the stage (`data-stage`) and the
dialog. The dialog renders `.dialog-layer` (`--layer-overlay`) with the scrim and a `.panel`
that is `role="dialog"`, `aria-modal="true"`, named by `label`, `tabindex="-1"`.

In FlightDeck the stage is `.flight-stage-layer`: the canvas and the deck.

## Behaviour

1. **Stage inert.** On open the stage gets `inert`. Nothing in it can be focused, clicked or
   found by assistive technology. Holders are counted, so if multiple dialogs overlap, the stage stays inert until all have closed.
   Returning from run complete opens the nonmodal title screen or Hangar.
2. **Page isolation.** Siblings along the dialog's ancestor path are inert, including the
   page header. Tab and Shift+Tab wrap within the dialog, and focus cannot move outside it.
   Existing inert state is preserved and counted across dialog handovers.
3. **The deck hides.** Parts marked `data-deck` inside an inert stage are
   `visibility: hidden`: instruments, thrust pads, deck buttons and info rows.
4. **The scrim shades the stage.** A `scrim-stage` takes `--scrim-filter` and a `--scrim-tint` colour
   blend, and the scrim layer carries `--scrim-surface`: the game reads as an offline feed behind
   the panel, its colours kept but pulled toward hue 290.
5. **Focus moves in.** On open, focus moves to the element marked `data-autofocus`, else the
   first control in the panel, else the panel itself.
6. **Focus returns.** On close, focus returns to the element that had it when the dialog opened,
   if it is still in the page and not inert; otherwise it stays where the page puts it. The stage
   is released before focus returns, so a control inside the stage can take it back.
   `returnFocus={false}` allows a caller to hand focus to the game instead.
7. **Escape.** Escape closes a dialog only where closing is allowed (`onclose` given): pause
   resumes. Run complete has nothing to go back to, so Escape does nothing there.
   During play, Escape opens pause.
8. **Motion.** The scrim and the stage filter ease in over `--duration-fast`; with reduced
   motion they appear at once.

## Contract

### Definition of Done

- [x] Every dialog uses `Dialog.svelte`; no other component sets `role="dialog"` in shared UI.
- [x] While a dialog is open, its stage is `inert` and its `data-deck` parts are hidden.
- [x] Focus moves into a dialog on open and returns to the opener on close (pause, Lab demo).
- [x] Escape resumes from pause; it does nothing on run complete.
- [x] `/lab/surfaces` has a live dialog demo on the real component, usable from the keyboard.
- [x] Browser tests cover dialog isolation and focus return (`tests/browser/dialogs.spec.ts`).

### Regression Guardrails

Focus remains within the active dialog and the rest of the page is unavailable.

- Tab never reaches the deck or the canvas while any dialog is open.
- A dialog never leaves its stage inert after it closes.
- Muted text on a panel keeps 4.5:1 with the star behind it (design-system-core.md, Panels).

### Scenarios

```gherkin
Scenario: Dialog isolation
  Given any dialog is open
  When the player presses Tab repeatedly
  Then focus never reaches the deck or the canvas

Scenario: Pause and resume from the keyboard
  Given a run in progress with focus on the Pause control
  When the player presses Escape
  Then the Paused dialog opens with focus on Resume
  And the deck is hidden
  When the player presses Escape again
  Then the run resumes and focus returns to the Pause control

Scenario: Run complete cannot be dismissed
  Given the run complete dialog is open
  When the player presses Escape
  Then the dialog stays open and the stage stays inert

```
