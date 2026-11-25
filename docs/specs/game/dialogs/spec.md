---
generated:
  by: "openai-codex/gpt-6.2-sol"
  at: "2026-11-25T08:37:38Z"
verified: []
---

# Dialogs

## Blueprint

### Context

Dialogs isolate the covered stage so the player can act on the interruption
without accidentally operating the game behind it.

#### What counts as a dialog

A dialog interrupts a stage: it covers the game (or another live view) and asks the player to
choose before the stage carries on. Today:

| Dialog       | Screen                    | Label          | Escape           | Focus on open                                     |
| ------------ | ------------------------- | -------------- | ---------------- | ------------------------------------------------- |
| Paused       | game, builder test flight | "Paused"       | resumes (closes) | Resume                                            |
| Run complete | game, custom survival     | "Run complete" | does nothing     | Return to launch source; for a ranked result, the dialog until its best check resolves, then Initials for a new best, else the launch source |

Not dialogs:

- Status messages (`.flight-message`, builder and leaderboard notices) announce; they don't
  interrupt. They are `role="status"` and never take focus.
- The Motion instrument's overlay pane is a disclosure: a menu button opens a pane over the
  instrument, which stays the subject. It keeps its own behaviour (motion-instrument.md): focus
  moves to its close button, Escape closes it and returns focus to the menu button.
- The opening screen is a normal game menu, with the shared scrim appearance but no modal behavior.

#### Pause content boundary

The Pause dialog contains run actions and navigation only. Settings controls
never appear inside it: no preference switches, sliders, selectors or embedded
settings panels, including experimental features such as
[Speed camera](../camera/speed-camera/spec.md). Its control belongs exclusively
to [Options](../options/spec.md). The Settings action navigates
to the separate Options page; it does not reveal settings inside the dialog.

### Architecture

`apps/web/src/components/Dialog.svelte` and `packages/core/src/lib/styles/surfaces.css`
implement the shared [dialog appearance](../../factory/design-system/spec.md#surfaces-and-layers),
shown at `/lab/surfaces`.

`Dialog.svelte` is the only dialog implementation. Props: `label` (accessible name),
`onclose` (Escape calls it; omit it where closing is not allowed), `returnFocus` (default true),
`class` (extra panel classes), and the content.

Structure: the host is positioned and holds two siblings, the stage (`data-stage`) and the
dialog. The dialog renders `.dialog-layer` (`--layer-overlay`) with the scrim and a `.panel`
that is `role="dialog"`, `aria-modal="true"`, named by `label`, `tabindex="-1"`.

In FlightDeck the stage is `.flight-stage-layer`: the canvas and the deck.

### Constraints

- **Stage inert.** On open the stage gets `inert`. Nothing in it can be focused, clicked or
   found by assistive technology. Holders are counted, so if multiple dialogs overlap, the stage stays inert until all have closed.
   Returning from run complete opens the nonmodal title screen or Hangar.
- **Page isolation.** Siblings along the dialog's ancestor path are inert, including the
   page header. Tab and Shift+Tab wrap within the dialog, and focus cannot move outside it.
   Existing inert state is preserved and counted across dialog handovers.
- **The deck hides.** Parts marked `data-deck` inside an inert stage are
   `visibility: hidden`: instruments, thrust pads, [Pause and Weapons flaps](../game-screen/spec.md)
   (including passive or emergency readouts) and info rows.
- **The scrim shades the stage.** A `scrim-stage` takes `--scrim-filter` and a `--scrim-tint` colour
   blend, and the scrim layer carries `--scrim-surface`: the game reads as an offline feed behind
   the panel, its colours kept but pulled toward hue 290.
- **Focus moves in.** On open, focus moves to the element marked `data-autofocus`, else the
   first control in the panel, else the panel itself. Content that is still loading may mark itself
   `data-hold-focus`: focus then rests on the panel, and the content places it when it is ready,
   only if the player has not moved it.
- **Focus returns.** On close, focus returns to the element that had it when the dialog opened,
   if it is still in the page and not inert; otherwise it stays where the page puts it. The stage
   is released before focus returns, so a control inside the stage can take it back.
   `returnFocus={false}` allows a caller to hand focus to the game instead.
- **Escape.** Escape closes a dialog only where closing is allowed (`onclose` given): pause
   resumes. Run complete has nothing to go back to, so Escape does nothing there.
   During play, Escape opens pause.
- **Motion.** The scrim and the stage filter ease in over `--duration-fast`; with reduced
   motion they appear at once.

## Contract

### Definition of Done

- Every dialog uses `Dialog.svelte`; no other component sets `role="dialog"` in shared UI.
- While a dialog is open, its stage is `inert` and its `data-deck` parts are hidden.
- Focus moves into a dialog on open and returns to the opener on close (pause, Lab demo).
- Escape resumes from pause; it does nothing on run complete.
- Pause contains no settings controls. Its Settings action navigates to Options.
- `/lab/surfaces` has a live dialog demo on the real component, usable from the keyboard.
- Browser tests cover dialog isolation and focus return (`tests/browser/dialogs.spec.ts`).

### Regression guardrails

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
