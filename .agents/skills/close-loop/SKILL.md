---
name: close-loop
description: Collect a bounded development loop's evidence into a durable local record when closing the loop. Does not infer signals, derive lessons, or promote process changes.
---
# Close loop

Collect evidence only. A finding is not a signal. Closure records what happened;
it does not decide what should be learned or changed.

## Scope and sources

Identify the loop's intent, boundaries and relevant revisions from the conversation
and repository. Use the existing loop record if one exists; otherwise create
`docs/loop-evidence/<date>-<slug>.md`. Keep earlier observations attributable when
adding later evidence. Do not rewrite prior interpretations as established facts.

Inspect the relevant contracts, source changes, check reports, release records and
owner feedback. Distinguish direct inspection from a prior session's report.
Missing artifacts remain unavailable evidence. Do not rerun tests, mutate production,
or reproduce a failure solely to fill a historical gap unless separately requested.
A later run is new evidence, not proof of what happened in the closed loop.

## Record

Keep a compact record another session can inspect without the full conversation:

- Intent and scope, including explicit owner decisions and changes of direction.
- Changes delivered, with commit/revision references where available.
- Checks: command, outcome, tested revision or dirty-tree identity, environment,
  and source location. Distinguish failed, skipped, unavailable and passed results.
- Publication: local commit, push, deployment and live verification as separate states.
- Human feedback: exact short quote or attributed paraphrase, its subject and limits.
- Findings: what was observed, under what conditions, evidence reference, and what
  remains unknown. Keep conflicting observations and counterevidence visible.
- Evidence gaps, including missing artifacts, temporary paths and retention limits.

Summarize essential results in the tracked record; link large artifacts rather than
copying them wholesale. Never include credentials, sign-in codes or secret environment
values. Dates and revisions should make clear which observation belongs to which run.

## Interpretation boundary

Do not turn a finding, repeated finding, passing check or owner preference into a
signal, causal explanation, general lesson, recommendation or new requirement.
If a source already contains an interpretation, attribute it as that source's claim;
do not endorse it through repetition. Temporal sequence alone does not establish cause.

Record accepted decisions as decisions, not proof that they generalize. Record stated
uncertainty as uncertainty; do not replace it with confidence ratings unsupported by data.
Do not rank findings, prescribe the next loop, edit skills/contracts to absorb lessons,
mark unverified criteria complete, or send external feedback as part of closure.
Those are separate analysis or implementation tasks requiring their own scope.

## Completion

Check that factual claims have traceable sources and the record distinguishes evidence
from reported claims and unknowns. Validate only the documentation changed by closure.
Return the record's path, scope and material evidence gaps. Collecting the record does
not itself certify product acceptance, release readiness or the quality of the factory.
