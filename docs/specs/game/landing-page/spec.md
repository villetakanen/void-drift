# Title screen

## Blueprint

### Context

Give alpha players an immediate arcade invitation to fly, with Wasp ready by
default and other ships available through Hangar. Provide access to Hangar, Top Scores,
Settings and Credits within the game's title-screen composition. Return interrupted
or completed runs to the screen from which they launched.

The experience takes its cue from 1990s arcade games. The title screen is the
game's home and Hangar is an alternative launch point.

### Architecture

- `apps/web/src/components/FlightDeck.svelte` currently composes the launcher and
  run lifecycle. This spec owns title-screen intent and player navigation.
- Title-to-flight transition stays within the mounted Svelte game runtime. It
  owns the fade, fresh-run initialization, countdown and release of input/scoring.
  Astro continues to host the pages; this handoff does not require page navigation
  or an application-wide SPA conversion.
- [Hangar](../hangar/spec.md) owns ship selection, fitting and training/test flight.
- [Top Scores](../high-scores/spec.md), [Settings](../options/spec.md) and
  [Dialogs](../dialogs/spec.md) own their respective behavior.
- Each run retains its launch source: title screen or Hangar. Abort and game-over
  return actions use that source, independently of the selected ship.
- The existing cosmetic scene and arrival handoff are described in the
  [game contract](../spec.md#landing-system--2026-11-03). Its visual composition follows the constraints below.

### Constraints

- The whole screen is composed as a game screen, without website headers or footers.
- The background is a random star system: its star and planets provide the scene,
  without ships, derelicts or other gameplay clutter.
- Place the sun approximately at the centre of the bottom-right quadrant, below
  the hints. Let the star system extend diagonally toward the upper-left corner,
  with its outer edge approximately reaching that corner. This is a best-effort
  visual composition guide, not an exact geometric calculation or fit constraint.
- The background and shared dialog scrim fill the entire viewport, with title-screen content above
  it. Reuse the dialog scrim's visual definition independently of modal behavior;
  the title screen is a normal game menu, not a modal dialog. Focus is not trapped
  inside the panel, and the hints outside it remain accessible.
- The identity and game menu sit inside a visible panel above the scrim, following
  the current start-and-ship panel treatment. The panel contains PRESS START and
  the secondary destinations; ship selection remains in Hangar.
- The panel sits on the left side of a centred 16:9 content region, fitted within
  the viewport. Controls and text use native CSS sizes and shared design-system
  definitions; the content is not transformed or scaled. The background and scrim
  continue beyond the region to fill the viewport.
  The current title-screen target is iPad or larger.
- A static, decorative 156px-long Wasp overlaps the panel’s bottom-right corner,
  heading 30° above right. Its single equipped ion engine has a luminous plume;
  a ship-wide, 450px arrival-green trail starts at the wing tips and fades aft
  from 22% opacity. Artwork may overflow
  the panel, is hidden from assistive technology and never intercepts input.
  The production composition is also visible at `/lab/landing`.
- The version label sits at the bottom inside the menu panel, in small muted
  caption text.
- The lime logomark sits centred above a visible “VOID DRIFT” heading. The
  heading is ordinary text, not a new mark. Elsewhere lime marks actions on this
  screen. Informational text uses
  the specified Android green for HUD elements, not the brand colour.
- A text area to the right of the panel shows one short practical alpha hint at
  a time: flight controls, the survival objective, and guidance to visit Hangar
  to choose another ship. Messages rotate approximately every eight seconds with
  a subtle fade. Reduced motion presents a static message. World-flavour copy
  waits until the game voice is established.
- In portrait or square viewports, the hint area instead shows the persistent Android
  green status “Rotate your screen to landscape.” It clears automatically in landscape,
  without taking focus, blocking navigation, resetting the menu or locking orientation.
- PRESS START begins a survival run with Wasp through the existing fade-through-void
  transition and 3, 2, 1, GO countdown. Movement and scoring begin at GO; held
  controls apply at release. Reduced motion skips the fade and retains the count.
- Ship selection belongs in Hangar; the title screen has no ship selector.
- The Hangar link reads “HANGAR”; the rotating hint explains ship choice.
- Hangar, Top Scores, Settings and Credits are secondary game-menu destinations.
- PRESS START receives initial keyboard focus. The menu focus order is PRESS START,
  Hangar, Top Scores, Settings, Credits.
- Hangar provides training/test flight, start game and return to title screen.
- Top Scores, Settings and Credits each provide return to title screen.
- Pause provides Abort, returning to the run's launch source.
- Game over provides Top Scores and return to the run's launch source.
- Top Scores returns to title screen even when entered from game over.
- Shared procedural artwork and interface primitives supply the presentation.
  Keyboard operation and reduced-motion support remain part of the experience.

## Contract

### Definition of Done

- [ ] PRESS START launches Wasp without a ship-selection step.
- [ ] The title screen has no ship selector and identifies Hangar as the place to choose ships.
- [ ] All destinations and return actions in the navigation contract are reachable.
- [ ] Abort and game-over return resolve correctly for both launch sources.
- [ ] The title screen presents a unified game composition without a website shell.
- [ ] A random star-system background contains no ships, derelicts or gameplay clutter.
- [ ] The background uses the shared dialog scrim beneath title-screen content.
- [ ] The identity and menu are grouped inside a visible panel above the scrim.
- [ ] The panel sits on the left within the centred 16:9 composition and remains usable
  when the slot scales to iPad-sized and larger views.
- [ ] Keyboard users can launch and reach each menu destination in the specified
  order, starting with focus on PRESS START and without a modal focus trap.
- [ ] Practical hints appear one at a time and rotate approximately every eight
  seconds with a subtle fade; reduced motion shows a static message.
- [ ] Portrait and square viewports show the orientation warning without interrupting
  navigation; it clears on return to landscape.
- [ ] Human review confirms the start invitation dominates the secondary choices.

### Regression Guardrails

- Launch source survives pause/resume and completion of the run.
- Hangar ship choices do not change the Wasp launched by title-screen PRESS START.
- Hangar remains a launch point for its configured ship.
- Menu presentation does not advance survival state or scoring.
- Automated navigation checks establish correctness; human review assesses arcade
  feel, visual hierarchy and fidelity separately.

### Scenarios

```gherkin
Scenario: Immediate flight
  Given the player enters the title screen
  When the player activates PRESS START
  Then a survival run starts with Wasp
  And its launch source is the title screen

Scenario: Choose another ship through Hangar
  Given the player enters Hangar from the title screen
  When the player selects another available ship
  And starts a game from Hangar
  Then the run uses the configured ship
  And its launch source is Hangar

Scenario: Title-screen launch after a Hangar choice
  Given the player chose another ship in Hangar
  And returned to the title screen
  When the player activates PRESS START
  Then a survival run starts with Wasp
  And its launch source is the title screen

Scenario Outline: Return to the launch source
  Given a run launched from <source>
  When the player uses <action>
  Then the player returns to <source>

  Examples:
    | source       | action           |
    | title screen | pause Abort      |
    | Hangar       | pause Abort      |
    | title screen | game-over Return |
    | Hangar       | game-over Return |

Scenario: Scores after a Hangar run
  Given a run launched from Hangar has ended
  When the player opens Top Scores from game over
  And uses its return action
  Then the title screen opens with PRESS START ready to launch Wasp
```
