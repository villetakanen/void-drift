# Design-study grounding harness repair

## Scope and sources

19 November 2026. This loop assessed the design-study harness using the closed
[Combat HUD study](../../apps/web/src/pages/lab/studies/combat-hud-2026-11-19.mdx)
and its [grounding and closure record](2026-11-19-combat-hud-grounding.md),
then proposed and applied one approved instruction change. It did not reopen
the study or change production code.

Sources were those records, the current design-study skill and its exploration,
question-test and writing references, skill-creator, close-loop, shared-components,
and the inspected product design, vision, architecture, development and relevant
spec guidance. The conversation in this chat supplies the assessment, approval
and command results. Historical images and the full originating conversation
were not independently reconstructed.

## Assessment and decision

The agent assessed the evidence as supporting inadequate grounding, while
distinguishing existing instructions that were not fulfilled from underspecified
guidance about what product inspection must contribute. The agent identified
tension between investigation and same-round concrete delivery, but did not
establish delivery pressure as a cause.

Counterevidence remained explicit: the retained 02.2 prose mentions pirate
bearings, so the assessment did not claim they were never inspected. Their late
use in the design discussion is reported by the earlier closure record.
That record preserves the designer's assessment that product grounding was the
study's strongest result and that the proposed problem had not been established.
Neither a need nor the absence of a need was established.

The agent presented one exact diff for review. The designer replied “fix it”,
authorising that proposal, then requested “close loop” after implementation.
Approval records the chosen repair; it does not demonstrate its effectiveness.

## Delivered change

The opening instruction under “Start from established reality” in
[design-study/SKILL.md](../../.agents/skills/design-study/SKILL.md) now asks the
agent to inspect relevant product behaviour, visual language and guidance before
proposing an example, and explain how they inform the question and proposal.
It distinguishes observed gaps from hypothesised needs, permits a concrete
example to investigate whether a need exists, and states that grounding does
not require reuse and is not established by tokens or drawing functions alone.

This was the only harness edit in this loop. The closed study and its earlier
report were not edited. Closure adds this separate record for the harness work.

## Verification and publication

Implementation checks ran in the shared macOS checkout at
`/Users/ville.takanen/dev/void-drift`, against HEAD
`f8b9cba793ede22254ef1a1e3523f8ab089bef88` plus the uncommitted skill patch and
pre-existing unrelated work. This revision alone does not identify the dirty tree.
Results below were directly observed in this chat, not inferred from other runs:

- `python3 /Users/ville.takanen/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/design-study`:
  passed, reporting “Skill is valid!”.
- `git diff --check -- .agents/skills/design-study/SKILL.md`: passed.
- Inspection of the scoped diff confirmed the approved replacement.

No independent behavioural evaluation, new study, gameplay test or browser
verification was run. Structural validation does not demonstrate that future
agents will ground their work adequately. No persistent test report or full
source fingerprint was generated; the commands and outcomes are retained here.

No commit, push, deployment or live verification was performed by this loop.
Closure validation is limited to this new Markdown record.
