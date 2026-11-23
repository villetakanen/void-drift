---
generated:
  by: codex/gpt-6
  at: "2026-11-19T09:52:56Z"
verified: []
---

# Split a spec

Read this when a spec is over 120 lines, or when a part of a feature
clearly needs its own spec.

## Choose: sub-spec or attachment

- Behaviour goes to a sub-spec: a part with its own rules and its own
  scenarios.
- Data goes to an attachment: schemas, sample payloads, data tables, long
  examples, diagrams.

## Sub-spec

Path: `docs/specs/<node>/<child>/spec.md`. Depth stays at most 3.

1. Pick the part that has its own behaviour and its own scenarios.
2. Create the child from `template.md` and fill it as a full spec. It
   uses the same format and provenance rules as its parent.
3. Start the child’s Context with the feature’s purpose:

   ```markdown
   ### Context

   Invoices turn a paid order into a
   numbered PDF and send it to the customer.
   ```

4. Remove the moved rules from the parent. The folder structure shows the relationship. Keep a reference only where the text depends on a specific spec.

5. Move the parent's scenarios and guardrails for that part into the child.
   The parent stops describing what the child owns, so each fact has one
   source of truth.
6. Check both specs for complete coverage. A concise parent can stand alone.

## Attachment

Path: `docs/specs/<node>/attachments/<file>`.

1. Move the bulky material into the attachment file.
2. Keep the rule in one sentence in the spec, and link the attachment from
   the Architecture section.
3. Link every attachment file from its spec. An unlinked file is invisible
   to a reader.

Give Markdown and MDX attachments their own generated provenance and `verified: []`.
Record only actual human confirmations of that attachment; do not copy the parent’s
verification events as approval of a new attachment.

Material that already lives in the repository, such as a schema file the
code reads, stays where it is. Link to it from the spec; a copy in
`attachments/` would be a second source of truth.
