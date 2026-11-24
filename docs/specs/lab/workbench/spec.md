---
generated:
  by: "openai/gpt-6.2-sol"
  at: "2026-11-24T11:06:10Z"
verified: []
---

# Lab workbench

## Blueprint

### Context

The [Lab](../spec.md) workbench gives developers a consistent place to inspect
and adjust game assets outside normal play. Each tool has its own address and
uses shared game drawing and simulation where applicable.

### Architecture

- The Lab index at `/lab` and the shared navigation use the registry in
  `apps/web/src/data/lab-pages.ts`. Astro pages under `apps/web/src/pages/lab/`
  host the tools; entity pages such as `/lab/entities/star` live under `entities/`.
- The Tray and Lab index group tools for authoring design drafts under
  **Design tools**, separate from **Tools** for inspection, measurement and
  experimentation. Mount planner is a Design tool.
- `apps/web/src/layouts/LabLayout.astro` places the full-width page header above
  the [Tray](../../factory/design-system/tray/spec.md), main stage, and optional
  inspector. The Tray, stage and inspector scroll independently. Wide tools can
  omit the inspector rail. Interactive tools hydrate their controls and previews
  on the client.
- The former Ships workbench address, `/lab/entities/ship`, redirects to
  [Mount Planner](../../game/hangar/mount-planner/spec.md) for inspecting hulls
  and fitted parts. It has no separate entry in the Lab index or Tray.
  [Ship Tuning](../motion-instrument/spec.md) remains the tool for comparing
  fitted motion under controlled burns.

### Constraints

- The workbench shares production drawing functions rather than duplicating them.
- Tools use the game systems they need directly, outside the player-facing shell.

## Contract

### Definition of Done

- Visiting `/lab` loads the Lab index with links to the registered tools.
- The old Ships address reaches Mount Planner without loading a second ship inspector.

### Regression guardrails

- Inspector updates stay local and do not reload the page.
- Workbench tools and their interactive code remain separate from the game entry point.

### Scenarios

```gherkin
Scenario: Find Mount planner in the Lab
  Given I open the Lab index
  Then Mount planner appears under Design tools in the index and the Tray
  And it does not appear under Tools

Scenario: Follow a bookmark to the former Ships workbench
  Given a bookmark to /lab/entities/ship
  When I open it
  Then I arrive at /lab/mount-planner
  And the Lab Tray marks Mount planner current without listing a separate Ships destination

Scenario: Inspect an asset outside the game
  Given a Lab asset tool with an interactive inspector
  When I change an exposed parameter
  Then the preview updates without reloading the page or starting a game
```
