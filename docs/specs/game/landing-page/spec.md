---

title: "Spec: Title screen"
status: draft
generated: { by: codex/gpt-6, at: "2026-11-19T19:21:23+02:00" }
verified: [{ by: codex/gpt-6, at: "2026-11-19T13:55:56+00:00" }, { by: "codex/gpt-6", at: "2026-11-19T19:21:23+02:00" }]
---

# Title screen

## Blueprint

### Context

Give players an immediate arcade invitation to fly, with the ship prepared in
the Hangar, the [active ship](../active-ship/spec.md), ready to launch. Provide access to Hangar, Top Scores,
Settings and Credits within the game's title-screen composition. Return interrupted
or completed runs to the screen from which they launched.

The experience takes its cue from 1990s arcade games. The title screen is the
game's home and Hangar is an alternative launch point.

### Architecture

- `apps/web/src/components/FlightDeck.svelte` composes the launcher and
  run lifecycle. This spec owns title-screen intent and player navigation.
- Title-to-flight transition stays within the mounted Svelte game runtime. It
  owns the fade, fresh-run initialization, countdown and release of input/scoring.
  Astro continues to host the pages; this handoff does not require page navigation
  or an application-wide SPA conversion.
- [Hangar](../hangar/spec.md) owns ship selection, fitting and training/test flight.
- The [game contract](../spec.md) owns Top Scores; [Options](../options/spec.md)
  and [Dialogs](../dialogs/spec.md) own their respective behavior.
- Each run retains its launch source: title screen or Hangar. Abort and game-over
  return actions use that source, independently of the selected ship.
- The title screen consumes the shared
  [game field backdrop](../../factory/design-system/game-field-backdrop/spec.md).
  That design-system component owns the generated decorative system, its
  composition and its scrim; this spec owns the title content and its
  placement above the backdrop.
- Settings, Top Scores and Credits use the same backdrop composition. The Title
  Screen remains the target for the component's fixed outermost-orbit framing.
- The [Title-screen hints spec](hints.md) defines the hint area's content and
  behavior; this spec owns its placement in the title-screen composition.

### Constraints

- The whole screen is composed as a game screen, without website headers or footers.
- The shared backdrop fills the viewport beneath the title content. The menu
  remains a normal game screen, not a modal dialog; focus is not trapped inside
  the panel, and the hints outside it remain accessible.
- The identity and game menu sit inside a visible panel above the scrim, following
  the current start-and-ship panel treatment. The panel contains PRESS START and
  the secondary destinations; ship selection remains in Hangar.
- The panel sits on the left side of a centred 16:9 content region, fitted within
  the viewport. Controls and text use native CSS sizes and shared design-system
  definitions; the content is not transformed or scaled. The background and scrim
  continue beyond the region to fill the viewport.
  The current title-screen target is iPad or larger.
- A static, decorative 156px-long ship overlaps the panel’s bottom-right corner,
  heading 30° above right. It is the active ship in its fitting; a fitted Wasp
  carries its Light Ion Cannon in the right hull slot, its Ion Point Defence in
  the left hull slot and one light ion engine with a luminous plume;
  a ship-wide, 450px arrival-green trail starts at the wing tips and fades aft
  from 22% opacity. Artwork may overflow
  the panel, is hidden from assistive technology and never intercepts input.
- The version label sits at the bottom inside the menu panel, in small muted
  caption text.
- The lime logomark sits centred above a visible “VOID DRIFT” heading. The
  heading is ordinary text, not a new mark. Elsewhere lime marks actions on this
  screen. Informational text uses
  Android green, not the brand colour.
- A text area to the right of the panel presents the rotating entries and
  narrow-screen status defined by [Title-screen hints](hints.md).
- PRESS START fades to void over 150 ms, replaces the scene with a fresh seeded
  G-class Survival run with the active ship, and reveals it over 150 ms. Repeated
  activation during the start is ignored.
- A centred three-second 3, 2, 1 countdown then holds the world, resources and
  score timer still. Movement and scoring begin at GO; controls held through
  the count apply at release. A hidden page or pause holds the count, and losing
  focus leaves the new run paused.
- The run arrives at radius 1180 from the star, at speed 600, heading 37 degrees
  off inward, with a green speed line behind the ship.
- Reduced motion skips the fade and retains the count without ignition flicker.
- From Hangar, Survival uses the same arrival and countdown and returns to
  Hangar; Hangar test flight starts directly.
- Ship selection belongs in Hangar; the title screen has no ship selector.
- [Playground](../experimental/spec.md) owns the status copy and states. The
  title-screen status slot sits below the menu panel and above the decorative
  ship, separate from the menu's control group. A blocked-build warning does not
  replace the title hints or interrupt their normal rotation behavior.
- The Hangar link reads “HANGAR”; ship selection belongs in the Hangar.
- Hangar, Top Scores, Settings and Credits are secondary game-menu destinations.
- PRESS START receives initial keyboard focus when available; when launch is
  blocked, Hangar receives focus instead. The menu focus order is PRESS START,
  Hangar, Top Scores, Settings, Credits, skipping unavailable actions.
- Hangar provides training/test flight, start game and return to title screen.
- Top Scores, Settings and Credits each provide return to title screen.
- Pause provides Abort, returning to the run's launch source.
- Every game over provides return to the run's launch source; a Survival game
  over also provides Top Scores.
- Top Scores returns to title screen even when entered from game over.
- Shared procedural artwork and interface primitives supply the presentation.
  Keyboard operation and reduced-motion support remain part of the experience.

## Contract

### Definition of Done

- PRESS START launches the active ship without a ship-selection step.
- The title screen has no ship selector and identifies Hangar as the place to choose ships.
- All destinations and return actions in the navigation contract are reachable.
- Abort and game-over return resolve correctly for both launch sources.
- The title screen presents a unified game composition without a website shell.
- The shared DS game field backdrop appears beneath the title-screen content.
- The identity and menu are grouped inside a visible panel above the scrim.
- The panel sits on the left within the centred 16:9 composition and remains usable
  when the slot scales to iPad-sized and larger views.
- Keyboard users can launch and reach each menu destination in the specified
  order, starting with focus on PRESS START and without a modal focus trap.
- The title screen presents the content and behavior defined by
  [Title-screen hints](hints.md).
- The Playground status slot appears below the menu panel, above the decorative
  ship, and outside the menu control group. A blocked-build warning leaves the
  title hints' normal behavior unchanged.
- PRESS START hands off a fresh active-ship run whose countdown holds position,
  power and ticks until GO, with controls held through the count applying at
  release.
- Reduced motion skips the launch fade and retains the three-second count.

### Regression guardrails

- Launch source survives pause/resume and completion of the run.
- PRESS START flies the active ship shown on the title screen.
- Hangar remains a launch point for its configured ship.
- Menu presentation does not advance survival state or scoring.

### Scenarios

```gherkin
Scenario: Immediate flight
  Given a fresh device
  And the player enters the title screen
  When the player activates PRESS START
  Then a survival run starts with the active ship of a new device, the fitted Wasp
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
  Then the title screen shows that ship in its fitting
  When the player activates PRESS START
  Then a survival run starts with that ship in its fitting
  And its launch source is the title screen

Scenario: Scores after a Hangar run
  Given a run launched from Hangar has ended
  When the player opens Top Scores from game over
  And uses its return action
  Then the title screen opens with PRESS START ready to launch the active ship
```
