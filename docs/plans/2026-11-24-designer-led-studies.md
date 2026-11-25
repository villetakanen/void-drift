# Designer-led studies: a Flight Deck weapons trial

Open planning document, started 24 November 2026. This maps a possible change
to how we conduct design studies and a small trial through which to learn about
it. It settles nothing unless a point is marked agreed with a date.

## Where this started

The designer has been avoiding studies because the current practice has become
hard to work with. In their account, the strongest studies developed a shared
understanding of the problem, then investigated it in small increments, ironing
out one thing at a time. Useful results could eventually enter the game in
phases. The four-part shape still makes sense; how the work is directed and
what the later parts accomplish need reconsideration.

The current [design-study skill](../../.agents/skills/design-study/SKILL.md)
supports discussion in problem development, but its
former exploration guide (`references/exploration.md`, retained in Git history)
tells the agent to choose the next move and replace an unusable proposal in
the same round. This gives the agent considerable control over the inquiry.
The skill's third part explicitly assesses implementation feasibility; its
fourth cuts delivery into slices with dependencies, rough sizes and checks.
Those purposes differ from the design alignment and adoption map the designer
now wants. These are concrete mismatches in the instructions, not a complete
explanation of every unsuccessful study.

## Working direction

The proposed practice is designer-led and agent-aided. The designer directs
the inquiry and judges the design. The agent contributes reasoning, investigates
existing behaviour, suggests useful ways to examine uncertainties, builds
instruments and examples, and preserves what is learned.

Human involvement belongs inside each part, especially exploration. It is not
limited to approval at phase boundaries. Individual pieces of work can still
be delegated fully to the agent when their purpose is understood. A request
for a particular comparison should allow the agent to build and verify it
without repeated permission questions.

The proposed working agreement is a shared understanding of the next design
move before building. When the designer gives that direction, the agent acts.
When it is unclear, the agent brings reasoning and a recommendation into the
discussion. Feedback, including rejection, may call for understanding before
another artifact. The agent remains an active collaborator rather than only
an operator waiting for instructions.

These are working proposals for the trial, not replacement skill or spec text.

## The four parts

Names remain provisional. Their intended purposes are:

| Part | Design work |
| --- | --- |
| Define | Discuss the unsatisfactory situation, intended experience and important uncertainty until there is a shared problem worth investigating. |
| Discover | Examine that problem in small increments, with the designer directing the inquiry and the agent supplying reasoning, tools and support. |
| Align | Judge how the emerging design fits the game: its experience, visual language, surrounding interactions and consequences for the player. |
| Map the implications | Understand what adoption would touch in specs, systems and shared components, and what decisions or missing pieces remain. |

Problem development needs room for the designer's initial account before a
precise study question is imposed. Exploration should help refine that question
when discoveries warrant it. Alignment has a distinct purpose, but the game
must remain present throughout exploration so isolated examples do not mislead.

The final part should make subsequent project decisions well informed. Detailed
implementation design and delivery breakdowns belong to later work. Technical
constraints can still matter earlier when they change the design possibilities.

## First deliverable: a useful weapons study and an experienced method

**Agreed, 24 November 2026:** write this plan for the designer to read before
they explain their thinking about the Flight Deck weapons problem. Develop the
problem together from that account. The immediate scope is the plan and that
discussion; the weapons solution and a general skill rewrite remain open.

The proposed trial concerns the weapons area in the Flight Deck. In the current
[FlightDeck component](../../apps/web/src/components/FlightDeck.svelte), the
right-hand deck button is a disabled “Weapons” placeholder, explicitly awaiting
its own control. That is a checked implementation fact, not a diagnosis of the
designer's concern or evidence that a particular replacement is needed.

The trial should let the designer articulate the problem and investigate a
manageable part of it with useful agent support. No control, instrument,
interaction model or visual direction has been selected. The first experiment
depends on what the discussion reveals.

The [design principles](../design.md) provide relevant context: flight controls
are equipment used while flying, actions should answer clearly, and keyboard
and landscape iPad touch serve the same game. How those principles bear on this
specific problem remains to be discussed.

The design record should preserve the question, useful observations, decisions,
reasons and remaining uncertainty. A small separate method note can retain
where collaboration helped or obstructed the work. Whether that note is useful,
and where it lives, is open; it should not require a process review after every
design decision. Human playtesting remains outside the repository, as required
by the repository's working instructions.

## What remains open

- **The weapons problem.** What is unsatisfactory in the intended flying
  experience? Does it concern information, interaction, appearance, or something
  else? These are possibilities, not a prescribed scope or an interview the
  designer must complete before speaking freely.
- **Direction within exploration.** How can the agent make useful suggestions
  while leaving the designer in control of what is investigated? When does a
  request already provide enough direction to act, and when would discussion
  help more than construction?
- **Progress between parts.** What shared understanding makes alignment useful,
  and when should it return a question to exploration? Is an independently useful
  result ready to consider for adoption while other questions remain open?
- **The adoption map.** How much technical investigation makes implications
  concrete without turning this part into detailed engineering design?
- **The record and tools.** Which existing page conventions support thinking,
  and which impose work without helping the designer? What evidence needs to
  survive a changing or retired instrument?

## Later: revising the practice from the trial

The trial can inform a targeted revision of the design-study skill and its
exploration and writing references. It cannot establish every rule for every
future study. Retain the distinction between observations from this trial and
claims about studies generally; discuss lessons before adopting them.

The [Studies spec](../specs/studies/spec.md) owns publication, routes, metadata,
embedded tools and closed records. It already distinguishes study selection
from project adoption. Any change to those contracts would need a spec decision;
changing conversational practice alone need not change them. The registry at
`apps/web/src/data/studies.ts` and `apps/web/src/layouts/StudyLayout.astro` are
implementation touchpoints if phase presentation changes; that need has not
been established.

For any weapons proposal, the owning game and shared-control specs will need
to be identified once the actual problem and proposed scope are understood.
Study decisions hold inside the study. Adopting a result still requires the
project to decide whether it wants the change and where it applies, then record
that intent in the owning specs before changing shared implementation.


## Trial observation: basic tooling by 02.2

**Designer assessment, 24 November 2026:** reaching the useful instrument in
02.2 would have taken much longer under the previous study practice. The
first live-game experiment exposed why flight was unhelpful for this task;
the next iteration supplied a stationary backdrop and held control states.
The designer considers this a strong early sign that the new direction works.
This is their assessment of this trial, not a measured comparison or a general
conclusion about every study. The [study record](../../apps/web/src/pages/lab/studies/flight-deck-weapons-2026-11-24.mdx)
retains the experiments and their captures.

## Agreed rewrite, 24 November 2026

The designer approved replacing the skill with a lean working agreement based on
this trial: designer-led inquiry, agent initiative within the requested step, and
four parts for problem development, exploration, game-design fit and an adoption
map. The mandatory question test, transition machinery and automatic replacement
of rejected proposals are retired. The main skill now holds the working guidance;
instrument construction and publication remain with their existing owners.

The former skill and its references remain recoverable in Git history. The trial
informs this direction without making its particular apparatus a requirement for
other studies. Future use will show where the rewritten guidance needs adjustment.
