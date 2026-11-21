---
name: write-spec
description: Create or update a living spec in docs/specs/ for one feature, or suggest a spec tree for a repository. Use when a feature is new, when its behaviour is about to change, when existing behaviour has no spec, or when asked which specs a repository should have.
metadata:
  upstream: "futurice/fab v0.1.0 (b97ac86), prefabs/skills/write-spec"
---

# Write a living spec

A feature spec is its present contract. The Blueprint explains how the feature works. The Contract gives a reader observable ways to check it. A work item carries the change.

## Decide what the request needs

Read the [project instructions](../../../AGENTS.md), the owner’s request, the relevant implementation and neighbouring contracts in the folder tree. For study proposals, establish adoption and scope with the designer before changing the contract. Authoring covers specs and their attachments. Implementation belongs to the implementing task.

- **Suggest a tree.** Follow [the tree guide](references/spec-tree.md). Put the proposal in the reply unless the owner names a file. Wait for approval before creating any spec directory.
- **Create.** For a feature with no governing spec, select a kebab-case node at `docs/specs/<node>/spec.md`. In an existing tree ask before adding a top-level node. Start from [the template](template.md).
- **Update.** An explicit owner decision about changed behaviour authorizes rewriting the affected clauses and scenarios in place. Preserve actual prior human verification events; changed text needs its own human confirmation.
- **Report.** If code and an established Contract (including a legacy spec) disagree and intent is unsettled, give the starting condition, action and competing outcomes. Leave the spec and code intact for the owner’s decision. For maintenance already covered by the Contract, identify it in the handover and leave the spec tree alone.

When reconstructing intent from an existing feature, trace its entry points, Zod validation, persistence and boundary behaviour. For Firestore, check the path and access rules in `firestore.rules`. Identify any intent inferred from implementation. Use concrete examples to resolve ambiguity. In unattended work, list assumptions in the handover. Refer unresolved conflicts to the owner.

## Write the current state

Use the template headings in order. The feature name lives only in the H1 (`# Feature name`), without a `Spec:` prefix. Do not add duplicate frontmatter `title` metadata or a `status` field; remove these fields when updating a spec. Cover each rule from the owner’s brief with an independently checkable scenario in a fenced `gherkin` block. Use plain statements for Definition of Done. Keep implementation progress in delivery records. Write constraints as positive facts. Keep one canonical home for each rule, and link code-owned schemas where they live. Remove template comments and placeholders. Git carries history.

A complete short spec stands alone. Around 120 lines, review duplication and ownership. Split independently changing behaviour into a child folder with its own Contract. Folder nesting expresses parentage. Add a cross-reference when a specific rule or dependency needs one. Put bulky reference data in a linked attachment. Explain a necessary long spec at handover. Follow [the splitting guide](references/splitting.md).

## Record authorship and review

On creation and substantive edits set `generated.by` to the actual producer (`producer/version` for a tool or model, `human:<id>` for a person) and `generated.at` to the current RFC 3339 timestamp with timezone. Use the actual clock. Formatting and link repairs preserve generation metadata. Use the same provenance on Markdown/MDX attachments and written proposals.

New documents start with `verified: []`. This field records human verification only: each event uses `by: human:<id>` and the actual confirmation date in `at`. Record an event only when that person actually confirmed the document. Retain actual prior human events; they do not automatically verify later edits. Model review, source inspection and automated checks belong in the handover, never in `verified`. Only an explicit human decision authorizes implementation; verification does not itself grant that authority, and no spec status field represents it.

For a legacy spec, migrate only dated, attributable human checks from `reviewed_by` to `verified`. Use `human:<id>` for the documented person and preserve the actual date at its known precision. Do not turn agent checks, source checks or ambiguous attributions into human verification. Preserve undated human attribution as legacy metadata and disclose the missing date in the handover. Preserve known legacy generation metadata on a migration-only edit; on a substantive edit record the new producer and actual time. Never invent a human confirmation or its date.

## Hand over

Check each scenario against the owner’s brief. Run `pnpm check:specs docs/specs/<node>` for the edited subtree and `pnpm check:contracts` for repository references and Lab anchors. The full-tree spec check is advisory during migration. Give the changed paths, assumptions and any outstanding decision. Identify any human decision still needed before implementation. An authorized amendment lands in the same commit as the implementing change.
