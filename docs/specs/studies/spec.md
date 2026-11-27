---
generated:
  by: "openai-codex/gpt-6.2-sol"
  at: "2026-11-27T18:59:40Z"
verified: []
---

# Studies

## Context

Authors maintain a design investigation and its publication metadata together.
Readers can find the study during exploration and after closure to see its
findings and evidence.

Studies at `/lab/studies`, [Lab](../lab/spec.md) at `/lab`, and the
[Design system](../factory/design-system/spec.md) at `/lab/ds` are peers.
URL nesting and shared navigation do not determine ownership.

## Blueprint

One build-time Astro MDX content collection publishes the indexed studies
and their metadata from the same source.

### Architecture

Indexed studies live outside `src/pages`. Astro's built-in `glob` loader
uses default filename-derived IDs. The collection's declared `astro/zod`
schema validates non-empty title and question, phase (`problem`,
`exploration`, `readiness` or `scope`), and status (`open`, `blocked`,
`accepted`, `ruled-out` or `stopped`).

One `/lab/studies/[id].astro` route uses `getStaticPaths()` to publish the
entries by ID and `render(entry)` to render their MDX inside `StudyLayout`.
Changing phase or status does not require renaming the file or changing its ID.

The detail page, Studies index and Lab highlights use the same collection
entry for identity and metadata, with no second authored copy. The Studies
index lists all entries with title, question, phase and status. Lab shows
title, question and status for the entries it lists. Both listings use
Astro's `getCollection()` without relying on query order. Lab may limit its
count without promising a named selection or adding curation metadata.

The study layout composes the shared [page header](../factory/design-system/page-header/spec.md)
with Design studies identity, the available study title and peer-site
navigation. The site name links back to the index on study pages. The article
retains its H1, phase, status and question. Prose has a bounded reading width;
figures and examples can use the wider page. Pages support keyboard navigation
at viewport widths of 1280 CSS pixels and up.

Studies owns the investigation and its record. Open and blocked MDX studies
can embed Astro components and hydrated Svelte examples, including Lab
instruments and Design system components. Those tools and components retain
their own contracts and implementations. Experimental styles stay scoped to
the example; simulated or substituted conditions are labeled with it.

### Constraints

- The conversion retains the indexed studies, their metadata, findings,
  captions, media and working examples. Historical study URLs, fragments,
  listing order and Lab selections are not migration requirements. Addresses
  may change but need not. Affected in-repo links are updated to reach their
  intended content; historical addresses do not need overrides or redirects.
- Unlisted archives, standalone reviews, utility artwork and other standalone
  pages stay outside the collection. Sharing the study layout does not make
  a page a collection entry. Standalone pages are not deleted or redesigned
  for this conversion, and the layout does not infer study metadata from
  their URLs.
- Closed studies (`accepted`, `ruled-out` or `stopped`) publish as static MDX
  with versioned media. Their findings, reasons and remaining uncertainty
  render as HTML at build time. Images, recorded clips and image sequences
  can show the evidence, with captions that identify the conditions needed
  to interpret it. Readers can use the record without JavaScript, mounting a
  client component, running a simulation or regenerating evidence from
  current game code. Static layout components and native browser controls
  for recordings are compatible with that requirement.
- Study decisions govern the study. Project adoption settles intent and
  scope in the owning feature spec before changing shared implementation.

## Scenarios

```gherkin
Feature: Studies

  Scenario: Edit a published study's metadata in one place
    Given a study is published from the collection
    When its title, question, phase or status changes in MDX frontmatter and the site is rebuilt
    Then its detail page and Studies index show the updated metadata
    And if the Lab lists it, that listing shows the same title, question and status

  Scenario: Reject invalid metadata
    Given an entry has missing or invalid metadata
    When the site is built
    Then the collection schema reports the problem rather than publishing invalid metadata

  Scenario: Find the indexed studies after conversion
    Given a study was indexed before the collection conversion
    When a reader follows its entry in the Studies index
    Then the study opens with its metadata, findings, captions and media

  Scenario: Use an interactive study
    Given an open study contains a hydrated comparison
    When a reader opens the study from the index with JavaScript enabled and uses the comparison
    Then the comparison responds to its controls
    And the study header links to the Studies index and the peer development sites

  Scenario: Embed an instrument
    Given an open or blocked study uses a Lab instrument to investigate a question
    When the study configures the instrument
    Then the Lab contract governs the instrument
    And Studies owns the investigation and its record

  Scenario: Read a blocked study
    Given an indexed study becomes blocked without renaming its source file
    When a reader follows its index link
    Then the same entry opens at its filename-derived address with blocked status

  Scenario: Close a study
    Given a study becomes accepted, ruled-out or stopped
    When a reader opens its record without JavaScript
    Then its findings, reasons, remaining uncertainty and versioned evidence are available
    And reading the evidence does not depend on live game rendering

  Scenario: Browse the listings after conversion
    Given reviews, archives and utility artwork remain standalone pages
    When a reader browses the Studies index and Lab highlights
    Then none of those standalone pages appears as a collection entry

  Scenario: Adopt a proposal
    Given a study selects a proposal
    When the project adopts it
    Then the owning feature spec records the intended change and its scope
    And study selection alone does not change shared behaviour
```
