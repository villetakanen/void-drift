---
name: write-spec
description: Create or amend a living feature spec, resolve questions about expected behaviour, or propose how to organise a repository’s specs.
generated:
  by: openai-codex/gpt-6
  at: "2026-11-26T10:18:26Z"
verified: []
---

# Write a living spec

A living spec tells a reader what one feature is for and how it should behave.

## Decide what to write

Read the request, the governing spec and its neighbours, and enough of the implementation to understand what happens today.

- When the user changes the expected behaviour, amend the existing spec in place. If the spec already covers the request, point to the relevant passage.
- For a new feature, write `specs/<feature>/spec.md`. Use a kebab-case directory name. Ask before adding a new top-level node to an existing tree.
- When the code and spec disagree and intent is unclear, give a concrete example that distinguishes the outcomes. Ask which is intended. Preserve the disputed text and code until the user decides. Leave unsettled new rules unwritten.
- When asked how to organise a repository’s specs, use the [guide to organising specs](references/spec-tree.md). Propose paths and explain what each spec would cover. Create the files once the user approves the layout.

## Write the spec

Use the feature name as the title. Take the required headings, their order and the scenario syntax from [template.md](template.md).

- Explain who needs the feature and what they are trying to do. One sentence often suffices.
- State the agreed behaviour. In a Blueprint, write a single rule directly under the heading. Use `### Architecture` to explain responsibilities or interfaces and `### Constraints` for limits or rules that hold across cases. Either is optional. Link to a source file or schema when it answers a reader’s question.
- Give each scenario a name, a starting condition, an action or event and an observable outcome. When the template uses fenced Gherkin, keep the scenarios in one block and repeat the spec title after `Feature:`. Keep boundary examples that show what happens at or beyond a limit.

Use the brief, governing spec and explicit decisions to establish expected behaviour. Put undecided outcomes in the handover. Carry a regression guardrail forward as a general rule or as the outcome of a particular action. For example, keeping a details panel open after switching projects belongs in the switching scenario. Preserve distinct promises from older checklists. Keep acceptance criteria, checkboxes, task lists and test instructions out of specs.

Split out a part when it can change independently. Link parent and child both ways. Use the [guide to splitting specs](references/splitting.md) for child specs and bulky attachments.

## Record and hand over the change

Every spec must include the Open Knowledge Format fields `generated` and `verified` in its frontmatter. Preserve any additional fields the project uses. For a substantive edit, including a rewrite from an older format into rules and examples, record the actual producer and current RFC 3339 time in `generated`. Formatting and link repairs preserve generation metadata. Use the same provenance on written proposals and Markdown attachments.

A new spec starts with `verified: []`. When editing an existing spec, carry its latest human check into `verified`, including one recorded under the older `reviewed_by` field. Use `by: human:<id>` and keep the original date precision. A new human check replaces that entry. It covers the text only when dated at or after generation. Report gaps in attribution.

Run host checks. Identify the changed spec, any open decision and text awaiting verification. Implementation requires explicit authorization. When implementing an agreed behaviour change, include its spec amendment in the same commit.
