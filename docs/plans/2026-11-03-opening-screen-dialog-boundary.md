# Opening-screen navigation and dialog modality

Status: resolved 2026-11-05. The owner chose normal title-screen navigation;
actual interrupting dialogs retain modal focus. The original deferral and options
below remain as the decision record.

## Problem and owner decisions

The opening screen is implemented as an always-open `Game menu` dialog in
`FlightDeck.svelte`. Hangar, High Scores and Options are outside that dialog.
The flight Lab also puts inspector controls outside game dialogs.

The current shared `Dialog.svelte` isolates only the stage and permits focus in
other page controls. The previous spec called this an owner decision. The owner
challenged that claim as likely agent drift and explicitly stated that all dialogs
should trap keyboard focus until closed.

Applying a modal focus trap to the current composition alone would block the
opening screen's navigation. After identifying that consequence, the owner chose:
“Defer modal fix; finish pruning.” Current behavior is therefore preserved
temporarily, not accepted as the intended long-term dialog behavior.

## Design decision to resolve

Determine which surfaces are actual interrupting dialogs and which are normal
page or instrument states. Prefer examining these two options with the owner:

1. Make the opening screen a normal page composition with ordinary navigation;
   reserve modal dialogs for interruptions such as pause and run completion.
2. Keep an opening dialog but compose all actions needed at that point, including
   navigation, inside its focus boundary.

Apply the same distinction to Lab replay/paused inspection: users need a coherent
way to inspect and export a stopped trial without reaching behind a modal dialog.
The instrument disclosure pane is not automatically a dialog.

## Acceptance for the later change

- Opening navigation remains reachable by keyboard, pointer and landscape touch.
- Actual dialogs retain focus: forward/backward Tab wrap, background focus and
  interaction are blocked, focus enters on open and returns appropriately on close.
- Escape closes only dismissible dialogs; starting play hands keys to the game.
- Pause, run completion and dialog handover preserve stage isolation and HUD rules.
- Lab replay, configuration, export and preview remain usable through normal controls.
- Shared behavior lives in the owning component and is demonstrated in the Lab.
- Tests follow the accepted composition; they neither force clicks through modal
  boundaries nor assert the current external-header access as permanent intent.
- Update `dialogs.md`, opening-screen rules and relevant Lab contracts together.

First review the actual opening and Lab workflows, then choose the composition.
This record authorizes no implementation beyond the owner's separate future decision.
