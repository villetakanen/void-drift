---
name: close-loop
description: Close completed work on request by comparing intent, result, and verification and recording findings so evidence accumulates across runs.
generated:
  by: openai-codex/gpt-6.2-sol
  at: "2026-11-23T13:01:51Z"
verified: []
---

# Close the loop

A request to “close loop” authorizes writing only the closeout finding record. Start by reading applicable `AGENTS.md` and the available artifacts. Use the repository report destination specified by applicable `AGENTS.md`; otherwise use `docs/close-loop-reports/` at the repository root. Do not ask for permission for the ordinary record. If it cannot be written, report the intended location and blocker. Never write findings to tickets, propose implementation, or change factory behavior during closeout.

## Compare and accumulate evidence

1. Recover the intent and acceptance criteria from the brief, decision, or spec. Compare them with the delivered result and available verification. Cite durable locators (paths, revisions, URLs, or expected locations for missing artifacts) and explain what each supports. Distinguish observed evidence, reported claims, and missing evidence, including checks not run. Identify stale or conflicting evidence; never fabricate proof or treat a claim as a verified result.
2. Choose a stable reference for the work, such as a canonical ticket ID or durable repository reference, and reuse it across closeouts. Search prior reports for that reference and for relevant findings from other work. Compare the current evidence against relevant prior findings and link their report paths. A prior report is not itself proof that a check passed.
3. Record each material finding. A reusable improvement identifies an evidenced lesson and where it recurs, not a proposed change. If evidence supports completion and reveals no material finding, record `no_finding` rather than omitting findings.

Classify each conclusion at the scope the evidence supports:

- If the stated acceptance criteria and delivered artifact directly show a mismatch specific to this work, classify it as a `one_off_issue` even if the cause is unknown. An unestablished cause does not make the mismatch an `unverifiable_claim`. A hypothetical guard that might have prevented it is not evidence of a `reusable_improvement`.
- If an inspected check omits a material case, record the coverage gap as an observed limitation and classify it at its evidenced scope. Keep that distinct from any unavailable outcome for the omitted case; missing coverage does not show whether that case would pass or fail.
- Mark directly inspected requirements and artifact contents as `observed` for what they show. If an event is known only from another party’s account, mark that event `reported`; observing the account does not independently establish the event.

## Write and report

Write one machine-readable JSON file per run by default. Use an explicitly specified host format instead when required, retaining equivalent fields and meanings. Choose a unique run ID and filename, create the report without replacing any earlier run, and keep prior reports intact. Tell the user where the report was written, or state the blocker if it was not written.

### Report schema (version 1)

| Field | Type and meaning |
| --- | --- |
| `schema_version` | Integer, always `1`. |
| `run_id` | Nonempty string, unique to this run. |
| `recorded_at` | RFC 3339 timestamp string. |
| `work_ref` | Nonempty string, stable reference to the work across runs. |
| `intent` | String: brief and acceptance criteria, with source locators or explicit gaps. |
| `result` | String: delivered outcome, with source locators or explicit gaps. |
| `verification` | String: what was observed, reported, or missing, with source locators or explicit gaps. |
| `findings` | Array of finding objects, including a `no_finding` object if there is no material finding. |

Each finding has:

| Field | Type and meaning |
| --- | --- |
| `classification` | String: `reusable_improvement` (evidenced lesson applicable beyond this instance), `one_off_issue` (evidenced discrepancy specific to this instance), `unverifiable_claim` (material claim not established; identify missing evidence), or `no_finding` (evidence supports the intended result and reveals no material gap or lesson). |
| `summary` | String describing the finding. |
| `evidence` | Array of objects with `locator` (durable source or expected source, string), `supports` (what it supports or what is missing, string), and `kind` (`observed`, `reported`, or `missing`, string). |
| `prior_reports` | Array of path strings for relevant prior reports; use `[]` when none apply (an equivalent empty representation is allowed in a host format). |
| `evidence_status` | String: `new` (evidenced finding without a relevant prior finding), `supports` (current evidence corroborates a prior finding), `contradicts` (current evidence conflicts with a prior finding), `unresolved` (evidence cannot settle the claim or comparison), or `not_applicable` (no finding). |
