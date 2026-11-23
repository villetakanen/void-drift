# Gravity and Render spec review — 2026-11-23

## Intent and scope

The designer asked whether the Gravity field spec was dated or out of step with
ASDLC, then asked to narrow it against the current code before discussing intent.
They clarified that Context should explain why the feature exists as a whole,
not link the study that originated it. They requested the same review for Render
and authorized the proposed split. This loop changed documentation, not gameplay;
the Gravity commit also snapshotted unrelated in-flight unit-test pruning.

## Delivered and observed

- `58d98624`: [Gravity field](../specs/game/world/gravity-field/spec.md) now owns
  well strength, reach, summed pull and the shared Mercurial mass rule. In
  `Physics.ts`, the unbounded formula reaches the cutoff at the boundary, but
  the applied acceleration is zero there. The context explains why wells make
  routes worth choosing without relying on the study link.
- `cf7a5d45`: [Render](../specs/game/render/spec.md) now owns the shared frame
  model. [World-body rendering](../specs/game/render/world-bodies/spec.md) owns
  composition, binding and culling; [FX](../specs/game/render/fx.md) owns light
  history. Source inspection found that `drawFlightFrame` clears the display FX
  canvas before drawing and that FlightDeck can resize the backing canvases
  without a simulation tick. The updated contract distinguishes no new emission
  or fading from a pixel-identical frame. Render subtree metadata was migrated;
  the earlier human verification on Game field was retained.

## Checks

Local shared checkout, macOS arm64. The retained changed-mode reports record
Node 24.14.0, the base revision, changed paths and a source fingerprint.

| Worktree | Command and outcome | Source |
| --- | --- | --- |
| Gravity over `5062b444` | `pnpm verify:changed`: repo, lint, types and tests passed; partial | `artifacts/verification/2026-11-23T10-46-33.140Z-NBPzLy/report.json` |
| Render over `58d98624` | `pnpm verify:changed`: repo and lint passed; partial | `artifacts/verification/2026-11-23T11-17-31.095Z-WG4b34/report.json` |

Session output records that the targeted `pnpm check:specs` runs initially
reported non-human verification (one finding for Gravity, four for Render),
then passed after edits. Focused Vitest runs passed nine tests each: MassWell,
Sun and Mercurial for Gravity; Flight frame, FX surface and FX integration for
Render. Those focused runs used pre-commit worktrees; standalone transcripts
are not tracked. Neither changed-mode run selected build, browser, backend
rules or competition checks; Render did not select types or unit tests.

## Human confirmation and publication

Ville Takanen confirmed the revised Gravity spec ("verfied, by me") and then the
updated Render documentation ("verified across the board"). The documents
record those confirmations on 2026-11-23. They are document verification, not
confirmation of a release or of how pilots experience the mechanics.

Both commits were made locally and successfully pushed to `origin/feat/0-7-0`.
There was no deployment or live verification in this loop. The verification
reports and logs are ignored local artifacts and may not be available in another
checkout. The code and tests show the example flyby and fall outcomes; they do
not establish how readable that choice is to a pilot.
