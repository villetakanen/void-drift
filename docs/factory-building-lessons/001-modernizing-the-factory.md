# 001 — Modernizing the factory

Recorded here on 29 October 2026 as the first factory improvement, following the
designer's numbering. This is an index to existing evidence, not a new retrospective.

The modernization established a voice-led path from intent through bounded changes,
deterministic gates, inspectable Lab evidence, and human experience review. It made
local verification, acceptance, and publication distinct claims.

The durable lesson is to make delivery and its evidence reconstructable while keeping
human assessment of feel and fidelity separate from automated correctness.

- [Alpha retrospective](../factory-experiment-alpha.md): outcome and learning.
- [Factory specification](../specs/voice-led-factory.md): contracts and delivery history.
- [Development guide](../development.md): current commands and known limits.

These sources own detailed evidence and limitations. This summary does not assert
that all factory acceptance criteria or human experience checks are complete.

## Done — prepared release artifacts, 2026-11-03

- [x] Add repeatable production preparation and publish the exact prepared artifact.
  Trigger: [0.4.9 passed checks but lacked production configuration](../releases/0.4.9.md#verification).
  Delivered: [release runner](../../scripts/release.mjs),
  [environment/report schemas](../../packages/core/src/lib/schemas/release.mjs),
  [built-site smoke](../../scripts/release-smoke.mjs) and
  [documented commands](../development.md#release).
  Verification: [regression cases](../../scripts/release.test.mjs) and
  [run outcomes and limitations](../loop-evidence/2026-11-03-factory-harness-amendments.md#verification).
  Done means the tool is implemented and locally checked; it does not mean a release
  was published or that live backend availability was verified.
