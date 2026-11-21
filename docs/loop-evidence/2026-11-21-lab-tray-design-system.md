# Lab tray Design System cleanup

Evidence record, 21 November 2026.

## Intent and scope

The user said the Design System now has its own layout and site in the Lab
experience. They asked to remove Design System components from the Lab tray and
remove its duplicate tray link because a Design System link is already in the
header. Scope here is the Lab navigation rail; the page registry and Lab index
were not changed.

## Change

In the working tree, `LabLayout.astro` filters the `design-system` group out of
the groups rendered in the Lab navigation rail. The Design System layout still
uses the shared registry to render its own navigation. The Lab header's `DS`
link was present in the inspected working tree and remains there.

The header and other unrelated source changes were already present in the
working tree when this change was made. They are not attributed to this loop.

## Checks

- Direct source and diff inspection at `HEAD` `3a19a9bf` plus a dirty working
  tree confirmed the rail renders the filtered `groups` value and that the
  header has a link to `/lab/ds`. Source: `apps/web/src/layouts/LabLayout.astro`.
- No browser or runtime UI inspection was performed for this cleanup.
- No tests or build checks were run.

## Publication

The edit is local and uncommitted. No push, deployment or live verification
occurred.

## Human feedback

The user described the Design System as having its own layout/site and asked:
“on the lab tray, I'd avoid having those design system components. They're
already in design system's tray. And also I can remove the link to the design
system because it's already in the header.” This records the requested
navigation change; it is not evidence of post-change visual acceptance.

## Evidence gaps

There is no browser capture or runtime check for the resulting tray. The broader
working tree contains unrelated edits, so this record describes only the
navigation filter made during this loop and does not establish the authorship
or state of those other edits.
