# Design studies as an Astro content collection

Open planning document, started 27 November 2026. It maps the collection
conversion and settles nothing unless a point is marked agreed with a date.

## Outcome

The collection conversion is implemented on Astro 7.4.13, with 63 indexed
studies in the collection. After the Sentry compatibility patches, the ordinary
build, type check, repository check, lint, Studies spec check and
`git diff --check` passed. These checks do not establish human verification or
a release.

Sentry-configured release preparation still has the preexisting Astro 5 baseline
blocker on the copied static drone-launcher record: its `sim.js` lacks a source
map and Debug ID. See the [development guide](../development.md) for the
strict upload gate and the unresolved correction.

## Where this started

Authors should be able to edit a study's publication metadata in the same
file as its findings. At the source-format baseline `b2e9c5a6`, the top-level
study sources in `apps/web/src/pages/lab/studies/` contained 63 indexed MDX
pages: the index adapter `apps/web/src/data/study-index.ts` imported frontmatter
for 33, while the registry `apps/web/src/data/studies.ts` owned metadata for
the other 30. The separate MDX migration is the source-format baseline, not
part of this conversion.

At that baseline, the adapter maintained a hand order. The [Studies index](../../apps/web/src/pages/lab/studies/index.astro)
used the whole list, and the [Lab index](../../apps/web/src/pages/lab/index.astro)
took its first four. [StudyLayout](../../apps/web/src/layouts/StudyLayout.astro)
also fell back to a registry lookup by URL basename. That made the
[rock-atmospheres review](../../apps/web/src/pages/lab/reviews/rock-atmospheres-2026-11-15.astro)
and [scout-firefly review](../../apps/web/src/pages/lab/reviews/scout-firefly.astro)
inherit headers from their namesake studies at that baseline.

## Working direction

**Agreed 27 November 2026:** The old listing order, the featured four, and
historical study URLs, slugs and fragments do not need to be preserved. An
address can change, but there is no reason to change one that already works
with the defaults. No slug manifest, overrides, redirects or backfill for
parity; no hand order, custom ranking or wiring to preserve headers inherited
by basename on standalone reviews.

The proposed [Studies spec](../specs/studies/spec.md) follows the
[official Astro content collection guide](https://docs.astro.build/en/guides/content-collections/),
reviewed by the architect against Astro 7.4.13. The direction is one build-time
MDX collection outside `src/pages`, the built-in `glob` loader with default
filename-derived IDs, and a declared schema using `astro/zod`. One
`/lab/studies/[id].astro` route uses `getStaticPaths()` and `render(entry)`
inside `StudyLayout`. The page and both listings read the same entry data
through Astro's collection APIs instead of a registry and import adapter.
Neither listing relies on query order; Lab may show a limited subset without
promising named picks or adding curation metadata. A phase or status edit
need not rename the file or change its ID.

The [Field Guide](../../apps/web/src/pages/field-guide/[slug].astro) is a
local precedent for rendering collection entries. Its explicit slug,
custom ID and loader wrapper in [`content.config.ts`](../../apps/web/src/content.config.ts)
are not defaults to copy for Studies, and the Field Guide is not part of this
conversion.

**Agreed 27 November 2026:** Moving off Astro 5 to current stable Astro
mainline is required scope for this work, not a follow-up. The
[lockfile](../../pnpm-lock.yaml) currently resolves Astro 5.16.5. At
implementation start, resolve the target from npm's `astro@latest` and the
[official Astro releases](https://github.com/withastro/astro/releases).
Astro 7.4.13 was the latest observed during architect review and requires
Node >=22.23.4; that is a reference point, not a version pin. The selected
release's Node requirement and compatible official integrations (including
MDX, Svelte and Astro Check) need to line up across local builds, CI and
deployment tooling where applicable. The [web package](../../apps/web/package.json)
and [Astro config](../../apps/web/astro.config.mjs) also bring Sentry into
that compatibility surface. The [development guide](../development.md)
currently documents Node 22+ and no hosted CI.

The upgrade crosses [Astro 6's change to Zod 4](https://docs.astro.build/en/guides/upgrade-to/v6/)
and [Astro 7's Markdown default change](https://docs.astro.build/en/guides/upgrade-to/v7/).
Those changes can affect existing collection schemas and rendered content
without moving a single study. That compatibility work belongs in this plan;
the Studies spec does not need a framework version or patch policy.

## First deliverable: the same studies from one source

Readers can still find the indexed studies and read their findings, captions
and media; authors keep each study's title, question, phase and status with
its content. The conversion is not a redesign. Open and blocked studies can
still embed Astro and hydrated Svelte examples, with their existing owners.
The [Mercury study](../../apps/web/src/content/lab/studies/mercury-2026-11-12.mdx)
shows what a source move touches: sibling CSS, JSON and Svelte imports, client
hydration, and public media. Closed records still need to convey their findings
and versioned evidence without JavaScript.

The three [unlisted archive pages](../../apps/web/src/pages/lab/studies/archive/),
[standalone reviews](../../apps/web/src/pages/lab/reviews/),
[utility artwork](../../apps/web/src/pages/lab/utility-artwork.astro) and other
standalone pages stay outside the collection. Sharing `StudyLayout` does not
make a page a collection entry. Removing the basename lookup need not preserve
an inherited review header; it does not call for deleting or redesigning
those pages.

Existing in-repo links that would break if a route or fragment changes need
updating at the source. For example, the [Mercury review](../../apps/web/src/pages/lab/reviews/mercury-2026-11-12.astro)
links to the study's `#02-1` and `#02-2`, and the
[Scout Firefly archive](../../apps/web/src/pages/lab/studies/archive/scout-firefly-rounded-bodies.mdx)
links to the study's `#six-compact-hulls`. Updating affected links keeps the
reference useful without making the old destination a route contract. Links
whose destinations still work need no change.

This conversion does not retire instruments or reshape evidence (see the
[static-record plan](2026-11-17-old-studies-to-static-records.md)), revise the
[designer-led study method](2026-11-24-designer-led-studies.md), or adopt study
proposals into production. [Lab](../specs/lab/spec.md) and the
[shared page header](../specs/factory/design-system/page-header/spec.md) are
neighbouring contracts; the proposal does not change their ownership or
navigation.

## Open engineering questions

Do the generated IDs and routes expose any actual collision with one another
or with the standalone pages? Schema validation is essential, but it is not
a route collision check. The build and generated pages would show whether
there is a concrete overlap. If there is one, can it be resolved locally by
adjusting the affected filename or route, or does it expose a recurring risk
worth a targeted guard? There is no global collision policy to add for
historical parity, and no assumption that Astro rejects every route conflict.

Is there a reason to prefer a roughly two-week soak over the newest stable
patch at implementation start? That is an option, not a hard policy or a
security benefit in itself. If choosing it, look for the nearest stable patch
on the current mainline that is at least 14 days old and not known to be
vulnerable. Do not defer a needed security patch or choose a prerelease or
older major just to meet the age target. If no suitable mature patch exists
on current mainline, discuss the choice rather than inventing a policy.

## What would inform review

Verify the framework upgrade with the studies still in place: Astro check, a
production build on the chosen Node version, and a look at existing Markdown,
MDX and Field Guide output would give a baseline for telling upgrade
regressions apart from collection-move regressions.

Compare the indexed inventory by study content and metadata, not URL,
fragment, order or Lab selection. An Astro check and production build would
surface schema and import issues; the generated pages would help reveal route
or link problems. Biome would cover code changes. The shared preview at
supported Lab widths (1280 CSS pixels and up) would show whether a
representative active instrument hydrates and responds, a closed record still
shows its evidence with JavaScript off, and links affected by any address
changes reach their intended content. The proposed spec is for verification
before implementation.
