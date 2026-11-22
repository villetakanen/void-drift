---
generated:
  by: "openai-codex/gpt-6.2-sol"
  at: "2026-11-22T07:28:15Z"
verified: []
---

# Design system

## Blueprint

### Context

The design system is Void Drift's shared visual language: identity, typography,
colour, elevation, surfaces, layers, inputs and the shared marks on ship
part artwork. It keeps the game HUD, menus and
the Lab consistent in one register, utilitarian sci-fi neon on the void, so a
screen composes shared definitions instead of inventing its own.

The Design system at `/lab/ds`, [Lab](../../lab/spec.md) at `/lab`, and
[Studies](../../studies/spec.md) at `/lab/studies` are peer development tools.
Their URL nesting is a convention. The Design system owns its definitions and
canonical examples; Lab and Studies consume them without acquiring ownership.

### Architecture

- `packages/core/src/lib/styles/tokens.css` is the single source of tokens.
  `packages/core/src/lib/ui/colors.ts` mirrors the colours canvas needs;
  `scripts/check-contracts.mjs` keeps them equal.
- Shared CSS lives beside the tokens: `buttons.css`, `surfaces.css` and
  `flight.css`. Shared input components live in `apps/web/src/components/inputs/`.
- `apps/web/src/components/Logo.svelte` draws the logomark from SVG outlines;
  fonts are self-hosted.
- The design system has one canonical home, `/lab/ds`. Each app-wide shared
  part has one canonical page at `/lab/ds/<name>`. Instrument-scoped parts are
  grouped on one Instrument parts page because their contracts make sense in
  the context of an instrument. The overview at `/lab/ds` lists
  every page with the files that define the part and the section of this
  contract that describes it. The list is the Design system group in
  `apps/web/src/data/lab-pages.ts`.
- A part that is not on the overview does not exist. Work that needs one
  says so; it does not build the part in place.
- `scripts/check-contracts.mjs` keeps the home true: a design-system page is
  at `/lab/ds/<name>`, names its files and its section, and every shared
  input and stylesheet is named by a page. Pages at an earlier address
  (`/lab/tokens`, `/lab/typography`, `/lab/surfaces`, `/lab/logomark`) are listed in that
  check and retain their addresses. These pages belong to the Design system
  and use its own layout; their historical URLs do not imply Lab ownership.
- Feature specs consume the system. Changing a definition is design work,
  recorded here and demonstrated on its design-system page in the same change.

- [Side sheet](side-sheet/spec.md) owns shared instrument parameter surfaces.
- [Page header](page-header/spec.md) owns shared page identity, navigation and container adaptation.
- [Component frame](component-frame/spec.md) owns the shared boundary and width container for documentation examples.
- [Documents grid](documents-grid/spec.md) owns the responsive layout of Design system documentation.
- [Tray](tray/spec.md) owns the shared navigation component used by the
  Design system layout and its canonical demo. The overview lists Tray in its
  component catalog.
- [Typography](typography/spec.md) owns that domain's definitions and acceptance behavior.
- [Colour roles](colour/spec.md) owns that domain's definitions and acceptance behavior.
- [Surfaces and layers](surfaces/spec.md) owns that domain's definitions and acceptance behavior.
- [Ship part artwork](artwork/spec.md) owns that domain's definitions and acceptance behavior.
- [Identity](identity/spec.md) owns that domain's definitions and acceptance behavior.
- [Actions](actions/spec.md) owns that domain's definitions and acceptance behavior.
- [Input presentation](inputs/spec.md) owns Tabs, RingSlider and thrust-pad presentation.
- [Choice controls](choices/spec.md) owns SegmentedControl, Switch and their usage boundaries.
- [Game field backdrop](game-field-backdrop/spec.md) owns the shared generated
  decorative field and scrim used by the Title Screen, Settings, Top Scores and
  Credits.

#### Surfaces and layers

The [surface contract](surfaces/spec.md) owns cut surfaces, panels and scrims.

### Constraints

- Components and Canvas take visual roles from shared tokens.
- Screens compose shared primitives, with content and layout owned by the host.
- Interface information uses text roles; identity, actions and selection use their matching roles.
- Shared definitions have canonical design-system pages with source files and contract links.
- Game artwork and physics values retain their game-owned definitions.

## Contract

### Definition of Done

- `/lab/ds` lists each shared part's canonical page, real source files and current contract.
- Every shared input and stylesheet is covered by the registry.
- Feature specs consume the current shared names rather than defining local replacements.
- Shared controls and stateful consumers retain their specified keyboard, pointer and touch behavior.

### Regression guardrails

- Token changes retain Canvas parity and theme-color parity.
- Renames update live consumers and registry references together.
- Study-local decisions and historical records retain their own scope.
- Changing appearance preserves authored data and gameplay state.

### Scenarios

```gherkin
Scenario: Find a shared control's owner
  Given the design-system overview
  When I open Choices
  Then the registry names SegmentedControl and Switch source files
  And it links the choice-control contract

Scenario: Open instrument parts
  Given the design-system overview
  When I open Instrument parts
  Then its canonical address is /lab/ds/instrument-parts
  And it documents instrument-scoped parts together on one page
  And its examples distinguish shared instrument parts from specific displays

Scenario: Discover Tray as a shared component
  Given the Design system overview at /lab/ds
  When I inspect the component catalog
  Then it lists Tray from the Design system registry with /lab/ds/tray as its canonical page
  And the entry names apps/web/src/components/Tray.svelte and links the Tray contract
  And Tray appears as a component rather than as a separate design reference

Scenario: Cover a new shared primitive
  Given a shared input is added to the repository
  When repository contracts are checked
  Then its canonical design-system page names its file and governing contract

Scenario: Rename a shared primitive
  Given a shared control has production, Lab and study consumers
  When its public component name changes
  Then every live shared-component import and registry path uses the current name
  And its state contract and input behavior remain intact
```
