---
name: design-study
description: Create and iterate interactive Void Drift design studies from conversation, preserving rationale and promoting accepted results into shared UI. Use for design exploration without gameplay testing.
---

# Design study

Read docs/specs/design-studies.md and docs/design.md. Inspect relevant production
screens and canonical Lab examples before proposing alternatives.

Translate the conversation into a bounded question, contexts, constraints, and
unresolved decisions. Start with situations and interaction structure before styling.
Clarify consequential ambiguity; proceed on routine choices with visible assumptions.

Add validated metadata in apps/web/src/data/studies.ts. Create an Astro page at
/lab/studies/<slug> using StudyLayout; use scoped Svelte 5 components for interactive
examples. Keep stable URLs across discussion rounds. Reuse current primitives where
appropriate; isolate experimental overrides. Label fixtures and future scenarios.

Show meaningful alternatives when useful, a recommendation with tradeoffs, and a
focused review question. Include keyboard, narrow-layout, and relevant state examples.
Record significant owner feedback, changed direction, and reasons on the study page;
Git holds detailed history. Do not manufacture acceptance or research evidence.

One lead owns synthesis. Delegate bounded exploration or critique when authorized
and useful; reconcile findings into the same study rather than parallel deliverables.

Verify using repository gates and browser inspection. Report unavailable checks
and human-review gaps separately. Provide the local review URL.

Only explicit owner acceptance changes exploratory to accepted. Accepted is not
integrated. When integration is authorized, update shared implementation, canonical
Lab examples, and relevant design/spec guidance. Retain study rationale and link to
integration destinations before marking integrated. Preserve enough reference material
that later shared-style changes do not erase the meaning of the decision.

Keep this workflow small. Record evidence-backed improvements after real iterations;
do not turn a pilot preference into a universal design rule.
