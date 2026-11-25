---
name: close-loop
description: Record the agent’s self-assessment of its own work loop on request, using only context already available from that loop.
generated:
  by: openai-codex/gpt-6.2
  at: "2026-11-25T12:35:38Z"
verified:
  - by: human:ville-takanen
    at: "2026-11-25T12:45:25Z"
---

# Close the loop

## Tool boundary: read before acting

Closeout is report writing from memory. Do not start the usual repository
exploration or coding verification workflow, even before loading host guidance.
In particular, do not run `git status`, `git diff`, `rg --files`, recursive
searches or directory inventories such as `ls -la`. Those operations are outside
this skill, even when intended to check preservation or prepare a handoff.

Use tools only to:

1. Read this skill and applicable `AGENTS.md` files by their exact paths if not
   already supplied in context. Check guidance along the chosen destination path
   directly; do not discover it by scanning the repository.
2. Obtain a timestamp and unique run ID, check or create the destination, and
   exclusively create the new report. A direct destination type/permission check
   is allowed; listing existing reports is unnecessary.
3. Optionally read back that exact new report to verify the write, then hand off.

Before each call, check it against these three permitted operations. Everything
else stays in the loop's existing context; do not gather more evidence.

## Purpose

A request to “close loop” authorizes one new self-assessment report. Record what
you thought worked and the harness, project or context issues you encountered
in your own work loop. This is your account, not an independent audit or a
human acceptance decision. Interpretation across reports belongs to a separate
process.

## Assess from existing context

Use only the context already available from this loop. Do not investigate,
inspect project artifacts anew, rerun checks, consult outside sources, search
prior reports or compare knowledge across runs. Available sources are not an
invitation to read them. Questions you cannot answer from this context stay
uncertain; do not invent causes or generalize beyond the loop.

Describe what you thought worked. For each noticed issue, separate what you
observed, its effect on the loop, and any interpretation. Label suspected
explanations and uncertainty explicitly. Use `null` for an unknown explanation.
When you noticed no issues, use an empty `issues` array: it means only that you
noticed none, not that an audit established their absence. Do not manufacture
findings to fill a report.

## Write and hand off

Use the destination in applicable `AGENTS.md`; the fallback is
`docs/close-loop-reports/` at the repository root. Read applicable host guidance
if it is not already in context. Reading guidance, checking the destination and
creating the record are allowed reporting operations, not an investigation of
the loop. Do not inventory the repository or run Git status/diff to audit the
loop or prove preservation. Check guidance by its applicable paths, not a
recursive repository search. You may read back only the report you just wrote
to verify the write. Do not read earlier reports, including for filename or
run ID selection.

Write one JSON file by default, using the schema below. An explicitly specified
host format takes precedence, preserving the same assessment content. Choose a
unique run ID and new filename (for example using a UUID). Create exclusively;
if the name exists, choose another without reading or replacing it. Preserve
all earlier reports and other artifacts. Do not write to tickets, change project
artifacts or factory behaviour, or undertake implementation work during closeout.

Do not ask permission for the ordinary report. If writing is blocked, identify
the intended location and the actual blocker in the handoff; do not claim the
report was written or substitute a ticket or another destination. Otherwise,
identify the written report path in the handoff. Never infer human acceptance.

## Report schema (version 2)

| Field | Type and meaning |
| --- | --- |
| `schema_version` | Integer, always `2`. |
| `run_id` | Nonempty string, unique to this run. |
| `recorded_at` | RFC 3339 timestamp string. |
| `loop` | Nonempty string identifying this work loop from existing context. |
| `worked` | Array of nonempty strings describing what you thought worked; may be empty if nothing is known. |
| `issues` | Array of issue objects; `[]` explicitly means no issues noticed. |

Each issue has only:

| Field | Type and meaning |
| --- | --- |
| `area` | `harness`, `project` or `context`: where the issue was encountered, not a proven root cause. |
| `observation` | Nonempty string describing what you encountered. |
| `effect` | Nonempty string describing its effect on this loop, including uncertainty if unknown. |
| `interpretation` | Nonempty string explicitly distinguishing any suspected explanation and uncertainty, or `null` when unknown. |

Use only these fields. No stable cross-run reference, prior-report links,
recurrence classification, evidence-comparison status or acceptance verdict is
needed. Version 1 reports are historical records; leave them intact without
reading, migrating or regrading them.
