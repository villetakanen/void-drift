---

generated:
  by: "codex/gpt-6"
  at: "2026-11-24T18:34:46+00:00"
verified: []
---

# Studies

## Blueprint

### Context

Studies provides design investigations and their published records at stable URLs. A reader can return to the same
page during exploration and after closure to see the findings and their evidence.

Studies at `/lab/studies`, [Lab](../lab/spec.md) at `/lab`, and the
[Design system](../factory/design-system/spec.md) at `/lab/ds` are peers.
The path is a convention, independent of ownership. Studies owns investigations
and their records. It can embed Lab instruments and consume Design system
components; those tools retain their own contracts and implementations.

### Architecture

#### Routes and metadata

The [study index](../../../apps/web/src/pages/lab/studies/index.astro) links
each registered study to `/lab/studies/<slug>` and shows its title, question,
phase and status. The [registry](../../../apps/web/src/data/studies.ts)
validates those fields with Zod. The page filename matches the registered slug.
The Flight Deck weapons study owns its title, question, phase and status in
its MDX frontmatter. The layout validates that metadata with the same Zod
schema; the combined [study index data](../../../apps/web/src/data/study-index.ts)
reads it for the Studies and Lab indexes. It has no duplicate registry entry.
Other studies retain their registry metadata. This limited migration does not
introduce a content collection.
Changing phase, status or source format preserves the URL.

#### Page source and presentation

Study pages live in `apps/web/src/pages/lab/studies/`. Open and blocked pages
can use MDX or Astro and can embed interactive examples. Experimental styles
are scoped to the example, and simulated or substituted conditions are labeled.

[StudyLayout](../../../apps/web/src/layouts/StudyLayout.astro) supplies the
study header and navigation to the index and peer development sites. Prose has a bounded
reading width. Figures and examples can use the wider page. The page supports
keyboard navigation and a minimum viewport width of 1280 pixels.

The shared [page header](../factory/design-system/page-header/spec.md) supplies
Design studies identity, the available study title and peer-site navigation.
The layout retains the article H1, status and question beneath it.

#### Closed pages

A study with status `accepted`, `ruled-out` or `stopped` is published as
static MDX with versioned media. The MDX renders the findings, their reasons
and any remaining uncertainty as HTML at build time. Images, recorded clips
and image sequences can illustrate the evidence. Captions give the conditions
needed to interpret it.

A reader can follow the record with JavaScript disabled. Its evidence remains
available without mounting a client component, running a simulation or regenerating
the example from current game code. Static layout components and native browser
controls for recordings are compatible with this format. When a blocked study
appears in the index, its existing page remains available at the same URL.

### Constraints

- Routes remain stable across study phases, statuses and source formats.
- Experimental substitutions are identified with their examples.
- Study decisions govern the study. Project adoption settles intent and scope
  in the owning feature spec before changing shared implementation.

## Contract

### Definition of Done

- Registered studies have stable pages with their question, phase and status.
- Open studies can embed tools; closed records remain readable without JavaScript.
- Embedded instruments and shared components retain their original owners.

### Regression guardrails

- URL nesting and shared navigation preserve peer ownership.
- Closed evidence remains independent of changes to live game rendering.

### Scenarios

```gherkin
Scenario: Read the weapons study metadata
  Given the Flight Deck weapons study owns its metadata in MDX frontmatter
  When its title, question, phase or status changes
  Then its page and index entries use that same metadata
  And other studies continue to use their existing registry entries

Scenario: Embed an instrument
  Given a study uses a Lab instrument to investigate a question
  When the study configures the instrument
  Then the Lab contract governs the instrument
  And Studies owns the investigation and its record

Scenario: Close a study
  Given a study becomes accepted, ruled-out or stopped
  When its page is opened without JavaScript
  Then its findings and versioned evidence remain available at the same URL

Scenario: Adopt a proposal
  Given a study selects a proposal
  When the project adopts it
  Then the owning feature spec records the intended change and its scope
  And study selection alone does not change shared behaviour
```
