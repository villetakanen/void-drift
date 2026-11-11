# Hangar

## Blueprint

### Context

The Hangar is the player's base for choosing, fitting and preparing the ship
they fly. Its loop is: choose a ship, fit it, look at it, try it, and come back
to adjust it. The player returns here to understand what parts cost and give,
and to try a change before flying for a score.

Whatever the player chooses and fits here is the
[active ship](../active-ship/spec.md) at once, with no Apply step. The title
screen shows it and every launch flies it.

Earning and buying parts is the intended direction for later. During alpha,
[Playground](../experimental/spec.md) decides what the Hangar offers.

### Architecture and boundaries

- **Route.** `apps/web/src/pages/hangar.astro` mounts
  `apps/web/src/components/ShipBuilder.svelte` at `/hangar`. `/builder`
  redirects there. Every player-facing Hangar link targets `/hangar`.
- **Shared definitions.** The Hangar keeps no ship, part, slot or figure of its
  own. Ships and parts come from the catalogs, compatibility from `slotAccepts`,
  slots and drawing from `buildMounts` and `drawBuild`, and figures from
  `buildStats` ([ships](../ships/spec.md), [parts](../parts/spec.md)).
- **State.** The Hangar reads and writes the active ship and each ship's
  fitting through the module the [active ship](../active-ship/spec.md) contract
  names, and the Playground setting through its own.
- **Flight.** `apps/web/src/components/FlightDeck.svelte` receives the active
  ship, the mode and the return to the Hangar.
- **Interface.** The opening uses the shared `Logo`, `Switch` for the binary Playground setting, and `Tabs`
  for ship workspaces. Plan/View uses `Toggle`; controls and
  visual tokens follow the [design system](../../factory/design-system/spec.md).

### Rules

- **Opening.** One compact row sits above the ship chooser: the linked logo
  and one Hangar heading on the left, the labeled Playground Switch on the
  right. The logo returns to `/`. The header does not wrap within supported
  landscape iPad widths, and switching Playground leaves its height unchanged.
  There is no duplicate return link, version label, routine save-status line,
  or scoring explanation in the header.
- **Regions.** Below the opening the Hangar has distinct regions for the ship
  chooser, the ship display, the parts, the ship's systems, the flight
  estimates and the flight actions.
- **Opens on the active ship.** The Hangar opens showing the active ship in its
  fitting. No link or query chooses a ship.
- **Choosing.** The chooser shows every ship in the catalog. Choosing one makes
  it the active ship and shows the fitting the player left on it. Shared `Tabs`
  owns the workbench panel. Each tab shows the ship's short name, slot count
  and chassis mass, with no catalog badge. The row stretches across its host
  and stays one button tall. Playground Off makes unsanctioned ships unavailable
  using the shared tab state; an already active unsanctioned ship stays selected.
  Keyboard activation is manual: arrows, Home and End move focus without saving
  a choice; Enter or Space selects. Pointer and touch select immediately.
- **Fitting.** The player selects a slot and fits a part the slot accepts, or
  empties an optional slot. A required engine can be swapped but not removed.
  A linked engine pair is one choice, made on its primary slot; the other
  slot shows that it is linked. A change applies at once and touches only that
  slot or pair.
- **Part chooser.** Each compatible part is a 300-pixel card owned by
  `components/hangar/PartCard.svelte`: a small unframed drawing at top left,
  name and two lines of prose beside it, and one bottom line of up to four
  icon-and-number figures, mass first. Figures are 12 pixels, inset 16 pixels
  horizontally and 8 vertically. Sanctioned parts precede unsanctioned parts,
  retaining catalog order within each class. Optional slots start with Keep
  empty; required or linked slots have no empty choice. Keep empty replaces
  Remove fitting and shows the fitted state when the slot is empty.
- **Card states.** Cards use the shared action frame with no raised fill or
  pressed underline. Fitted means black ground and lit brackets. Unsanctioned
  means a hatched closing band following the bracket colour, with an accessible
  description. With Playground Off an unfitted unsanctioned card stays listed,
  fades as a whole to quarter opacity, remains keyboard discoverable, and cannot
  activate by pointer, keyboard or touch. An unsanctioned fitting remains full
  strength with red brackets, band and a faint red ground until replaced or
  removed. Its accessible description explains the remedy. State changes use
  the shared short fade and respect reduced motion.
- **Columns.** The parts pane is 342 pixels wide including its padding and
  border; cards stay 300 pixels at desktop and 1024-pixel landscape widths.
  The ship column keeps at least 360 pixels and estimates narrow and wrap
  first. Below the three-column layout the regions stack without horizontal
  scrolling. The ship tabs retain their shared selection behaviour.
- **Plan and View.** Plan shows the slots, what occupies them, what fits and
  which are linked. View shows the ship as it flies, with no markings. Switching
  keeps the fitting and the selection, and parts can be fitted in both.
- **Systems.** The stabilizer and linked-engines choices of the
  [ship](../ships/spec.md) are made here, per ship.
- **Estimates.** The Hangar shows the assembled ship's figures and says under
  what conditions they hold. The cruise ceiling is shown with its hull and
  engine parts, and each engine shows its contribution.
- **Flight actions.** The Hangar offers, in this order, Practice, Derelicts,
  Gauntlet and Survival. Survival is the primary action; Practice and Derelicts
  are normal actions; Gauntlet is shown disabled and cannot be started. Every
  launch flies the active ship, and Abort or game over returns to the Hangar
  with the ship unchanged.
- **Playground.** The Playground control is the only place the setting
  changes. What it locks, marks and blocks is owned by
  [Playground](../experimental/spec.md).
- **Launch context.** With Playground On, the launch row says “Playground ·
  Scoring off”; with Off this notice is absent. This replaces the engine-key
  explanation beside the flight actions. The current sticky launch-row behavior,
  including its overlap with scrolling content, is retained.
- **Save status.** Loading, recovery and unavailable-storage messages appear in
  the launch context when relevant. Successful ordinary persistence adds no
  permanent status text to the header.
- **Input.** Everything in the Hangar works with pointer and keyboard on a
  desktop and by touch on an iPad in landscape.

## Contract

### Definition of Done

- H1: `/hangar` shows the Hangar, and player-facing Hangar links target it.
- H2: The logo reaches `/` by pointer and keyboard; its accessible name
  identifies Void Drift. One Hangar heading and the Playground Switch share a
  compact header row whose height is unchanged by Playground.
- H3: The setting uses the shared binary `Switch`, labeled Playground,
  with a visible Off/On state and checkbox semantics; pointer and Space change it.
- H4: Switching Playground changes the Hangar and launch as
  [Playground](../experimental/spec.md) states.
- H5: The Hangar opens on the active ship in its fitting, and a `chassis`
  query changes nothing.
- H6: Choosing a ship shows its kept fitting and makes it the active ship
  ([active ship](../active-ship/spec.md) A3). The shared tab row owns the
  workbench panel, uses manual keyboard activation, and stays one button tall
  with Playground Off or On at supported landscape iPad widths.
- H7: Fitting or emptying a slot changes only that slot or its linked
  pair; a required engine has no empty choice; parts the slot does not accept
  are unavailable.
- Part cards retain their fixed width, sanctioned-first order and every state
  above; Keep empty removes only the selected optional fitting.
- H8: Plan shows slots, occupancy and links; View shows the ship without
  markings; switching keeps fitting and selection, and fitting works in both.
- H9: The stabilizer and linked-engines choices are kept per ship and
  govern the same ship in flight.
- H10: The figures shown match `buildStats` for the fitted ship and update
  when a fitting changes.
- H11: The flight actions appear in the order Practice, Derelicts, Gauntlet,
  Survival; Survival is the primary action, Gauntlet is disabled, and each of
  the others launches the active ship.
- H12: Abort and game over return to the Hangar with the ship and its
  fitting unchanged.
- H13: The save status reports loading, recovery and unavailable storage
  truthfully, and never claims a save that did not happen.
- H14: Choosing, fitting, systems and flight actions all work by keyboard,
  by pointer, and by touch on an iPad in landscape.

### Regression guardrails

- The Hangar and flight use the same slots, parts and fitting.
- What the Hangar lets the player fit, `LoadoutSchema` accepts; what it refuses,
  the schema rejects.
- Editing one ship never changes another ship's fitting.
- Selection, Plan or View and a finished flight never change the fitting.
- A storage failure leaves choosing, fitting and flying usable.

### Scenarios

```gherkin
Feature: Hangar

  Scenario: The Hangar opens on the ship I fly
    Given a ship other than the Wasp is the active ship
    When I open the Hangar
    Then it shows that ship in its fitting

  Scenario: Fit an optional slot
    Given an optional slot selected in Plan
    When I fit a part the slot accepts
    Then the part appears on the ship at once
    And the estimates change
    When I empty the slot
    Then the slot is empty and the other fittings are unchanged

  Scenario: A linked engine pair is one choice
    Given a ship with a linked engine pair
    When I fit another engine on the primary slot
    Then both engines of the pair change
    And the linked slot shows that it follows the primary
    And there is no choice that leaves the pair empty

  Scenario: Look at the ship as flown
    Given a fitted ship with a slot selected in Plan
    When I switch to View
    Then the ship is drawn as it flies, without slot markings
    And the fitting and the selection are unchanged

  Scenario: Try a change and come back
    Given I changed a fitting in the Hangar
    When I start Practice, then pause and abort
    Then I am back in the Hangar with that fitting

  Scenario: Flight actions
    When I look at the flight actions
    Then I see Practice, Derelicts, Gauntlet and Survival in that order
    And Survival is the primary action
    And Gauntlet cannot be started

  Scenario: Storage is unavailable
    Given the browser cannot store data
    When I choose a ship and fit it
    Then I can still fly it
    And the save status says the choices will not be kept
```
