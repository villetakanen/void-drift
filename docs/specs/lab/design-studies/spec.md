# Study pages in the Lab

The Lab publishes design studies at stable URLs. A reader can return to the same
page during exploration and after closure to see the findings and their evidence.

## Routes and metadata

The [study index](../../../../apps/web/src/pages/lab/studies/index.astro) links
each registered study to `/lab/studies/<slug>` and shows its title, question,
phase and status. The [registry](../../../../apps/web/src/data/studies.ts)
validates those fields with Zod. The page filename matches the registered slug.
Changing phase, status or source format preserves the URL.

## Page source and presentation

Study pages live in `apps/web/src/pages/lab/studies/`. Open and blocked pages
can use MDX or Astro and can embed interactive examples. Experimental styles
are scoped to the example, and simulated or substituted conditions are labeled.

[StudyLayout](../../../../apps/web/src/layouts/StudyLayout.astro) supplies the
study header and navigation back to the index and Lab. Prose has a bounded
reading width. Figures and examples can use the wider page. The page supports
keyboard navigation and the Lab’s minimum viewport width of 1280 pixels.

## Closed pages

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
