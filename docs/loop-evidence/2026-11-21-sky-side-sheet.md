---
generated:
  by: "codex/gpt-6.2"
  at: "2026-11-21T19:34:57+00:00"
verified: []
---

# Sky side sheet · 21 November 2026

## Intent and decisions

This chat moved Sky's bespoke control tray into the existing shared SideSheet,
clarified the boundary between Sky and shared component contracts, and updated
spec provenance rules. The owner explicitly confirmed the Sky and Side sheet
specs. Their recorded confirmations are `human:ville-takanen` at
`2026-11-21T19:26:34+00:00` and `2026-11-21T19:28:33+00:00`, respectively.
These are document confirmations, not recorded human playtesting.

The owner requested removal of spec status and duplicate title metadata and the
`Spec:` H1 prefix; the dedicated component spec is headed exactly `Side sheet`.
Shared interaction scenarios belong to that component contract rather than
being repeated in Sky's contract.

## Changes and revision

Direct closure inspection found these changes in the local dirty macOS checkout,
based on HEAD `3a19a9bf0f714be9a46b0202208f96128d552297`:

- [SkyInstrument.svelte](../../apps/web/src/components/lab/sky-instrument/SkyInstrument.svelte)
  composes SideSheet around Sightline controls and gives the preview the host's
  full width. Existing parameter state remains owned by Sky.
- The [Side sheet contract](../specs/factory/design-system/side-sheet/spec.md)
  defines shared sizing, dismissal, focus, scrolling and retained input state.
  The [Sky contract](../specs/lab/sky-instrument/spec.md) describes its composition
  and sky-generation dependencies; the
  [design-system contract](../specs/factory/design-system/spec.md) references it.
- The [write-spec skill](../../.agents/skills/write-spec/SKILL.md),
  [template](../../.agents/skills/write-spec/template.md) and
  [splitting guidance](../../.agents/skills/write-spec/references/splitting.md)
  require actual human confirmation in `verified`, omit status and duplicate
  title metadata, and keep attachment verification attributable to that document.
- [Provenance validation](../../scripts/spec-lint/provenance.mjs) and its
  [checker tests](../../scripts/spec-lint/check.test.mjs) enforce `human:<id>`
  verification and reject status/title metadata on specs. Attachments retain
  their own metadata while sharing the human verification rule.

The shared SideSheet and its canonical reference page already existed within
other uncommitted work. Their creation and the many other dirty files are not
claimed as delivery by this loop. No commit uniquely identifies this loop's
final tree.

## Checks and observations

The following outcomes are reports from assigned workers in this chat, not
checks rerun during closure. The tested environment was the local shared Mac
checkout at the dirty HEAD above. Exact per-run tree snapshots, command
transcripts and durable reports were not retained with this record.

| Check | Reported outcome | Command provenance |
| --- | --- | --- |
| Web Astro check | Passed, zero errors and warnings | Web package `check` script: `astro check --minimumFailingSeverity warning`; invocation not retained |
| Scoped spec checks | Passed | `pnpm check:specs` for edited subtrees; exact invocations not retained |
| Contracts | Passed | `pnpm check:contracts` reported |
| Final checker tests | Six passed | `node --test scripts/spec-lint/check.test.mjs` suite; invocation not retained |
| Final factory tests | 21 passed | `pnpm test:factory` reported |
| Full spec tree | Advisory: 216 legacy findings, not migrated in this loop | Full-tree spec checker reported; invocation not retained |

The coordinating agent directly observed `/lab/sky-instrument` via browser UI
at 1280 × 720 in this chat: the sheet started closed; opening focused Close;
Escape closed it and returned focus; an unfinished seed value `4321` survived
closing and reopening. The sheet measured approximately 393 px within a 1029 px
host, with 660 px height and 732 px scroll content. After an HMR reset, a final
keyboard check changed Camera travel from 0 to 10 with ArrowRight, automatically
scrolled the pane to `scrollTop` 72, and closing returned focus to the trigger.
These observations were conversation tool output; no durable screenshot was
saved. They cover those specific interactions, not every contract scenario.

An initial worker `pnpm dev:ensure` attempt timed out. The coordinating agent's
later `pnpm dev:status` reported PID 70456 ready on port 4321, and the UI served
successfully. The timeout and later readiness are separate observations; no
persistent server log from that sequence is attached.

## Publication and gaps

No local commit, push or deployment was performed for this loop. Browser
verification used the local preview, not production. Closure only inspected
sources and this document; historical tests were not rerun.

The conversation is the source for worker check reports, UI observations and
owner decisions. Missing retained transcripts, screenshots, server logs and
per-check dirty-tree identities limit independent reproduction of those claims.
The full-tree legacy findings remain outside this loop's migration scope.
