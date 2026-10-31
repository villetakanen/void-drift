# Void Drift rebuild charter

Status: agreed direction from the owner's conversation on 2026-10-28; delivery is incremental.

## Purpose

Make Void Drift playable and fun while using its development to build and evaluate a voice-led software factory. The owner describes problems and desired experiences in long, conversational prompts. Agents translate that intent into bounded changes, executable checks, and playable evidence. An editor remains optional for investigation.

This charter supersedes the old backlog and phase roadmaps as work-selection authority. Historical files remain reference material; their unfinished items are not commitments. Existing code is evidence of implementation, not proof of intended behavior.

## First complete experience

- Choose one of three ships with distinct, understandable characteristics.
- Fly a challenging but approachable survival run and compete against other players' high scores.
- Use keyboard controls on a laptop or desktop; retain landscape phone play with two touch controls from the beginning.
- Provide both automatic framing/zoom and arena edge wrapping, with Star Control 2 as the owner's camera reference. Exact framing targets, limits, and wrap transitions need a playable Lab comparison.
- Keep appearance, motion, camera, and feedback coherent and polished through the Lab.
- Players choose ships; flight tuning belongs in the Lab. The owner can supply target values or describe a desired feel to the agent. Accepted tuning becomes versioned configuration used by the real game.
- Shooting, equipment systems, player flight tuning, and synchronous multiplayer are not required for this first experience.

Firebase is the selected backend direction, reconfirmed by the owner on 2026-10-28. Supabase code is migration input. Define Firebase schemas, access rules, and migration scope before replacing it. Existing dependency approval and no-paid-service constraints still apply.

## Development experience

The default surface is conversation plus a browser showing the game and Lab. Build a separate developer dashboard only if use reveals a need. The agent handles repository operations and answers branch, check, commit, push, and release questions from inspected evidence. A successful local build is not a release.

Agents may implement, repair, verify, and make local commits within the agreed scope. Human checkpoints assess product intent, visual quality, and game feel. Pushes and publishing require explicit authorization. Preserve pre-existing changes and identify their provenance when committing. Current rules still require approval for new npm dependencies and changes to gravity/friction.

## Delivery sequence

1. Establish an honest baseline and deterministic verification entry point. Demonstrate that a deliberately broken contract fails. Make local game/Lab development independent of live credentials.
2. Deliver selectable ships whose configurations actually affect flight, with reproducible Lab trials and keyboard/touch coverage.
3. Design automatic camera framing and wrapping in the Lab, then verify the same behavior in the game.
4. Restore shared competition on Firebase with validated data, tested security rules, clear offline/failure behavior, and an explicit score-integrity policy.
5. Playtest difficulty and fidelity, assemble release evidence, and review what the factory taught us.

Each increment should expose something inspectable or playable. The MVP is incomplete until the shared leaderboard works; offline development is a factory capability, not a substitute.

## Learning from the factory

Use ASDLC patterns as design inputs and evaluate their usefulness in this project. For each meaningful finding, retain the triggering problem, relevant pattern, reproducible evidence, intervention, result, and limits. Draft maintainer feedback from those observations. Review candidate lessons with the owner before promoting them to standing agent rules. Sending feedback externally requires explicit authorization.

## Open design decisions

- Camera framing subjects, zoom bounds, and wrap presentation, resolved through Lab examples.
- Shared-score fairness: casual client-submitted competition versus verified runs; ranking across ship types and future balance versions.
- Initial release destination and whether existing leaderboard data needs migration.

## References

Consulted 2026-10-28:
- [ASDLC Specs](https://asdlc.io/patterns/the-spec/): maintain intent and acceptance contracts alongside implementation.
- [Agent Constitution](https://asdlc.io/patterns/agent-constitution/): keep operational boundaries explicit.
- [Experience Modeling](https://asdlc.io/patterns/experience-modeling/): enforce shared visual definitions and show them in the Lab.
- [Compound Loop](https://asdlc.io/patterns/compound-loop/): review lessons before adopting durable guidance.

## Next phase — ship builder, 2026-10-30

The owner authorizes a playable 0.4.0 alpha built from the agreed
[ship-builder brief](specs/ship-builder.md), followed by focused design studies for
amendments revealed through play. Player fitting now belongs in scope: fixed slots,
visible parts, mass-based directional engines and energy tradeoffs. Desktop is the
builder acceptance target; mobile sizing/layout is deferred. Weapons are static;
purchasing parts and shooting for credits remain future scope. Custom survival is
initially unranked, preserving the existing stock competition contract.
