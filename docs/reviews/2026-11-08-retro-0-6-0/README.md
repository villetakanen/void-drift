# Retrospective at 0.5.6, before "the ion storm"

Held 8 November 2026 on `feat/0-5-0` at `3b3eb94`, the day 0.5.6 went live.
Scope: every loop record, factory lesson, experiment report, plan, spec, release
note and the harness itself, from the rebuild on 28 October to today.

This review interprets. The loop records in `docs/loop-evidence/` stay the
evidence; nothing here changes a skill, gate or standing rule. Candidates for
rules are listed as questions at the end, for a separate decision.

## How this was made

Six sub-agents each read one slice and wrote a digest. The digests are the
appendices in this folder; every claim below links to one of them, and they
cite the source files. Today's quick verification run on `3b3eb94` is the only
fresh check (contracts, lint, types and 308 unit tests passed; browser, build
and backend stages were not run, so it is partial).

| Appendix                                                     | Covers                                                                  |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| [loops-2026-10-29-to-11-02.md](loops-2026-10-29-to-11-02.md) | 22 loop records: planets, engines, ships, slots, colour, studies        |
| [loops-2026-11-03-to-11-08.md](loops-2026-11-03-to-11-08.md) | 26 loop records: FX, camera, steering, derelicts, suns, releases 0.5.x  |
| [factory-lessons.md](factory-lessons.md)                     | Lessons 001/002, experiment reports, audits, skills, memory rules       |
| [tooling-and-harness.md](tooling-and-harness.md)             | Scripts, gates, CI, hooks, skills, configuration, factory DoD           |
| [health-metrics.md](health-metrics.md)                       | Git, churn, size, tests, docs, debt markers, dependencies, working tree |
| [plans-specs-releases.md](plans-specs-releases.md)           | Status of 16 plans, 29 specs, the 0.4.9 to 0.5.6 release line, branches |

## Where the project stands

**Product.** Seven releases in six days: 0.5.0 on 3 November through 0.5.6 on
8 November, each with a clean full verification, a prepared and hash-checked
bundle and a separate live check. 0.5.6 ships the arcade title screen, immersive
survival, mass-law gravity, interstellar arrivals, derelicts, the standard Sun,
the ion cannon and the Hangar. No release note states human visual acceptance or
physical-phone performance as verified; every one lists them as open.

**Velocity.** 225 commits in twelve days, 49,081 lines added since 0.5.0, 33
registered design studies (21 accepted, 10 stopped, 2 open). Commit types since
28 October: 84 docs, 76 feat, 26 fix. Working tree clean, debt markers near zero
(0 TODO, 2 `@ts-ignore`, 2 `as any`, 5 `biome-ignore`).

**Factory.** Nine named gates behind `pnpm verify` with a source fingerprint and
per-run retained reports, a runner that now rejects exit-zero failures, a
prepare/check/publish release chain with fingerprint matching, 48 loop records
written under the close-loop skill, a four-part design-study skill, numbered
factory lessons and a lessons-stay-candidates discipline. Open by the factory's
own account: human experience review, physical-device measurement, a replay of
the repaired study harness and any comparative model evaluation.

**Structure.** `main` has not moved since 31 October. All 0.5.x tags and 195
commits live only on `feat/0-5-0`. Seven linked worktrees (11 GB) and 16 merged
local branches remain. The next release, 0.6.0 "the ion storm", is named in
conversation only: no plan, spec, release note or commit records its name or
scope.

**Documents.** 130 Markdown files, 20,120 lines. The contracts gate reports 133
missing link targets; specs hold 135 checked and 166 unchecked boxes; the
factory spec says "implemented alpha gates" with 0 of 13 definition-of-done
boxes checked; 5 of 16 plans carry a status line the tree contradicts.

## The pressing and repeating issues

Ranked by how often the records show the issue and how much it costs.

### 1. Design studies loop, and the same loop recurs after the fix

About half the early studies ended failed or stopped: the designer's words
include "weird looping state", "we are not progressing", "moving backward",
"model-fault-loop" and "we are about to loop". The shape repeats: early examples
are useful, later rounds add nothing, the agent re-opens givens from the brief
("i thought I gave those as constraints"), explains its own process instead of
replacing the unusable example, or drifts into DOM placement and implementation
talk. The phased skill (29 October) and the discard-and-replace rule
(2 November) were adopted; the derelict draft two loop on 6 November shows the
same failure after both. The lessons documents say so themselves: "adopted does
not mean validated", and no replay trial has been run. Evidence:
[loops A §2.1 to 2.3, 2.11, 2.13](loops-2026-10-29-to-11-02.md#2-recurring-issues),
[loops B §7](loops-2026-11-03-to-11-08.md#2-recurring-issues),
[factory lessons §3.1 to 3.3, 3.7](factory-lessons.md#3-repeating-themes-three-or-more-documents).

What did work, repeatedly: one narrow concrete question, fixed-scale in-page
comparisons of real game state, reversing to the last accepted example, and
stopping early with a written restart prompt (the energy-support restart
"nailed it").

### 2. Full verification only happens at release time

Release loops run the full gate on a clean revision and the records are exact.
Feature and study loops mostly close on quick checks, on a dirty tree, or with
"not run" for build, browser, rules and competition; eleven of the first 22 and
about a dozen of the later 26 records say so. Between releases the runner and
fixtures also misled: a browser timeout reported as success on 8 November, an
`astro check` pass hidden by an output filter, a lint "pass" read from empty
`tail` output, a `landing.spec.ts` clock race that fails on base too. Physical
phone performance has never been measured in any loop; one Pixel 8 readout was
pasted by hand without a revision. Evidence:
[loops A §2.4, 2.9, 2.10](loops-2026-10-29-to-11-02.md#2-recurring-issues),
[loops B §4, 5, 10](loops-2026-11-03-to-11-08.md#2-recurring-issues).

### 3. The local environment breaks the gates

Port 4322 occupied or `listen EPERM`, two Astro servers alive at once, stale
Vite dependencies giving blank previews, Java missing from `PATH` so rules and
competition do not run, Chromium launch blocked in sandboxed sessions. This
appears in roughly fifteen records across both halves, always solved with an
alternate port or a manual export, never at the root. The staleness command was
deferred on 5 November with "here might be a deeper root cause"; this cluster is
the candidate. Evidence:
[loops A §2.6, 2.15](loops-2026-10-29-to-11-02.md#2-recurring-issues),
[loops B §2, 12](loops-2026-11-03-to-11-08.md#2-recurring-issues).

### 4. Parallel sessions share one checkout

Other sessions commit between a loop's check and its merge, files of unknown
authorship appear and vanish, a stray `zz-probe.test.ts`, a 67-file commit that
"must not be attributed solely to new ion work", a `git reset` that lost study
sections. The mitigation each time is pathspec staging and hunk-level commits,
which work but push provenance bookkeeping onto every loop. The sprawl is
visible today: 7 linked worktrees, 11 GB under `.claude/worktrees`, 16 merged
local branches not deleted, a stash from 5 November, 2.9 GB of local artifacts
from 152 verification runs. Evidence:
[loops A §2.8](loops-2026-10-29-to-11-02.md#2-recurring-issues),
[loops B §6](loops-2026-11-03-to-11-08.md#2-recurring-issues),
[health metrics §8](health-metrics.md#8-working-tree).

### 5. Documents drift faster than they are repaired

The 5 November spec relocation left 133 missing link targets, and the link gate
only warns, so nothing forces the repair. The design-study skill links a spec
that no longer exists, and the FX skill's spec is archived with no replacement.
`docs/development.md` and `scripts/tuning-apply.mjs` cite the old gravity-field
path. The factory spec's definition of done is unchecked while its status line
says implemented; nine specs have no checked box; four are marked
"COMPLETED (2024)"; the camera spec describes a camera that trial 1 ruled out;
the release note for 0.5.3 exists only on an unmerged branch; 82 documents use
the word "owner" that the memory rule retires. Markdown tables also trip the
formatter repeatedly, in loop records, plans and today in five of the six
appendices here. Evidence:
[plans-specs-releases §1 and 2](plans-specs-releases.md),
[tooling §Observations](tooling-and-harness.md#observations),
[loops B §1, 8](loops-2026-11-03-to-11-08.md#2-recurring-issues),
[factory lessons §3.5](factory-lessons.md#3-repeating-themes-three-or-more-documents).

### 6. Evidence lives in temporary places

Nearly every record ends with a variant of "logs in the scratchpad, not
retained", `/tmp` screenshots, ignored `artifacts/`, a deleted worktree. Failed
study payloads were deleted on request, leaving the prose record. Only the two
7 November loops kept an in-repo evidence folder. The verification reports are
exact and retained per run, but they are ignored and local. Evidence:
[loops A §2.5, 2.17](loops-2026-10-29-to-11-02.md#2-recurring-issues),
[loops B §3](loops-2026-11-03-to-11-08.md#2-recurring-issues),
[factory lessons §3.8](factory-lessons.md#3-repeating-themes-three-or-more-documents).

### 7. Context does not carry between sessions

"memories are deleted constantly in this project. you can not rely on your
memory" (5 November), so decisions were written into `AGENTS.md`. Restart
prompts for failed studies were kept only in chat. A memory index pointed at a
missing file. Another agent's report named a package that does not exist. The
mirror risk also shows: a fresh study re-imported a failed study's content
through mandatory reading. Evidence:
[loops A §2.16](loops-2026-10-29-to-11-02.md#2-recurring-issues),
[loops B §9](loops-2026-11-03-to-11-08.md#2-recurring-issues),
[factory lessons §3.11](factory-lessons.md#3-repeating-themes-three-or-more-documents).

### 8. The release line sits on a feature branch

`main` is at the 31 October merge; `feat/0-5-0` carries every 0.5.x tag and is
195 commits ahead of both `main` and `origin/main`. Branch protection was noted
as missing in the alpha retrospective and has not been added. The branch name no
longer describes its content, and 0.6.0 has no written scope. Evidence:
[plans-specs-releases §3](plans-specs-releases.md),
[health metrics §1](health-metrics.md#1-git-history),
[factory lessons §2](factory-lessons.md#2-lessons-proposed-but-not-adopted-or-explicitly-deferred).

## What the records show working

- Clean-checkout or isolated-worktree full verification for every release, with
  failed attempts kept distinct from the pass.
- Prepare, check, publish, then a separate live check whose report keeps
  `liveVerified: false` until the live evidence exists.
- Fixing the runner rather than the test after a false pass; no tolerance or
  timeout relaxed to go green.
- A failing test reproduced before the fix (the steering constant).
- Honest accounting of failed, skipped and unavailable checks in every record.
- Narrow study questions, frozen earlier examples, reversal to the last accepted
  step, early stop with a restart prompt.
- Human decisions quoted in the human's words, separate from agent observation.
- Lessons kept as candidates until reviewed, with effectiveness stated as
  untested rather than assumed.

## Tensions the documents leave open

- Human experience review: `AGENTS.md` and `docs/design.md` say feel is judged
  by people playing; the memory rule says the project records no usability
  reviews and specs must not demand them. What counts as a recorded review is
  undefined.
- "Owner": retired by memory rule, still used by the close-loop,
  shared-components and fx-development skills and most records.
- Lesson promotion: "review separately before promotion" versus approvals made
  in the same conversation as the incident.
- Rejected work: delete, archive or freeze. Three documents give three answers.
- Tone of voice is "not yet decided" while language drift is policed.

## Questions for the retro conversation

Not decisions. Each one is a candidate for a separate review.

1. Where should 0.6.0's name and scope be written down, and in which form (plan,
   spec tree, release note stub)?
2. Should `main` be fast-forwarded to the 0.5.6 tag, and should releases come
   from a protected branch from now on?
3. Is "one checkout per session" a rule worth adopting, and what retention and
   cleanup policy covers worktrees, branches, stashes and artifacts?
4. Should the link gate become an error once the 133 targets are repaired, and
   who repairs the skill links first?
5. What evidence must a feature or study loop retain inside the repo before it
   can close, given that releases already do this well?
6. The deferred "deeper root cause" of stale evidence: is it the shared
   checkout, the port and server fragility, or both?
7. Does the design-study harness get its replay trial before the next large
   study, and against which model?
8. What is the definition of a recorded human experience review, so that
   `AGENTS.md`, `design.md` and the memory rule agree?

## Decisions taken on 8 November, after the review

- 0.6.0 "the ion storm" scope is recorded in
  [the plan](../../plans/2026-11-08-ion-storm-0-6-0.md).
- Releases move to `main`: fast-forward it to `v0.5.6`, protect it, tag there.
- A feature or study loop keeps its verification report and decisive logs
  under `docs/loop-evidence/artifacts/<loop>/` before it closes.
- Human experience review: playtests by people happen outside the repo process
  and never gate it; no agent requires or expects such reports in the repo. The
  `AGENTS.md` line on experience review is a misunderstanding to reword.
- Memory is not a reliable channel; several agents, not all Claude, work the
  repo. Durable decisions go into `AGENTS.md`, specs, plans or loop records.
- The rotating ion point-defence system starts as a design study.
- The "deeper root cause" mentioned on 5 November was about scope, two large
  design questions in one loop, not about agents or tooling. It belongs with
  the study-looping question, not the harness. The evidence-staleness command
  stays deferred; the harness loop proceeds on its own merits.

## Findings after the review, 8 November

- `main` was fast-forwarded to `v0.5.6` and pushed; protection now blocks
  force-push and deletion and requires the `verify` check, with admin bypass
  kept so a flaky run cannot lock the branch.
- GitHub Actions has run the full gates on every push since the rebuild. Of the
  fifteen runs since 5 November, four failed, all in the competition stage,
  while the same release commit passed from its tag. The uploaded evidence of
  [run 42461991028](https://github.com/villetakanen/void-drift/actions/runs/42461991028)
  shows the page still at 2.9 s of survival when the 60 s test timeout hit:
  software-rendered Chromium on the runner cannot drive the fake-clock frames
  to the predicted run end in time. Same family as the landing clock race.
  Harness item; not patched here.
- The unanchored `artifacts/` ignore rule had hidden `docs/loop-evidence/artifacts/`
  from git; fixed in `fa5ad4f`. The contracts gate had two regexes that assumed
  tab indentation; fixed in `3d51381` with the move to two-space indentation.

### 9. Machinery the factory added without being asked

Found while pushing `main`, after the review was written. A GitHub Actions
workflow has run the full gates on every push since 28 October. It was added
by the agent in the factory foundation commits (`88f3fca`, `3041a80`) and the
factory spec's first definition-of-done line names it; the designer does not
recall commissioning it. Of the last 50 runs, 20 failed and 10 were cancelled;
no loop record after 3 November mentions a CI result. The pattern is the same
one the lessons describe for human steps: the factory invented a process,
kept it running, and nobody owned it. What to do with the workflow is a
separate decision, including deleting it. Changes made after the review the
same day, before this was recognised as a finding: `main` pushed and
protected with the `verify` check required (admin bypass kept), workflow
trimmed to `main`, tags and pull requests (`2beaf81`). Decided the same
afternoon: the workflow is deleted and the required check removed; `main` keeps
its force-push and deletion blocks.
