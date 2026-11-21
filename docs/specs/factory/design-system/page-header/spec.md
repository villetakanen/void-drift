---
status: draft
generated:
  by: "codex/gpt-6"
  at: "2026-11-21T16:53:04Z"
verified: []
---

# Page header

## Blueprint

### Context

Hangar, Credits and Lab pages share the Hangar's top-row identity: the brand
mark, page name and space for page-specific controls and navigation. Title and
flight retain their own composition. Settings and Top Scores remain outside
this adoption scope.

### Architecture

`apps/web/src/components/PageHeader.svelte` owns the semantic header, home-linked
Logo, heading, action region, labelled navigation and container-responsive layout.
Pages supply the name, heading level, navigation label and links, and optional
Svelte actions snippet. The header has no game state or persistence of its own.
Hangar supplies its existing Playground Switch and Settings destination. Credits
supplies its name. Lab supplies its page name and keeps its separate navigation
rail; studies retain their document title, status and question below the header.

The canonical MDX page `/lab/ds/page-header` describes ownership and embeds the
same component in adjustable-width examples. Example controls use local state.

### Constraints

- Shared tokens and Logo, Switch and button definitions govern presentation.
- The header fills its containing block and establishes an inline-size container.
- At containers below 40rem, actions and navigation wrap beneath identity.
- Names wrap instead of truncating; controls retain their minimum touch targets.
- Each page has one primary heading; embedded examples use a lower heading level.
- Navigation links live in a labelled nav; state controls live outside that nav.

## Contract

### Definition of Done

- Hangar, Credits and both Lab layouts compose the shared header.
- The design-system overview lists the MDX page, shared source and this contract.
- Live examples expose wide and narrow container behaviour on a desktop Lab page.

### Regression guardrails

- Hangar Playground retains its existing saved setting and launch eligibility.
- Title and flight do not acquire the shared header.
- Study identity and Lab navigation remain available.
- Resizing an example preserves its local control value and saved game settings.

### Scenarios

```gherkin
Scenario: Recognise a page
  Given Hangar, Credits or a Lab page
  When I view its header
  Then I see the shared home-linked brand and the page name
  And only the controls supplied by that page appear

Scenario: Use Hangar controls
  Given the Hangar header
  When I change Playground or follow Settings
  Then Playground updates the existing saved setting
  And Settings returns to Hangar through its existing destination

Scenario: Adapt to an embedded container
  Given the Page header design-system page at a Lab viewport of at least 1280px
  When I narrow a live example below 40rem without resizing the window
  Then actions and navigation wrap below the identity
  And the name and controls remain readable and usable

Scenario: Preserve document hierarchy
  Given a study or an embedded example
  When its header is rendered
  Then its heading level preserves the containing page's primary heading
  And navigation has an accessible label

Scenario: Keep gameplay composition
  Given the title screen or active flight
  When I view the screen
  Then its existing composition appears without the shared page header
```
