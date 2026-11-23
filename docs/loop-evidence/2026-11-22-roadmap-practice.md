# 0.8.0 roadmap practice

## Intent and decisions

The owner redirected a Daily Pop about score submission into documentation work:
give the 0.8.0 roadmap a clear home, with complete feature outcomes and ideas
alongside them. The owner clarified that “done items” means material for later
player-facing release notes, then requested at most one line explaining the
practice in each of README.md and AGENTS.md.

The score-table revamp is a candidate, with one illustrative issue: an equal or
lower submission silently retains the existing best. The owner did not authorize
implementing that suggestion or settle new ranking or retention rules.

## Changes

Documentation-only changes based on `bd137a2312358f8669f4cc04812415d4fd02a94c`:

- [Roadmap](../roadmap.md): draft player-facing release notes, candidate versus
  selected decisions, and the score-table candidate with one possible issue.
- [Docs index](../README.md): entry points and the roles of plans, specs,
  evidence, releases and historical documents. Existing documents were preserved.
- [Repository README](../../README.md) and [agent instructions](../../AGENTS.md):
  one sentence each stating the roadmap practice; README also links the new pages.

## Verification

Checks ran in the shared macOS checkout on 22 November 2026 against the dirty
documentation tree based on the revision above:

- A Python local-link check resolved all 19 links in the docs index and all
  6 links in the roadmap before the final wording edits. The edits retained
  those targets.
- `pnpm exec biome check README.md docs/README.md docs/roadmap.md` passed.
- `git diff --check` passed after the roadmap clarification and instruction edits.
- At closure, `pnpm exec biome format --write .` reported 902 files and no fixes;
  `pnpm lint` passed across 1,232 files with no fixes.

Results above are tool output from this conversation, not retained log artifacts.
Gameplay, browser and backend checks were not run for these documentation changes.
No product acceptance or release readiness is inferred.

## Publication

The owner requested closure, commit and push. At record creation the changes are
local and uncommitted; commit and push outcomes will be reported in the handover.
No deployment or live verification is part of this loop.
