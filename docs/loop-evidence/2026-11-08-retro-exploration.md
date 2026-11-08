# Retro exploration with the designer, 8 November 2026

Record of the session that explored the designer's findings A, B and C with
the designer, after the retrospective at 0.5.6. Started from a brief written
by the previous session; base revision `5c5d736` on `feat/0-5-0`. Closed at the
designer's request on 8 November 2026 (Europe/Helsinki) at `2acd94f`; entries
are dated.

## Intent and scope

- The brief: explore findings A and C with the designer, one question per
  turn; write the designer's reading on the retro actions board "in the
  designer's words"; change nothing but the board and this record; fixes
  belong to a separate session.
- Changes of direction during the session, each at the designer's word:
  - A was already recorded (`7a0762c`); the session went to C, then B in
    breadth.
  - "No change named", the closing line on each exploration entry, was struck:
    the designer had decided nothing.
  - The board's explore-only rule was replaced: a retro cycle both teaches
    the team and makes the changes the learning calls for, telling the
    designer each time.
  - The board's "may wait for the next version" sentence and its
    take-only-when-told rule were replaced: A, B, C are priority one, the
    numbered items priority two, nothing deferred.
  - The designer asked that spoken testimony stop being written on the board;
    then that the board return to finding, action, state. The exploration
    evidence moved to the review as an appendix; the designer's readings moved
    here.

## Changes delivered

All on `feat/0-5-0`, each committed by pathspec; another session's
in-game-controllers study files were present and never staged.

| Commit    | Change                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------- |
| `b1ba431` | Board: exploration entry for C                                                                    |
| `81ecfba` | Board: "No change named" struck from A, B, C; the designer's correction recorded                  |
| `a0c4f30` | Board: second round on B                                                                          |
| `a6a6dd7` | Board: purpose restated, both halves in one cycle                                                 |
| `0b236ee` | Board: technical items are priority two, not deferred                                             |
| `3fd3ac1` | Board: item 6 marked a standing request from before the retro                                     |
| `2ec4537` | Review appendix `designer-findings-evidence.md`; board cut to finding, action, state; this record |

## Checks

`pnpm exec biome format --write` and `pnpm exec biome check` on each changed
Markdown file before its commit; all passed. The lefthook pre-commit (biome)
and commit-msg (conventional) hooks ran on each commit; one commit-msg warning
(`footer-leading-blank`) on `3fd3ac1`, not a failure. No verification gate was
run; no code changed.

## Publication

- Local commits: the ones above. Nothing pushed. No release, deployment or
  live verification.

## Human feedback

Spoken by the designer into the session, 8 November, in answer to one question
per turn. Attributed paraphrase; testimony, not decisions, unless marked. The
designer asked during the session that their speech not be written down
verbatim, since a later session reads it as authority.

- "No change named" on the A and B entries: the designer had decided nothing;
  the entries were answers to questions, the closing line was drift.
- The retro's purpose: a cycle must both teach the team and fix what was
  learned, telling the designer each time; the cycles had been doing one or
  the other. Recorded on the board as its purpose (decision).
- The seven done items: clear once described as what was wrong and what
  changed; four tasks to the designer, not seven.
- The technical findings: priority two, open, none deferred (decision,
  recorded on the board).
- A (from the previous session's entry): the sign before a loop is called is
  the agent answering the chat instead of continuing the exploration, more
  than twice, or deleting a step unasked; the pattern is the agent defending
  its work where the process is to fail forward. Offered as the clearest
  pattern, not a test.
- B, first round (from the previous session's entry): stops come from the
  study's question being too large or wrong, and a third or more of the
  micro-interaction loops too; stated as a guess.
- B, the evaluation rubric: its relation to part 01 is unknown to the
  designer; set aside for B.
- B, asked which stopped opening they would have refused: learned afterwards,
  so no baseline. Measure offered: the answer must let the game change in a
  concrete way; a large or complex change is a version of the game, not a
  study; count what it touches and whether exploring can answer it.
- C: the bypass is the bench controls, as the counts show.
- Item 1, plan status lines: a plan is a map, its status means nothing; item
  dropped (decision).
- Item 6, "owner": a standing request from before the retro, not a retro
  finding; the word marks machine-written text and names no single person.
- Recording speech: writing the designer's words to the board will break the
  project when read as authority; the board is for what was found by
  assessing the feedback and the repo. Board cut back accordingly (decision).

## Findings (observations)

- The board at `5c5d736` already held exploration entries for A and B,
  committed by the previous session, while the brief for this session said
  only B was done.
- Three documents in sequence each restated the retro's method as one half:
  the review README ("nothing here changes a skill"), the board ("starts by
  exploring, not by fixing"), this session's brief ("nothing in the repository
  changes except the board and the loop record"). The designer's statement of
  the purpose names both halves.
- Three sentences on the board stated decisions the designer says were not
  made: "No change named" (three entries), "may wait for the next version",
  "take an item only when the designer says so". Each traces to a paraphrase
  of the designer's spoken note in the retro's loop record, hardened at each
  rewrite.
- Items 4 and 5 still carry the previous session's "decided quick win" mark;
  the designer was asked and had not answered when the board was cut back.
  Item 5's substance has the designer's words behind it in
  `2026-11-08-retro-and-actions.md`; item 4's does not.
- The evidence gathered for A, B and C is in
  `docs/reviews/2026-11-08-retro-0-6-0/designer-findings-evidence.md`.
- A message written before the turn's wrap-up call reached the designer cut
  to a summary and had to be repeated.

## Evidence gaps

- The designer's statements are from speech-to-text in chat; the transcript
  is not retained in the repository.
- No run of any verification gate on any revision of this session; the
  changes are Markdown only.
- The counts in the appendix were taken on a tree holding another session's
  uncommitted files; those files are excluded only where a first-commit date
  is used.

## Later on 8 November: acting on the items

The same session continued after the board was cut back; the designer asked
to comb the priority-two items and act on them. Parked at `2acd94f` with an
empty working tree, then closed.

### Changes delivered

| Commit    | Change                                                                                      |
| --------- | ------------------------------------------------------------------------------------------- |
| `fd2c5f0` | Board: items 2, 3, 4 won't fix                                                              |
| `07dba17` | Board: item 5 widened to every document owing a feel review                                 |
| `dbe1968` | Item 5: `AGENTS.md`, `design.md`, `development.md` no longer expect human experience review |
| `c1e2c75` | Board: hash for item 5                                                                      |
| `1c0a4ec` | Item 6: "owner" retired in three skills, current docs, specs, code comments (16 files)      |
| `ac2dffd` | Board: hash for item 6, first part                                                          |
| `99f6317` | Item 6: "owner" retired on fourteen Lab study and review pages                              |
| `4de6e25` | Board: item 6 done                                                                          |
| `387ac28` | Item 13: shared-checkout practice stated in four places; first whole-tree commit            |
| `4c9fa0b` | Board: item 13 done                                                                         |
| `512d4ad` | Board: item 9 covered by 13, item 11 done, item 14 deferred                                 |
| `2acd94f` | Board: "How to continue" section; this record's dated entry for the second half             |

Outside commits: five merged worktrees under `.claude/worktrees` (10.5 GB)
removed with their branches; eight further merged local branches deleted. The
stash `0.5.0 wip before spec relocation` (5 November) was kept: 14 of its 199
substantive added lines exist in the tree, so it holds work the tree lacks.

Commits up to `4de6e25` were pathspec commits; from `387ac28` on, each commit
saved the whole tree, as the practice recorded in that commit says.

### Checks

`biome format --write` and `biome check` on the changed files, then on the
whole tree (800 files) from `387ac28` on; all passed. Two commit attempts were
rejected by the hooks and corrected before landing: Lab pages needing reflow
after the word change, and a commit body line over 100 characters. No
verification gate was run on any revision.

### Publication

Nothing pushed by this session. Direct inspection at closure: `origin/feat/0-5-0`
is at `206945a` (committed 15:00 Helsinki), so that commit and `7a0762c`'s
predecessors reached the remote by a push this record does not account for;
the local branch is 21 commits ahead. 23 commits since the board was created
at `9f002b3`. No release, deployment or live verification.

### Human feedback, attributed paraphrase

- Items 2 and 3: spec material is corrected just in time, when the spec is
  next worked on; won't fix. Item 4: trivial; won't fix (decisions).
- Item 5: applies to every document; the point is to scope out work the
  agents and the team cannot do in the repo, and to stop asking for proof of
  it (decision).
- Item 6: critical (priority); extend to the Lab pages (decision).
- Item 13: the single checkout is on purpose. Two to four sessions run at once
  across Claude Code, Antigravity, Codex and pi; they share the checkout and
  Zed, whose git pane the designer uses to monitor the work; the checkout is
  committed whole to the active branch. Agents have mostly ignored this.
  Worktrees are not forbidden, since isolation has merits, but a worktree's
  result is merged into the local delta before the commit to the branch. The
  rule should state the model, not say "never"; stating it steers enough
  (decisions).
- Items 9, 11, 14: 9 go; 11 delete if faster; 14 not understood, defer to the
  0.6.0 retro. The stash: leave it (decisions).
- Closing: good work; park here with instructions a later session can follow
  on "see the instructions"; then close the loop (decisions).
- The retro's method, said again: surface findings, discuss to the root
  cause, fix what is fixable, take the complex ones to the team.

### Findings (observations)

- Nothing in the rules or docs stated why there is one checkout before
  `387ac28`; `AGENTS.md` line 65 told agents to identify provenance before
  committing, and every commit of this loop up to `4de6e25` was by pathspec.
  Worktrees and a shared checkout had both been used on other days with no
  recorded default.
- The verification reports of the previous loop all ran on a dirty tree, and
  no report matched a committed revision; the designer's git pane carried the
  other session's files through nineteen commits.
- Six spec definition-of-done lines still gate on the designer playing or
  looking (effects FX-08, mount-planner, hangar, light-ion-cannon); item 5's
  rule says not to. Left as just-in-time spec work by the items 2 and 3
  decision.
- The first whole-tree commit saved another session's in-progress study, as
  the practice intends; the formatter fixed one of that session's files.

### Evidence gaps

- The two or three other sessions' state is unknown to this one; whether the
  controllers study was complete when committed is not recorded.
- No gate has run on any revision since `fa5ad4f` (previous loop, dirty tree).
