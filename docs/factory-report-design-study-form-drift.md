# Design study form drift and harness repair

29 October 2026. Handoff to the factory agent.

The planetary study failed to reproduce the working experience of the button study.
The clearest harness defect is that the current instructions prescribe a comprehensive
status report, while the expected experience is a numbered study developed one section
at a time. Repair that contract before attempting another planetary study.

This report records the assessment requested in the current conversation. The repair
below is proposed work, not an implemented or validated harness change. Do not treat
planetary prose generated during this attempt as accepted game design.

## Expected experience

The designer supplied this explicit form after repeated attempts to correct the page:

> 01 / [scenario, design problem, whatnot, the context]
>
> 02 / ... to be filled after 01 is done

The reference is [the button study](../apps/web/src/pages/lab/studies/buttons.astro),
whose opening is “01 / Situations before styling.” Its
[retrospective](factory-experiment-design-studies.md#explain-the-situations-before-proposing-appearance)
records specific appreciation for explaining situations before proposing appearance.

The requirement is progressive development, not just numbered headings. Section 01
should make the subject understandable and support discussion. Later substantive
sections develop as the discussion reaches them. The finished button page has many
sections; copying its completed state into a new study would miss that distinction.

## Short turn history

This summary covers this conversation, not every earlier planetary attempt mentioned
in repository records.

1. **Study requested.** The designer described three reasons for planets: a solar
   system looks compelling, gravitational slingshots enable exciting extra speed,
   and collision obstacles add difficulty. Planets and moons have almost the same
   gameplay role, differing in whether they orbit the sun or a planet. The request
   was to launch a study and guide the discussion.
2. **Initial production.** The agent read the study skill and specification, found
   an unfinished planetary page, and reused its URL. It generated a multi-section
   report covering purpose, principles, investigation, review, implementation, and
   history, retaining the failed draft in a disclosure. It asked whether slingshots
   should be optional or essential to survival, a distinction introduced by the agent.
3. **First rejection.** The designer could not understand what the study was doing,
   objected to references to an “owner,” and described the page as generated slop.
   The agent replied with more useful reasoning about attraction versus collision
   danger and system composition versus close-pass visibility, but did not update
   the page in that turn.
4. **Page mismatch identified.** The designer pointed out that the reasoning was
   absent from the page, the study form was missing, and earlier materials appeared
   to be causing drift. The agent promised a rewrite and emphasized separating ideas
   by source. The designer challenged why authorship mattered. The agent answered
   that distinction in chat; the promised page repair remained unfinished.
5. **Lack of progression challenged.** The designer asked whether the work had stalled
   again. The agent rewrote the page, removed earlier material and “owner” language,
   and put the reasoning into five substantive sections. It still did not use the
   expected numbered, progressively developed form. Build and browser inspection
   confirmed the page rendered, not that it met that expectation.
6. **Harness problem made explicit.** The designer clarified that agent explanations
   were unwanted, identified the problem as a failure to repeat the successful study
   through the harness, and supplied the 01 / 02 form above. The request shifted to
   assessing the harness rather than continuing planetary design.
7. **Assessment and handoff.** The agent compared the button page, retrospective,
   skill, specification, and working-tree changes. It identified the mechanisms below.
   The designer requested this report for the factory agent.

The designer explicitly framed this as a harness issue rather than a request for
agent self-blame or repeated explanations of agent behavior.

## Findings from the instructions and artifacts

### The specification prescribes a different page

The [current presentation contract](specs/design-studies.md#current-study-presentation)
says “Use this outline” and enumerates purpose and phase, agreed foundation, current
investigation, review focus, and decision history and integration. The
[skill](../.agents/skills/design-study/SKILL.md#working-surface-and-evidence)
directs the agent to follow that outline.

The working-tree diff shows that this outline was added as part of the phased inquiry
changes. The earlier skill instead said to start with situations and interaction
structure before styling. The new instructions made an abstract report more explicit
than the successful study form. The resulting planetary pages closely followed that
new outline.

### Phases do not constrain what gets filled now

Purpose, exploration, and integration are described as sequential work, but the initial
page outline requests content spanning the whole process. There is no explicit rule
to develop section 01 and leave section 02 unfilled until section 01 is settled.

This supports a concrete failure mechanism: an agent can satisfy the page instructions
by producing a complete-looking report before a shared understanding has developed.
The last rewrite demonstrated that better prose alone did not fix progression.

### Mandatory reading reintroduces failed study content

The entry specification contains detailed planetary attempts, assumptions, proposed
experiments, and stale descriptions. The skill also asks for stable URLs, retained
reference material, and cumulative agreements. During this run the agent read that
material and initially retained the failed draft in the new page.

Those instructions do not clearly distinguish preserving agreements in an active
study from importing rejected proposals into a fresh attempt. The evaluation protocol
already calls for excluding failed presets and retrospective diagnoses from an initial
brief, but the normal mandatory reading path undermines that separation.

### Process vocabulary becomes study content

The skill requests separation of designer statements, sourced knowledge, and agent
hypotheses. The specification repeatedly uses “owner,” acceptance, and phase language.
The page reproduced this vocabulary as visible content. Distinguishing intent,
observations, and untested ideas is useful; labeling paragraphs by authorship did not
help this discussion. Removing a word alone would not correct the underlying form.

### Rendering checks cannot establish study progression

Formatting and production build passed for the latest rewrite. Browser inspection
showed the rewritten page. These checks do not establish that the study follows the
expected form or provides a useful discussion. The page remained wrong despite them.

The observed instruction-to-output match supports this diagnosis. It does not isolate
a single causal prompt or prove that a particular model cannot conduct the study.

## Proposed repair scope

1. Make the numbered, progressively developed page the explicit presentation contract.
   Start with a subject-specific **01 / situation, context, or design problem**.
   Show **02 / To be developed after 01** without filling future substantive sections.
2. Define how section 01 becomes sufficiently settled and how later sections grow
   through discussion. Avoid both premature completion and a generic approval interview.
   Contribute useful reasoning within the current section; unresolved mechanics can
   remain questions for subsequent investigation.
3. Keep purpose → exploration → integration as working guidance. Do not require those
   phase names, attribution categories, or integration bookkeeping as the opening
   study's content headings.
4. Separate reusable instructions from specific failed studies and retrospectives.
   Keep the latter available for factory diagnosis, outside mandatory new-study reading.
   Preserve active agreements without silently reviving rejected proposals.
5. Provide the button opening as the concrete form reference, with its historical
   content clearly separated from the reusable pattern. Do not copy button-specific
   design decisions or every section of the completed page.
6. Add a first-page review for form and scope. A build pass is still necessary for a
   working page, but is not evidence of a successful design discussion.

Review both the skill and specification together so they cannot continue prescribing
conflicting experiences. Reconcile the evaluation protocol with the repaired entry
path. Keep this report as evidence rather than automatically promoting every proposed
repair into a new standing rule.

## Acceptance criteria for the repair trial

- Given the original planetary brief, the initial page contains a useful numbered
  section 01 grounded in spectacle, slingshot speed, collision danger, and the shared
  planet–moon model. It does not require the designer to invent mechanics in advance.
- Section 02 remains an unfilled next stage until section 01 is settled through the
  conversation. The initial page is not a full lifecycle report with numbered headings.
- Rejected planetary drafts and their assumptions do not appear as current content or
  become a hidden foundation for the fresh study.
- Feedback changes the current page as well as the chat. Useful reasoning is not left
  stranded in conversation while an outdated page remains the review surface.
- Once section 01 is settled, the next substantive section advances the study while
  preserving the agreed foundation. Progression does not mean repeatedly restarting
  purpose or asking for abstract approval.
- Human review confirms that the experience resembles the intended study. Rendering,
  code correctness, and design usefulness are recorded separately.

## Handoff boundaries

No harness files were changed for this assessment or report. The planetary page was
rewritten earlier in this conversation and remains an unsuccessful exploratory artifact.
There are substantial pre-existing working-tree changes to the skill, specification,
layout, physics, and other files; inspect their provenance before editing or committing.
No commit, push, publication, or message to another chat is part of this handoff.
