# Retro actions, 0.5.6 to 0.6.0

Working board for acting on the findings of the
[retrospective held 8 November 2026](../reviews/2026-11-08-retro-0-6-0/README.md).
Each item names the finding it serves, what to do, and its state. A loop that
takes an item moves it to done in the same commit as the change, with the
commit hash. Items marked "decision" wait for the designer; do not act on
them without an answer.

Status: open; started 8 November 2026.

## Purpose, in the designer's words, 8 November

Stated after the fourth restart of this work, when the board's earlier rule
read "a session that reads this board starts by exploring, not by fixing":

"The key point in all of these retros is to learn, and while learning, also do
the improvements we learn that are necessary. The loops either seem to be
learning or doing changes without telling me so. That's kind of the issue
here. I don't know where we are. [...] Something in this work seems to be so
that these loops and our cycles seem to lose sight of it: the fact that we
need to do both, teach me and our team, and fix the things we learned."

Both halves belong in one cycle: explore a finding with the designer, then
make the change the learning calls for, telling the designer each time. A
change made without the finding explored, and a finding explored without its
change made, are each half the work. Record a change next to the finding it
came from, with the date the designer approved it.

## The designer's findings, first

Stated by the designer on 8 November after the review (spoken note, quoted in
[the retro README](../reviews/2026-11-08-retro-0-6-0/README.md#the-designers-findings)).
These come before every item below.

- **A. Exploration stops when it turns into discussion.** Exploration is
  confirming guesses and guessing again when wrong; studies fail when they
  loop over details that do not answer the design question. The team is
  better at spotting it, not always in time.
- **B. No rubric for the design question itself.** The biggest finding: the
  team often fails to see that a question is too winding, or missing
  fundamentals, for the study format to answer at all. Logged as model or loop
  failure, it is a missing way to evaluate part 01.
- **C. The design system is bypassed.** In studies and screens, components
  were invented in place instead of flagging that the design system lacks
  them or that the agent did not know how to use it.

Everything else on this board is technical, and open. The designer, 8 November,
on the two groups: "These three are likely, from my experience, ones we would
like to act on, and the rest might be something we might defer. But we don't
know if we'll act on any of these A, B, C, or defer any of those other
findings. It's just a prioritization thing: priority one issues and priority
two issues. I don't see why we would at this point decide to defer any of the
priority two issues." A, B and C are priority one; the numbered items are
priority two. Nothing is deferred.

## Done

| Item                                                      | Finding | Commit           |
| --------------------------------------------------------- | ------- | ---------------- |
| Repair 133 missing Markdown link targets, skills included | 5       | `5223ffb`        |
| Contracts gate fails on a missing link                    | 5       | `d8f98b9`        |
| Track `docs/loop-evidence/artifacts/` (anchored ignore)   | 6       | `fa5ad4f`        |
| Two-space indentation; gate regexes indentation-agnostic  | 5       | `3d51381`        |
| `main` fast-forwarded to `v0.5.6`, pushed, protected      | 8       | no commit (refs) |
| Hosted CI removed, required check dropped                 | 9       | `09d57d9`        |
| 0.6.0 scope recorded                                      | state   | `b3c1e51`        |

## Open: plain fixes

Documents only. Pathspec commits. Items marked **quick win** are decided
(8 November 2026) and may be taken on a single "go" from the designer, one
item per commit, without discussion. The others need evidence judgment and are
explored with the designer first.

1. **Plan status lines** (finding 5). Dropped 8 November: plans carry no
   status; see the exploration entry below. Five plans contradict the tree:
   `2026-11-04-lab-usability`, `2026-11-05-game-and-lab-spec-trees`,
   `2026-11-04-camera-trial-2`, `random-star-systems`,
   `2026-11-04-motion-instrument-conformance`. Evidence per plan in
   [plans-specs-releases](../reviews/2026-11-08-retro-0-6-0/plans-specs-releases.md).
   Correct the status line to what the tree shows; never delete a plan.
2. **Factory definition of done** (finding 5). `docs/specs/factory/spec.md`
   says "implemented alpha gates" with 0 of 13 boxes checked. Check each box
   only with evidence (a script, a test, a record); leave unmet boxes
   unchecked and make the status line true.
3. **Stale spec status lines** (finding 5). `high-scores` and `ship-select`
   say PLANNED; `world/systems` DRAFT; four say COMPLETED (2024). Set each to
   what the tree and the release notes support. Specs carry no history.
4. **Recover `docs/releases/0.5.3.md`** (finding 5, quick win) from branch
   `codex/release-0.5.3` into the tree, unchanged.
5. **`AGENTS.md` experience-review line** (tension, quick win). Replace "Human experience
   review assesses feel and fidelity separately from automated correctness"
   with the decision of 8 November: playtests by people happen outside the
   repo process, never gate it, and no agent requires or expects such reports.
   Keep `AGENTS.md` under 80 lines.
6. **Retire "owner"** (tension, quick win) in the three skills (`close-loop`,
   `shared-components`, `fx-development`) and in current docs (`development.md`,
   `design.md`, specs). Historic records and plans stay as written.

## Open: harness, one bounded change each

No new machinery, no CI. Each change ships with a failing-then-passing check.

7. **Retain evidence by default** (finding 6). `scripts/verify.mjs --retain
   <loop-slug>` copies `report.json` and failed-stage logs into
   `docs/loop-evidence/artifacts/<loop-slug>/`.
8. **Preflight** (finding 3). Before gates run, name a held browser port and
   its process, missing Java, missing Chromium, a stale `.vite` cache. Fail
   with the name, not a timeout.
9. **Close-loop record formatting** (finding 5). The close-loop skill runs
   `biome format --write` on the record it writes before reporting.
10. **Landing clock race** (finding 2). `tests/browser/landing.spec.ts` is
    intermittent on `clock.pauseAt`; make it deterministic without raising
    timeouts.

## Open: needs the designer

11. **Ref cleanup** (finding 4). Sixteen merged local branches, the merged
    worktrees under `.claude/worktrees` (11 GB), stash `0.5.0 wip before spec
    relocation`. Present the exact list; delete only what is approved. The
    unmerged `claude/camera-*` branches and the Codex worktree stay.
12. **Study harness replay** (finding 1). Lessons 001/002 say "adopted, not
    validated". Decide whether to run the evaluation protocol in
    `docs/factory-building-lessons/design-study-evaluation.md` before the
    point-defence study, and against which model.
13. **One checkout per session** (finding 4). Whether to adopt it as a rule.
14. **Root `artifacts/` retention** (finding 6). 2.9 GB, 152 runs, ignored.
    Whether to prune runs older than the last release.

## Not actions

Tensions the retro left open that need a definition, not a fix: lesson
promotion timing, rejected-work handling (delete, archive or freeze), tone of
voice. Listed in the retro README.

## Exploration, 8 November 2026

Evidence brought by the assistant from the loop records; the reading is the
designer's, in the designer's words.

The entries below are testimony, not decisions. Each once ended "No change
named", struck on 8 November after the designer read it: "why would we not do
a change for A and B? I think those kind of recordings are from the broken
cycle. We kind of restarted here. I have no idea why we would not act on A or
B. I have not decided such a thing, nor discussed either of them in breadth. I
have just given an oral testimony to questions I'm agent asked, and everything
else is like drift." Whether to act on A, B or C is open.

### A. Exploration stops when it turns into discussion

Evidence: the loop is named by the designer in ten of twelve stopped studies
(`2026-10-29-planet-roles-cycle.md`, `2026-11-01-lab-instrument.md`,
`2026-11-01-path-instrument-closure.md`, `2026-11-06-derelict-draft-two-closure.md`
and the list in loops appendix A §2.1); the value sits early in each ("the only
usefull excample was the first"); after a rejected guess the agent's next turn
was often not a new guess ("how about asking them?", "concrete answers on the
page rather than more process explanations", "neither recovery response
delivered a replacement visual artifact"). The records are silent on what was
visible in the turn before the designer called the loop.

The designer, on the sign that shows before the loop is named: "the model
answers to the chat and doesn't just continue the exploration. And then when
I answer to the chat, it again answers to the chat and doesn't continue the
exploration. If the agent then answers third time to the chat, instead of
continuing the exploration, or by deleting the previous step and claiming it
was a mistake, or no mistake was clearly flagged or removal of the step asked,
we are clearly in a loop state. It's not the only one, and this is not some
litmus test we can just run at that, but it's kind of the clearest pattern we
have."

On what the pattern is: "the agent starts defending its work and defending
its rationals instead of just understanding that in a creative process like
this, we fail forward, we don't care why we failed, let's just figure out
something else. [...] We never must start defending or feel defensive because
somebody is frustrated or something doesn't make sense. We just try something
else. [...] We're just throwing balls on the wall and see which one sticks. And
if they don't, that's nobody's fault."

### B. No rubric for the design question itself

Evidence: the question is named as the problem in two records, path-instrument
("this topic is either too broad, or then the design study is too nuanced",
`2026-11-01-path-instrument-closure.md`) and suns ("the first one, zero one,
should never proceed unless we have a clear problem worth studying"; "No skill,
standing process or section-01 gate was changed by closure",
`2026-11-07-suns-closure.md`); LHI Wasp's section 01 "framed a mechanic the
owner considered settled as the unknown" (`2026-11-01-lhi-wasp-study.md`). The
skill's part 01 says "propose one decision the cycle can settle"; the
evaluation rubric's eight criteria
(`docs/factory-building-lessons/design-study-evaluation.md`) judge purpose,
unknowns, alternatives and phase advancement, none whether a study can answer
the question at all. No record names the question as the cause at the time a
study stopped; the ten stopped studies are logged as loops or model fault.

The designer: "Most of the cases I've stopped the record unless there is this
micro interaction self-correction overdrifting loop, it's always because of
something in the study makes it like impossible to continue. The question is
too large, the question is wrong, or something like that, and we just fail to
record that. And even in the micro-interaction cases, I guess like 1/3 at
least of them, is because of us having like a problem that cannot be solved by
exploring and learning."

Second round, same day, in breadth. Evidence: the spec asks part 01 for "an
answerable question"; the skill advances on "substantive agreement or a clear
instruction to explore", and nothing tests answerability. The ten stopped
studies' openings all read as finished problem statements; several carry more
than one question (derelicts: identity and encounter legibility "together";
open-frame machinery: one construction for four utilities, three of which never
got an example; ship utility language defers the device's function as "a later
concern"; path instrument opens as a contract for a measuring tool; plasma
offers two rewards, "either or both"). Four name one object and one question.
Nothing records what the designer saw in an opening when agreeing to explore
it. The evaluation rubric judges the study's conduct, not part 01; the designer
set it aside: "I don't know how it actually relates to step one at all."

The designer, asked which of the ten openings they would have refused to
explore: "I kind of learned that like afterwards. So I don't even know if you
have good like baseline for what say a bad design question. I guess that's a
key point when we kind of succeeded, then was that we limit a question. If
you're trying to explore how engines work in the game, that's a question that's
quite large. But if you study how engines should look in the game, so we could
get the feel of them, and then do other things, that might work. If the study
is able to produce something of value, so the question must be answerable in a
way that the game can be changed in a very concrete way. If it can't, or if
it's a very complex change, it's likely not a design study. It's more like a
version of the game, if you will. Complexity is a hard thing to measure, but
like how many things does it touch? Is it answerable by exploring? Those kind
of things."

### C. The design system is bypassed

Evidence: no loop record names a component invented in place; the two
design-system loops (`2026-11-03-square-switch.md`, `2026-11-01-s3-colour-roles.md`)
build the system itself, and the six retro appendices do not mention the
pattern. The code shows it. The input primitives are Toggle and RingSlider
(1 November) and Switch (3 November), shown on `/lab/inputs`. Of 172 study
files under `apps/web/src/components/studies/`, 20 import any shared
primitive; 8 use RingSlider while 40 draw a native range slider (18 of them
first committed after RingSlider existed); 2 use Switch while 36 draw a native
checkbox (4 after Switch existed); 26 use native buttons without the design
system's `.btn` classes. The fiddler, suns and in-game-controllers studies use
the primitives; the gravity FX, derelict-three, ion and lab-instrument studies
do not. The design-study skill never mentions the design system, the
shared-components skill or `/lab/inputs`; it says only "reuse production
simulation code".

The designer, asked whether the bypass is the bench controls these counts
show or something the counts miss: "Yes, the controls: studies drawing their
own sliders, checkboxes and buttons instead of the Lab primitives."

### Item 1, plan status lines, raised as a quick win

Not done. The designer, 8 November: "I don't know why plan files would have
text like proposed, not started, or planned. Nothing that makes sense to me.
The plan is a plan. It's like a map. It's not a territory. It's like a
transitional object with kind of undefined something that we thought at some
point was important. And we're mainly saving them because like future
reference to see like what we were planning at some point. But status of a
plan, it doesn't mean anything. [...] So I don't think the action like sounds
sensible there. It sounds like an us trying to infer some meaning to slop."
