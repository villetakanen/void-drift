---
generated:
  by: "<producer>/<version>"
  at: "<RFC 3339 timestamp>"
verified: []
---

# [Feature name]

<!--
verified: human verification only; one { by: "human:<id>", at: <actual confirmation date> }
event per actual human confirmation. New specs start empty; model and source
checks belong in the handover. No status or duplicate title metadata.

A spec is the state: the durable truth for one feature. Edit it in place
when the feature changes; git holds the history.

Path: docs/specs/<node>/spec.md, kebab-case directory, file always named spec.md.
Sub-spec: docs/specs/<node>/<child>/spec.md. Folders express the hierarchy.
Attachment: docs/specs/<node>/attachments/<file>, linked from this spec.
Length guides review. Above 120 lines review scope and duplication.

Delete this comment when you fill the template in.
-->

## Blueprint

How the feature works.

### Context

Why this feature exists, who uses it, and what it sits next to.

### Architecture

Contracts, data models, dependencies, and the files or modules that own the
behaviour. Link to sources, dependencies and owned attachments where relevant.

### Constraints

Stated as positive facts ("all dates are stored in UTC"), one per line.

- …

## Contract

How we know the feature works.

### Definition of Done

- …

### Regression guardrails

Behaviour that must keep holding whenever this feature changes.

- …

### Scenarios

```gherkin
Scenario: [name]
  Given …
  When …
  Then …
```
