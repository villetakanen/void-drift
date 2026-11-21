# Combat HUD: grounding record and inconclusive closure

## Initial recording pass / Scope and evidence

19 November 2026. This record covers the conversation about grounding the
Combat HUD study through 02.7 and the proposed continuation. It does not close
the study or accept a HUD treatment. Conversation feedback is the primary
source; this record does not claim independent review of every earlier image.

Local inspection at HEAD `f8b9cba793ede22254ef1a1e3523f8ab089bef88`, with
pre-existing uncommitted changes, found the current study in
`apps/web/src/pages/lab/studies/combat-hud-2026-11-19.mdx` and the existing
pirate marker in `apps/web/src/components/FlightDeck.svelte`.

## Designer feedback and decisions

- The designer retained the circular arrangement at the active-area edge and
  found the positioning and illustration promising. This did not accept a
  visible circle or any proposed marker treatment.
- The designer assessed the later treatments as not belonging to the game's
  HUD language. For 02.7, text, lines and numbers read as helper text; the
  stated preference was to avoid icons and font-based approaches as much as
  possible unless decorative.
- The designer paused the study and raised the omission of the game's
  existing pirate-direction markers from the discussion.
- The agent proposed correcting the grounding workflow and continuing from
  the existing pirate marker. The designer challenged that response:
  “its just a failure to ground - not imperative direction.”
- The ensuing clarification distinguished inspecting relevant existing game
  elements from requiring their reuse. The pirate marker is relevant evidence;
  it is not a selected solution. Reuse, adaptation and departure remain open.
  The designer requested that this distinction be logged, then the discussion
  continue.

## Directly inspected implementation

`FlightDeck.svelte` currently computes offscreen bearings for surviving
Gauntlet opponents and renders a small purple, glowing triangle for each.
The marker has no visible type label or numeric distance. Its position is
clamped inside the rectangular screen boundary. This source inspection
establishes an available reference, not its effectiveness in play or approval
for this study's circular arrangement.

## Interpretation and limits

The agent described the preceding sequence as a grounding failure and proposed
inspecting the game, design system and relevant implementations before visual
experiments, explaining how that evidence informs the experiment. This is an
attributed process interpretation, not proof of a harness defect or a general
requirement derived by this report. Existing implementation does not by itself
prescribe desired design intent.

No marker appearance, distance encoding or vocabulary for the four target types
was selected in this exchange. Earlier screenshots were not independently
re-evaluated during this recording pass. No gameplay or browser verification
was run for this report. Only this documentation was changed; no skill,
production code or study example was changed by the recording pass. No commit,
push or deployment was performed.

Validation: `git diff --check -- docs/loop-evidence/2026-11-19-combat-hud-grounding.md`
passed for the documentation-only recording pass.


## Closure addendum / 19 November 2026

The designer explicitly closed the study as **inconclusive**: “we have not
established the design problem exists, nor did we ground the study to the
product.” The designer identified the grounding-to-product finding as the
study's strongest result. This is the designer's assessment, not a causal
finding that the harness is defective. The lack of an established need does
not establish that no need exists.

### Scope and retained decisions

The study explored a separate information layer inside the active flight area,
with reported needs to find an offscreen sun, derelict, released energy and
pirate. Later working assumptions were target type, distance and direction on
an invisible circle at the active-area edge. These assumptions and the
promising positioning/illustration were not accepted as product requirements.

After the initial recording pass, 02.8 compared miniature production artwork
with size or opacity encoding relative distance. The designer called it the
first step that felt like it explored section 01, then ruled out miniatures:
the world HUD is unicolour, with one or more colours open to exploration but
not target-specific object shapes. Neither distance treatment was selected.
02.9 compared a single green ink with target colours on identical markers;
no designer assessment of that comparison preceded closure.

The distinction recorded earlier remains: grounding supplies relevant product
evidence and does not mandate copying the pirate marker. This closure makes
no process amendment, general recommendation or project-level HUD decision.

### Delivered closure and retained evidence

- Registry status is `stopped`, phase `exploration`; the page explicitly labels
  the outcome inconclusive. The existing schema has no `inconclusive` status.
- The stable study page is
  `apps/web/src/pages/lab/studies/combat-hud-2026-11-19.mdx`. Its closure summary
  records the unestablished problem, inadequate grounding, designer-assessed
  strongest result, and absence of an accepted solution.
- Captures 021–029 remain in
  `apps/web/public/studies/combat-hud-2026-11-19/`. They are authored static
  examples, not evidence of gameplay usefulness. The 029 capture was saved and
  visually inspected in the preceding exploration turn; it replaces the final
  live example without reconstructing that earlier state.
- The final study-only `ContactInk.svelte` component was removed after checking
  consumers. Earlier live examples had already been replaced by their captures.
  The closed MDX contains no client island or study component import.
- Readiness and implementation scope were not reached. No production code,
  shared design system, feature spec or skill was changed by closure.

### Verification and publication

Closure is local, against HEAD `f8b9cba793ede22254ef1a1e3523f8ab089bef88` plus
an existing dirty worktree. Changes in unrelated files are outside this record.
No commit, push or deployment was performed. Earlier browser inspection of
02.8 and 02.9 established rendering of those examples, not the design need or
their effectiveness. An earlier screenshot approval check timed out; its
permitted retry succeeded. No gameplay tests were run or inferred.

Closure verification completed locally: Historical images are retained without claiming a fresh review
of every earlier step. Human feedback here is design judgment, not a playtest
record. The adequacy of existing product feedback and the need for another
information layer remain unestablished.


- `pnpm exec biome check apps/web/src/data/studies.ts`: passed.
- `git diff --check` scoped to registry, study MDX and this report: passed.
- Static-source check: no imports or client directives in the closed MDX;
  all nine referenced captures exist. No remaining `ContactInk` consumer.
- Browser at localhost:4321, 1280px viewport: rendered `exploration / stopped`,
  the inconclusive closure and strongest-result assessment; 02.9 is a static
  image and readiness/scope are explicitly not reached. Closure preview:
  `apps/web/public/studies/combat-hud-2026-11-19/closure.jpg`.

These checks verify the closure artifact. They do not establish the design
problem, product grounding or gameplay usefulness.
