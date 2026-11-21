# Ranked initials · exploration through 02.4 · 20 November 2026

The [study](../../apps/web/src/pages/lab/studies/ranked-initials-2026-11-20.mdx) concerns only the initials field in ranked run complete. The surrounding dialog, scoring and submission are outside scope. The designer said “good work: we'll continue this a bit latr.” This closes the work session, not the study or an adoption decision.

The designer preferred the distinct faces in 02.3 but found the lettering small. After the period references in 02.4, the designer proposed a combined width of 70–100% of Save Score for the three faces, gaps included, within the design system. No width or editing mechanism was selected. The Addams Family reference shows an award, not initials entry.

Commit `03be4a0e` includes the Lab study, captures, project-local question reviewer and shorter exploration-writing guidance. It was pushed to `origin/feat/0-7-0`; no production changes or deployment. The registry remains open in exploration.

Checks on the shared Mac checkout: the independent question review passed with findings (recorded in section 01). During 02.2 a Playwright check at localhost:4321 typed ACE, changed it to AXE with the flippers and exercised local Save; Svelte diagnostics passed on that intermediate tree. During 02.4 a browser check found both reference images loaded and two sketches rendered. `pnpm lint` passed on the precommit tree; staged Biome and commitlint passed at commit. The browser checks were one-off terminal runs, not retained suites. No screen-reader evaluation, deployed-site check or final usability conclusion is recorded.
