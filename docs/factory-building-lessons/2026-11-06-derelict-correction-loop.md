# Derelict correction loop — analysis for review

Status: requested analysis and proposed safeguards; not adopted factory policy.
Source: [closure evidence](../loop-evidence/2026-11-06-derelict-draft-two-closure.md)
and the conversation it records. We can explain observable interaction patterns;
we cannot establish internal model causes or guarantee future model behavior.

## What failed

The owner's clarification identifies the central failure: the study could not
visually compare live game-state changes. Discussion then moved to irrelevant DOM
placements and rationales for previous steps. Neither advanced the design inquiry.
The problem was not a need for better explanations of the viewer implementation.

The observable sequence supports that account: useful artwork and initial scale
examples were followed by an unusable close/far comparison, presentation changes,
and finally chat-only recovery proposals. Those proposals supplied no new visual
evidence. The agent allowed implementation troubleshooting and explanations of its
own choices to become the study's subject.

A plausible mechanism is displacement of the design question by the means used to
show it: each response addressed the immediately preceding implementation problem,
without restoring the missing live comparison. Subsequent explanations maintained
that diversion. This is an interpretation of observable behavior, not knowledge of
internal model state or a universal cause of correction loops.

## Proposed constraint for the restart

The next deliverable must restore a usable visual comparison of live game-state
changes. Continue the design exploration through that comparison. Do not make the
user review DOM arrangements, implementation rationales, or model behavior.

- Preserve the valuable artwork through 02.2. Size remains undecided.
- Use real game state, production ship rendering and the current camera to expose
  the comparison: Wasp and Fiddler, close and far, with a provisional derelict size.
  Controls must change the represented state, so their visual consequences can be
  inspected directly. Keep pause and repeatability available.
- Judge the instrument by whether the user can see and compare those changes.
  Layout and rendering fixes are internal implementation work, not study findings.
- When an example fails that purpose, replace it with a usable live comparison in
  the same turn. Keep the design question fixed. Do not substitute explanations,
  recovery menus, static-reference prerequisites or future-work promises.
- A loop warning during exploration calls for restored design evidence. Discuss
  model behavior only when explicitly requested as separate analysis, as here.

The existing exploration skill already calls for concrete examples and replacement
of unusable attempts. The evidence does not establish a missing-rule problem.
This proposal focuses application of that procedure on the lost design capability.

“Continue exploring” applies while exploration is authorized. Explicit stop/abort
instructions and genuine blockers still govern. Brief delivery information can
accompany an artifact; it must not replace it. No instruction can guarantee that a
model will never repeat this failure. No skill or standing contract is changed here.

## How to evaluate the proposal

In the next study, check the first response to rejected evidence: did it preserve
accepted properties, replace the unusable example, and provide inspectable evidence
in that turn? Record the owner's assessment separately from automated checks.
If it instead produces process discussion or another deferred plan, the proposed
constraint has not worked. Review this proposal separately before editing skills or
standing contracts. No such promotion is made by this document.
