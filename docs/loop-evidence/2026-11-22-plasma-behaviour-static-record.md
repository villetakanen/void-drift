# Plasma behaviour static record — closure evidence

## Intent and scope

The designer started a janitor pass, then asked for the historic plan for summarizing closed studies and noted that its file list was likely stale. They authorized first-mate coordination for the oldest unsummarized study, then authorized committing and pushing the result. The scope was one archival conversion, not new Plasma tuning or adoption of study proposals. The [original study closure](2026-11-01-plasma-behaviour-closure.md) and the [earlier archive batch](2026-11-18-old-studies-static-records.md) are separate records.

The selection worker reported that the stopped Plasma behaviour page was first added in `bafa2dea`, before Path Instrument (`a1b08ca0`) despite their order in the [historical ledger](https://github.com/villetakanen/void-drift/blob/ea287bae/docs/plans/2026-11-17-old-studies-to-static-records.md). The earlier Base movement: ion page was already MDX. The [closed-page contract](../specs/studies/spec.md#closed-pages) was the basis for static MDX and readability without JavaScript.

## Delivered

Commit [`8cafa66c`](https://github.com/villetakanen/void-drift/commit/8cafa66c10c89757553edd1b56ed555699df5a3e) replaces the Astro page with the [static MDX record](../../apps/web/src/pages/lab/studies/plasma-behaviour-2026-11-01.mdx) at the same route, retains the stopped status and five original anchors, adds ten PNGs, and removes seven study-only files. The page identifies `9fd97337` as the pre-conversion source. The same checkout snapshot includes concurrent Tray and design-system changes; those changes are not findings of this study.

The page captions identify the images as reconstructions captured on 22 November in Chromium at 1440 × 1000 CSS px, device scale 1. The original trajectories and early unassisted states were not recovered. The surviving bench's dashed family-ceiling trace does not represent the powered cruise ceiling used by the later impulse code it calls. The page states that limitation separately from the historical observations. No fixture was repaired. A separate editorial reviewer flagged two ambiguous passages; the worker clarified the distinction between main-engine thrust and stabilizer response and attributed the 0.10 s trial candidate to the original closure. No human playtest or archive review feedback was supplied in this loop.

## Reported checks and publication

| Run and source | Reported outcome |
| --- | --- |
| Conversion and wording follow-up, shared Mac checkout before the commit; worker reports and temporary `/tmp/void-plasma-verify.cjs` | Chromium against shared preview at 1280 × 1000 and 1440 × 1000 with JavaScript disabled: all ten PNGs decoded, native disclosures worked, original anchors and the index entry resolved, and no browser errors or overflow were reported. The wording follow-up repeated the JavaScript-off and Astro checks. |
| Full checkout snapshot before committing, commit worker report | `pnpm exec biome format --write .` made no changes; `pnpm lint`, `pnpm check:types`, `pnpm test` (436), `pnpm check:contracts` (21 factory tests), `pnpm build`, and both commit hooks passed. Biome did not check MDX directly. The build emitted a Vite chunk-size warning. |
| Full snapshot, commit worker report | Chromium shared-preview checks at 1280, 1440 and 1920 px included the archive images and Tray navigation. `pnpm check:specs docs/specs/factory/design-system` exited 1 with ten provenance findings, reported as unchanged from the baseline. |

The worker reported pushing `8cafa66c` to `origin/main` and confirming the remote SHA. At closure, local Git inspection confirmed the same commit at `HEAD` and the `origin/main` tracking ref. Deployment and hosted verification were not checked. Browser and command outcomes above come from worker reports, not closure reruns; the browser checker was temporary, and no retained per-run logs or dirty-tree fingerprints were identified. The versioned MDX, images and Git diff are directly inspectable.
