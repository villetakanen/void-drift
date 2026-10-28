# Factory experiment: voice-led playable alpha

Date: 2026-10-28. Lesson candidates for owner/ASDLC review, not standing policy.

## Intent and intervention

The owner asked for substantial progress through speech-led requests: three ships,
shared competition, Star Control 2-inspired framing/wrap, and a usable flight Lab.
The old backlog was retired as an authority. A short AGENTS entry point routes to
product, architecture, design and verification contracts on demand.

The implementation extracts one fixed-step simulation shared by game and Lab,
adds validated replay/tuning, replaces Supabase with Firebase and makes one required
verification command produce revision-bound evidence. Existing gravity/friction
constants remain unchanged. Dependencies and publication were explicitly authorized.
Pre-existing ship-selection work was checkpointed separately before this milestone.

## Evidence

- Physics/replay tests exercise profile differences, camera framing, wrapping and death.
- Browser checks exercise actual displacement, simultaneous touch/cancel, replay,
  invalid configuration, restart and a reviewed initial canvas baseline.
- Emulator rules tests reject foreign writes, malformed/unbounded scores and regressions.
- Independent browser identities complete and submit runs; a third sees both results.
- Regression probe: temporarily ignored thrust profile multipliers. The simulation
  test failed (exit 1); original implementation was restored before final verification.
- Full results are recorded in `artifacts/verification/latest.json`; CI uploads its
  own evidence. These records, not this prose, determine the current gate status.
- Firebase project `void-drift-alpha` was provisioned on Spark; no billing enabled.

## Human assessment still needed

The agent inspected the initial visual baseline. The owner has not yet judged flight
feel, relative difficulty, camera comfort or visual fidelity. Physical phone testing
and sustained frame-rate measurements remain open. Casual client-reported scores are
not proof of honest play. Release evidence must be reported separately from local gates.

## Candidate lessons and questions for ASDLC maintainers

1. Voice-first work needs inspectable outcomes and precise status vocabulary. A long
   transcript should become a compact acceptance contract, not a growing instruction file.
2. A Lab is stronger evidence when it drives production systems. Separate demo physics
   could pass visual review while real gameplay remains broken.
3. Deterministic gates need a demonstrated negative case. UI activation alone did not
   establish movement; the old profile multipliers could be ignored without detection.
4. Separate reproducible checks from live-service provisioning and subjective acceptance.
   Authentication setup and free-tier constraints required service-specific evidence.
5. Keep proposed lessons distinct from instructions: which repeated experiments should
   justify promoting a lesson into the factory contract?

No external feedback has been sent. This report is a local case study for review.
