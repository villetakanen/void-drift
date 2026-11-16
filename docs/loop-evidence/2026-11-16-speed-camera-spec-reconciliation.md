# Speed camera specification reconciliation

## Scope and sources

Closed on 2026-11-16 (Europe/Helsinki). This loop covers authoring and correcting
the Speed camera contract, then reconciling active specifications with the
implementation supplied by another agent. It does not certify that implementation.
Sources are the designer's instructions in this chat, direct source inspection
in this session, and the documentation-check tool outputs described below.
Human playtesting observations and screenshots are not retained here, following
the repository's evidence boundary.

## Decisions and delivered documentation

- The designer requested an experimental live-game feature with a persisted,
  default-Off personal preference, rather than a Lab study.
- The initial specification added a Pause switch. The designer rejected that
  placement. The author acknowledged introducing it; the contract now reserves
  settings controls exclusively for Options. Pause contains actions/navigation.
- The designer selected smooth outward zoom and timed inward cuts. The final
  reconciliation instruction specifies 1×, 2×, 4×, 8× and 1.5 continuous seconds
  of eligible active simulation time per inward cut, replacing earlier values.
- The same instruction specifies speed demand through 100/200/300/400 u/s,
  eventual exact centring during constant velocity, and a discrete ZOOM readout.
  These are design decisions, not claims of demonstrated player benefit.

The resulting [Speed camera contract](../specs/game/camera/speed-camera/spec.md)
describes those rules, containment, cut anchoring, lifecycle behaviour, shared
transforms and simulation/scoring independence. Related edits reconcile
[Options](../specs/game/options/spec.md), [Dialogs](../specs/game/dialogs/spec.md)
and [Game screen](../specs/game/game-screen/spec.md). The parent
[Camera contract](../specs/game/camera/spec.md) distinguishes standard framing
from the experimental policy. This session's work is documentation only;
unrelated working-tree changes were preserved.

## Inspection and revision identity

At closure, HEAD is `49c2db95f240c59c05acd5b3ea4d601bc3ef0295` with a dirty tree.
The Speed camera spec is untracked; the related existing specs are modified.
HEAD alone therefore does not identify the delivered text or prototype.

Direct inspection of `packages/core/src/lib/physics/Camera.ts` found four inward
levels, a 1.5-second hold, geometric speed demand, outward filtering, motion
matching and residual centring. Inspection of
`apps/web/src/components/FlightDeck.svelte` found the conditional ZOOM instrument
and a Pause dialog without the preference control. Inspection of
`apps/web/src/components/Settings.svelte` found the Options Camera section.
The settings schema/store and arrival-speed source were also read. This is code
inspection, not runtime verification.

SHA-256 identities captured with `shasum -a 256` at closure:

| File                                          | SHA-256                                                            |
| --------------------------------------------- | ------------------------------------------------------------------ |
| `docs/specs/game/camera/speed-camera/spec.md` | `7af0b5acbdce898b846e948152207e4f19717ba49431f59661ccf8d4d32c2e82` |
| `docs/specs/game/options/spec.md`             | `07822645925fa3ea4f011b4809baddfee68822ca93bfe5a8c6ac7cf905adfe3a` |
| `docs/specs/game/dialogs/spec.md`             | `b481afd0cca466ddb728d214f84df73904779c5304c1dddadc800c67bedf7e9c` |
| `docs/specs/game/game-screen/spec.md`         | `f92aad123f3d40f6c8ea5225b008e41c2634474cede10983a20ba6cfb4e43d9d` |
| `packages/core/src/lib/physics/Camera.ts`     | `aa191ac5c922e98a330a265cd3e11833cd9f6b7e3a9852a50d091909a18ba104` |
| `apps/web/src/components/FlightDeck.svelte`   | `d3392112df9675cf9ba33932974451b2cbf0dd6d81a59f2bf35f72dfe7cf0dc3` |
| `apps/web/src/components/Settings.svelte`     | `788dd1072b32b546bb5e377692dab91e3761194f2278885e5683467db0ba8420` |

## Checks and publication

Environment: local repository at `/Users/ville.takanen/dev/void-drift`, zsh,
Python 3. Checks below belong to the reconciliation turn on the dirty tree above.
Their source is this chat's tool output; no standalone check logs were saved.

- `git diff --check`: passed with no whitespace diagnostics. This checks tracked
  diffs and does not by itself cover the untracked Speed camera file.
- Inline `python3` check resolving relative Markdown link targets in the four
  reconciled specs: passed, reporting “Relative links verified in all four
  edited specs.” This checked target files, not heading anchors or behaviour.
- Targeted `rg` inspection confirmed replacement of the earlier inward timing
  wording and review of current zoom/follow requirements.
- Runtime, unit, browser and Firebase checks: not run in this documentation
  loop. No implementation test report was inspected or adopted as evidence.

No local commit, push, deployment or live verification was performed in this
loop. Other agents' publication state is unavailable here.

## Findings and limits

The active contract's two-second inward delay conflicted with the inspected
1.5-second implementation and the designer's reconciliation instruction; its
rules and scenarios now use 1.5 seconds. The final text also distinguishes
transient off-centre motion from eventual exact centring and describes upper-label
ZOOM behaviour without nearest-level rounding.

The documentation checks establish link-target existence and limited textual
consistency only. They do not establish camera feel, runtime correctness,
cross-device behaviour or satisfaction of acceptance criteria. Dirty-tree hashes
identify inspected content but do not preserve those files as immutable artifacts.
No product acceptance, release readiness, lessons or process changes are inferred.
