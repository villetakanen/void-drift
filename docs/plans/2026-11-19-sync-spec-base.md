# Sync the living spec base to write-spec

Use this brief in the next session to migrate the contracts under `docs/specs/`. Preserve the design decisions, examples and externally referenced anchors already there. The scope is spec authoring and references to those specs. A discrepancy with the game is a question for the designer.

## Starting point on 19 November 2026

The [installed writer](../../.agents/skills/write-spec/SKILL.md) adapts Fab v0.1.0. Folder nesting expresses parentage. Plain bullets express acceptance criteria. Review metadata describes the text, while delivery evidence records implementation progress.

| Tree    | Spec files | Other documents to account for                                                |
| ------- | ---------: | ----------------------------------------------------------------------------- |
| Game    |         29 | Render's `world.md`, `fx.md` and `lfx.md`, plus the landing page's `hints.md` |
| Lab     |         12 |                                                                               |
| Factory |          5 | Monorepo's `scaffold.md`                                                      |

The local checker reported 527 findings across 46 specs. These included 463 heading findings, 46 provenance findings and 11 scenario findings. A single renamed heading can produce two findings. Of the 46 specs, 32 exceeded Fab's advisory 120-line review point. Recount from the working tree when starting or resuming.

## Execution

1. **Inventory the live tree.** Run `git status --short`, `rg --files docs/specs | sort` and `pnpm check:specs`. The command exits 1 while findings remain. Identify active edits in the shared checkout and start with a different node if needed. Track completed paths, deferred decisions and remaining branches in the session handover.

2. **Start with the targeting bench.** Its 100-line contract already has scenarios, plain criteria and nearly all the expected headings. Read its owning code and tests. Convert the text using the installed template. Its legacy frontmatter names a generator and human reviewer but gives no review date. Preserve that attribution, record who authored the migrated draft and when, and leave any new human verification for the actual reviewer. Run `pnpm check:specs docs/specs/lab/targeting-bench`. Compare the before/after contract clause by clause. A teammate should be able to derive an observable check from a bench scenario. [Targeting bench](../specs/lab/targeting-bench/spec.md)

3. **Work through bounded branches.** Finish the remaining Lab, Game and Factory nodes in manageable batches. Read the existing contract and relevant implementation before editing each node. Preserve thresholds, units, defaults, scope, failure behaviour and cross-feature dependencies. Fit the material under the template headings. Preserve useful named subsections and their anchors with fourth-level headings. Find incoming paths and fragments with `rg` before renaming or moving anything. Remove navigation whose sole purpose is restating folder nesting. Retain cross-references that explain which contract owns a rule. Grouping folders such as `game/world/` can stay directories without a synthetic spec.

4. **Review large and companion documents by ownership.** The design-system spec supplies anchors consumed by the Lab registry. The three render companion documents contain behavioural contracts. Inspect these alongside their consumers before deciding whether to keep them in place, fold text into an existing contract, or give independently changing behaviour a child spec. Use linked attachments for bulky reference material. Link to schemas where the code owns them. Preserve or update incoming references in the same batch. A cohesive long spec can stay long. [Design-system registry](../../apps/web/src/data/lab-pages.ts) · [Render contract](../specs/game/render/spec.md)

5. **Handle intent and approval separately.** For unresolved differences, report the starting condition, action, specified result and observed result. Leave the disputed rule and implementation intact and continue with independent nodes. A study proposal requires the designer's adoption and scope decision. Newly authored and substantively amended specs stay draft until a person verifies the current text and explicitly approves it. Preserve known generation and review history at its documented precision. Human playtesting stays outside the repo.

6. **Verify each batch and close the migration.** Run `pnpm check:specs docs/specs/<branch>` on each migrated subtree and `pnpm check:contracts` for repository links, Lab anchors and factory tests. The link checker reads tracked Markdown, so also inspect references from newly created documents. Re-run `pnpm check:specs` on the whole tree at the end. Report converted paths, the disposition of the five companion documents, any unresolved behaviour or review decisions, and both command results. Format migration is complete when the whole-tree spec check and contract checks pass and each original rule has an identifiable home. Drafts may still await human approval.
