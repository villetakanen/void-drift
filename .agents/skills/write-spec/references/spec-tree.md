---
generated:
  by: codex/gpt-6
  at: "2026-11-19T09:52:56Z"
verified: []
---

# Suggest a spec tree

Read this when asked which specs a repository should have.

## What a node is

A node is a feature domain: behaviour that changes independently of the rest
and that a user or caller could name ("checkout", "password reset", "export
to CSV"). Source folders are a poor guide, because one feature often spans
several folders and one folder often serves several features.

Test each candidate with two questions:

- Could a user or caller name it without knowing the code?
- Could it change while its neighbours stay the same?

Keep a candidate only when both answers are yes.

## Rules

- Folder nesting expresses parentage, including through grouping folders. Each spec node is `docs/specs/<node>/spec.md`, with a kebab-case directory name.
- Depth is at most 3: `docs/specs/a/spec.md`, `docs/specs/a/b/spec.md`,
  `docs/specs/a/b/c/spec.md`.
- Start small. Propose few top-level nodes; three to seven suits most
  repositories.
- Add a child when it owns independently changing behaviour and scenarios.
- Name nodes after behaviour ("billing"), not after technology ("stripe")
  or layers ("backend").
- In a repository that already has specs, extend the existing tree, and ask
  before adding a top-level node.

## Steps

1. Read the README, the entry points, the public interface (routes,
   commands, exported API), the tests and any existing specs.
2. List the behaviours a user or caller could name.
3. Group related behaviours into nodes using the two questions above.
4. Review scope and likely duplication for each proposed node.
5. Write the proposal in the format below.
6. Create nothing. Wait for a human to approve or change the tree.

## Proposal format

One fenced tree of spec paths, one line of purpose per node:

```text
docs/specs/
  auth/spec.md               Sign-in, sign-out and sessions.
  billing/spec.md            Plans, invoices and payment status.
    billing/invoices/spec.md Invoice numbering, PDFs and delivery.
  export/spec.md             CSV and JSON export of user data.
```

After the tree, add at most a few sentences on any choice a reviewer might
question, such as why two folders share one node.

If no one can approve the tree in this run, deliver the proposal anyway and
list your assumptions in the reply. The tree still waits for approval before
any spec is created.
