# ASDLC field report: two conversational development loops in Void Drift

Draft for review, 28 October 2026. Not sent.

We are rebuilding a small procedural space game while exploring software development
through spoken prompts, an agent, and browser-based inspection. The developer describes
intent conversationally and reviews concrete results; an IDE is optional. Our repository
charter takes ASDLC's Spec, Agent Constitution, Experience Modeling and Compound Loop
patterns as design inputs. This report is not an assessment of conformance to a particular
ASDLC version.

We have two local case records to share. The observations below are findings from those
records, not established signals about agentic development or proof of a general method.

## Case 1: restore playability and establish verification

The first loop delivered three selectable ships, shared game/Lab flight code, explicit
simulation steps and seeded trials, camera framing and wrapping, keyboard/touch controls,
and a Firebase leaderboard. The owner positively assessed the released result.

An earlier passing build and 13 unit tests had not established that ship profile values
affected flight. The expanded checks exercised actual profile differences and browser
movement. Temporarily ignoring thrust multipliers caused a simulation test to fail;
restoring the implementation restored the expected behavior.

A verification entry point ran eight stages at that checkpoint: instruction-file contracts,
lint, types, unit tests, build, browser tests, Firestore rules and multi-player leaderboard
integration through local emulators. It retained commands, outcomes, revision, dirty state,
environment and a source fingerprint. CI separately passed on the committed revision.

Live readiness required another check. Firebase accepted deployment and a completed
score submission while its new leaderboard index was still building. Score reads worked
only after that index became ready. Local correctness, deployment success and a working
live user journey were distinct observations.

## Case 2: explore and promote a design decision

The second session's retrospective reports a button study developed through conversation
at a stable browser URL. The owner reviewed situations and compositions, corrected the
agent's assumptions, accepted a baseline, and authorized integration into shared styles
and application consumers. The report records a verified 0.3.3 release.

Some corrections concerned the design itself: application states were more relevant than
generic confirmation-dialog categories, and 8px spacing was preferred after viewing 16px.
Other corrections concerned work already represented in the repository: initial examples
recreated rectangular buttons instead of consuming the existing angled styles.

The study also distinguished shared design tokens from component-private composition.
The initial audit proposed making too many values global; the owner clarified ownership.
Integration included focus, disabled and motion behavior, compatibility aliases, consumer
updates and a canonical Lab reference. Acceptance of a study did not itself mean its
consumers had been migrated.

The retrospective reports an actual source-fingerprint rejection: files changed during
verification, so individual passing checks did not produce an overall pass. It also reports
a port-collision risk and overlapping browser runs with missing trace files. Shared output
interference was considered a possible contributor, not a demonstrated cause of a timeout.

## Evidence collection and interpretation

Our owner has made a boundary explicit: **a finding is not a signal**. Closing a loop
should collect attributable observations, check outcomes, decisions, feedback and gaps.
Interpretation across those records is a separate activity. A closure record should not
automatically generate lessons, new agent instructions or a next-loop backlog.

That distinction matters in these cases. We observed successful delivery and positive
feedback, but did not compare model tiers, measure cost savings, establish an optimal
workflow, or test whether these outcomes generalize. One study used one agent; multi-agent
exploration was discussed but not exercised. No inference about its value follows.

There are also limits to the records themselves. Both retrospectives identified stale
status language in specifications. Heavy verification artifacts are locally ignored or
subject to CI retention. The narratives preserve key observations, but they are not a
complete, permanently retained execution archive. Client-reported scores are casual
competition, not proof of honest play. Physical-device performance remains unmeasured
in these reports.

## Questions for the ASDLC community

- How do you distinguish evidence collection at loop closure from subsequent signal
  identification and interpretation? What records make that distinction inspectable?
- How do you represent human acceptance, implemented behavior, automated verification
  and live readiness without collapsing them into one completion status?
- What minimal provenance should survive when detailed traces and logs expire?
- How do you preserve decision history while keeping current specifications unambiguous?

We would be interested in comparable cases and counterexamples. The purpose of sharing
these two loops is to make our observations available for discussion, not to claim that
they validate a general approach.

## Source records

- [Playable-alpha retrospective](../docs/factory-experiment-alpha.md): first-loop evidence,
  limitations and the interpretations recorded at that time.
- [Design-study retrospective](../docs/factory-experiment-design-studies.md): second-session
  report; this draft does not independently reverify its release claims.
- [Design-study specification](../docs/specs/design-studies.md): workflow and promotion history.
- [Factory contract](../docs/specs/voice-led-factory.md) and
  [development guide](../docs/development.md): repository workflow context.
- [First-loop CI run](https://github.com/villetakanen/void-drift/actions/runs/40675444224).
- Public examples: [flight Lab](https://void-drift-alpha.web.app/lab/flight),
  [button reference](https://void-drift-alpha.web.app/lab/buttons), and
  [button study](https://void-drift-alpha.web.app/lab/studies/buttons).

Local source links assume access to this repository. Before sharing, choose the audience
and include the relevant records or replace local links with accessible references.
