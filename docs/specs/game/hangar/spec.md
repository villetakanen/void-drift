---

title: "Spec: Hangar"
status: draft
generated:
  by: "openai-codex/gpt-6.2-astra"
  at: "2026-11-27T06:27:00Z"
verified:
  - by: human:ville-takanen
    at: "2026-11-27T06:36:11Z"

---

# Hangar

## Context

The Hangar is the player's workbench between flights. Here the player chooses a ship, sees how a fitting changes what it can do, and tries it in Practice before flying for a score.

## Blueprint

Choosing or fitting a ship changes the [active ship](../active-ship/spec.md) at once, with no Apply step. The title screen shows it and every launch flies it.

### Architecture

- **Route.** [The Hangar route](../../../../apps/web/src/pages/hangar.astro) mounts
  [the workbench](../../../../apps/web/src/components/ShipBuilder.svelte) at `/hangar`. `/builder`
  redirects there. Every player-facing Hangar link targets `/hangar`.
- **Shared definitions.** The Hangar keeps no ship, part, slot or figure of its
  own. Ships and parts come from the [catalogs](../../../../packages/mode-a/src/lib/schemas/loadout.ts). The chooser uses the same `slotAccepts` compatibility rule as `LoadoutSchema`, and each edit is validated before saving. The workbench takes
  slots and drawing from `buildMounts` and `drawBuild`, and figures from
  `buildStats` ([ships](../ships/spec.md), [parts](../parts/spec.md)).
- **State.** The Hangar reads and writes the active ship and each ship's
  fitting through the [ship setup store](../../../../apps/web/src/lib/stores/ship-setup.ts), which also exposes the [Playground setting](../experimental/spec.md).
- **Flight.** [FlightDeck](../../../../apps/web/src/components/FlightDeck.svelte) receives the active
  ship, the mode and the return to the Hangar.
- **Interface.** The opening composes the shared [Page header](../../factory/design-system/page-header/spec.md)
  with plain Hangar identity, `Switch` for the binary Playground setting, and
  Settings navigation. Shared `Tabs` provides ship workspaces. Plan/View uses `SegmentedControl`; controls and
  visual tokens follow the [design system](../../factory/design-system/spec.md).
  Parts and flight-estimate panes use the shared `cut-surface`, which owns their edges.
  In [ShipBuilder's layout styles](../../../../apps/web/src/components/ShipBuilder.svelte),
  `.builder` and `.builder-content` own the page gutters and header gap;
  `.workbench` and its media rules own column sizing and stacking.


### Constraints

- Shared controls and visual tokens follow the [choice-control contract](../../factory/design-system/choices/spec.md).
- **Opening.** One compact row sits above the ship chooser: the linked logo
  and plain Hangar identity on the left, the labeled Playground Switch followed
  by Settings as the last item on the right. Settings opens `/settings?from=hangar`
  with a Return to Hangar action, as defined by [Options](../options/spec.md). The logo's accessible name identifies Void Drift and the link returns to `/`. The Playground Switch shows Off or On, exposes checkbox semantics and responds to pointer or Space. The header does not wrap within supported
  landscape iPad widths, and switching Playground leaves its height unchanged.
  There is no duplicate return link, version label, routine save-status line,
  or scoring explanation in the header.
- **Page spacing.** The header and workbench share a gutter that narrows on smaller screens.
  A compact gap separates the header from the chooser. The page scrolls, with flight actions in a sticky footer.
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
- **Part chooser.** The selected slot name leads directly into the choices,
  with no helper paragraph between them. [PartCard](../../../../apps/web/src/components/hangar/PartCard.svelte) owns card dimensions and spacing.
  Each compatible part has a small unframed drawing at top left, its name and two lines of prose beside it,
  and the figures supplied by [Parts](../parts/spec.md) in one inset row below. Sanctioned parts precede unsanctioned parts,
  retaining catalog order within each class. Optional slots start with Keep
  empty; required or linked slots have no empty choice. Keep empty replaces
  Remove fitting and shows the fitted state when the slot is empty.
- **Retired rail gun.** The rail gun is unavailable as a new fitting. A saved rail fitting remains visible on its selected mount as disabled, and can be removed or replaced.
- **Card states.** Cards use the shared action frame with no raised fill or
  pressed underline. Fitted means black ground and lit brackets. Unsanctioned
  means a hatched closing band following the bracket colour, with an accessible
  description. With Playground Off an unfitted unsanctioned card stays listed,
  dims as a whole, remains keyboard discoverable, and cannot
  activate by pointer, keyboard or touch. An unsanctioned fitting remains full
  strength with red brackets, band and a faint red ground until replaced or
  removed. Its accessible description explains the remedy. State changes use
  the shared short fade and respect reduced motion.
- **Columns.** On desktop and landscape iPad, the parts pane fits its cards without shrinking them.
  As space tightens, estimates narrow and wrap before the ship display loses its working space. Below the three-column layout the regions stack without horizontal
  scrolling. The ship tabs retain their shared selection behaviour.
- **Plan and View.** Plan shows the slots, what occupies them, what fits and
  which are linked. View shows the ship as it flies, with no markings. Switching
  keeps the fitting and the selection, and parts can be fitted in both.
  Fitted parts retain the same size relative to the hull in both modes;
  Plan does not shrink them to fit inside slot markers.
  Slot outlines, selection brackets and labels draw above all fitted parts.
  Linked-pair crossbars use the chassis's authored `slotLinkLines` positions,
  in ship-local forward coordinates, keyed by the secondary mount. Drawing and
  Hangar framing use the same `buildSlotLinks` paths. These values only route
  the schematic; they do not move mounts or change fitting coupling.
- **Systems.** The stabilizer and linked-engines choices of the
  [ship](../ships/spec.md) are made here, kept per ship and used in flight.
- **Estimates.** The Hangar shows the assembled ship's figures and says under
  what conditions they hold. The cruise ceiling is shown with its hull and
  engine parts, and each engine shows its contribution. The Hangar displays the figures supplied by Ships and Parts with their supplied units.
- **Flight actions.** The Hangar offers, in this order, Practice, Derelicts,
  Gauntlet and Survival. Survival is the primary action; the other actions are
  normal actions. Gauntlet launches its mode; the [Gauntlet contract](../gauntlet/spec.md)
  owns its behaviour. Every launch flies the active ship, and Abort or game over
  returns to the Hangar with the ship unchanged.
- **Playground.** The Playground control is the only place the setting
  changes. What it locks, marks and blocks is owned by
  [Playground](../experimental/spec.md).
- **Launch context.** With Playground On, the launch row uses the title screen's
  shared red `PlaygroundStatus`: “PLAYGROUND ACTIVE” and “UNRANKED PLAY” on
  separate lines. With Playground Off and an unsanctioned build, it instead
  reads “PLAYGROUND OFF” and “UNSANCTIONED BUILD”, to the left of the flight
  buttons and associated with each unavailable launch. With Off and an eligible
  build this notice is absent. This replaces the engine-key
  explanation beside the flight actions. The current sticky launch-row behavior,
  including its overlap with scrolling content, is retained.
- **Save status.** Loading, recovery and unavailable-storage messages appear in
  the launch context when relevant. Successful ordinary persistence adds no
  permanent status text to the header.
- **Input.** Everything in the Hangar works with pointer and keyboard on a
  desktop and by touch on an iPad in landscape.

- **Continuity.** Editing one ship never changes another ship's fitting. Selecting a slot, switching Plan/View and finishing a flight do not edit the fitting. Storage failure leaves choosing, fitting and flying usable without claiming a successful save. Returning from Settings preserves the active ship, fitting and preferences; selected slot and Plan/View need not be restored.

## Scenarios

```gherkin
Feature: Hangar

  Scenario: The Hangar opens on the ship I fly
    Given I previously selected a ship other than the starter ship
    When I open the Hangar
    Then it shows that ship in its fitting

  Scenario: Change preferences and return to the Hangar
    Given I chose a ship and changed its fitting in the Hangar
    When I activate Settings after Playground in the compact header
    Then Options opens at /settings?from=hangar
    When I change a preference and activate Return to Hangar
    Then /hangar opens with the same active ship and fitting
    And my preference is kept
    And the header remains one row at supported landscape iPad widths

  Scenario: Align the header and workbench
    Given the Hangar is open in a wide viewport
    When I narrow the viewport to the compact layout
    Then the header and workbench stay aligned inside narrower page gutters
    And the gap between the header and chooser stays the same
    And the flight actions stay visible as I scroll the page

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
    Given I am in the Hangar
    When I look at the flight actions
    Then I see Practice, Derelicts, Gauntlet and Survival in that order
    And Survival is the primary action
    When I launch Gauntlet
    Then Gauntlet starts with the active ship

  Scenario: Explain a blocked build beside the launch actions
    Given Playground is Off and the active build is unsanctioned
    When I view the Hangar launch row
    Then “PLAYGROUND OFF” and “UNSANCTIONED BUILD” appear to the left of the buttons
    And every flight launch is unavailable with the status as its description
    When I restore eligibility by changing the build or enabling Playground
    Then every flight launch becomes available without an automatic fitting change
    And the blocked status is replaced by the appropriate Playground status

  Scenario: Storage is unavailable
    Given the browser cannot store data
    When I choose a ship and fit it
    Then I can still fly it
    And the save status says the choices will not be kept
```
