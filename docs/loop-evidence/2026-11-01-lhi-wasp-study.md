# LHI Wasp design study — failed and closed

Date: 2026-11-01 (Europe/Helsinki). Branch `claude/lhi-wasp-design-study-a9008a`.
Outcome: owner-declared failure. Filed as failed on Claude Fable 5.1 at medium
reasoning effort, per the owner's instruction. Study page and commits are retained
for inspection; status is `closed`.

## Intent and scope

The owner supplied a grid-paper sketch and asked for a design study of the LHI Wasp:
a very small, nimble training vessel with four stabilizers instead of one, intended
as a predictable platform for testing mechanics. The sketch was to set proportions,
size and shape; its slots were drawn in rough scale to the other ships. The sketch is
preserved at `apps/web/public/study-references/lhi-wasp-sketch.webp`.

## Delivered work and changes of direction

All work is local on this branch; nothing was pushed.

- `daf8d98` opened `/lab/studies/lhi-wasp-2026-11-01` with section 01 and a trace of
  the sketch beside the production Scout at equal scale. Section 01 framed the
  stabilizer mechanic as the cycle's unknown.
- Owner correction: stabilizers are "a given thing"; every ship already stops
  rotating on release, and the Wasp "just happens to have four of them" because it
  has no side engines. `a39453f` amended 01 accordingly.
- Owner: "Yes, start 02". `0f12c19` added 02.1, the stabilizer-firing states on a
  fixture hull, with a flight-scale strip.
- Owner review of 02.1: useful, but "like with other ships, we need to draw the
  low-poly-fake-3d shape first"; the sketch's lines mark expected folds. Request:
  six chassis variations without engines, slots or stabilizers.
- `5591bb8` added six bodies as flat facets with a tone chosen per plane.
  Owner: "None of these looks even remotely of 3d space ship?" Request to redo all six.
- `539634d` rebuilt all six with per-node heights and computed shading on the full
  sketched outline. Owner: "All of these are really bulky"; the intent was a slim
  fighter-jet-like body, small wings, very compact canopy, very low poly. Redo all six.
- `1b7dcdb` redrew all six as slim bodies with invented wing shapes, keeping only the
  sketch's length and shoulder width. Owner: "what happened now, we completely lost
  the outer shape?" The agent confirmed the outline was dropped by its own choice.
- `1fd6088` redrew all six inside the traced outline with a narrow raised fuselage
  and thin wing plates. The owner then declared the study failed.

No body was accepted. Parts 03 and 04 were not started. The study page records each
replaced set and the stated reason in 02.2.

## Checks

Per round the agent ran Biome lint (`pnpm lint`) and `astro check` on the web app;
both passed at every committed revision. The full `pnpm check:types` gate passed once
near `daf8d98` after installing dependencies in the worktree. No unit tests, browser
tests, contract checks or `pnpm verify` were run; the study added no simulation or
production code. Rendering was inspected in the in-app browser at desktop width each
round and at phone width once at the opening page. These checks establish that the
pages render, not that any body is acceptable.

An untracked `.claude/launch.json` was created for the dev-server preview and is not
part of any commit.

## Human feedback

Quotes above are the owner's, in order. Closing instruction: "its clear this study
failed on loop mode., lets figure out why" and "close loop, file this as failed on
fable 5.1 medium". The owner's 02.1 remark that the comparison "is itself useful"
stands as bounded feedback on the firing-state language only.

## Interpretation at closure — attributed, not a lesson

The following is the agent's own analysis given in chat when the owner asked why.
It is recorded as that claim, not as an established cause or standing rule.

- The sketch already contained the constraint set: a nose as narrow as the fuselage,
  a spar line, a shoulder, a compact outline and fold lines marking thin wings. The
  agent read only the outline and slots from it in 01 and never derived "slim
  fuselage with thin wing plates" until the fourth body round.
- The first body round drew tiles without first studying how the accepted Fighter,
  Scout and Cruiser build volume; that was examined only after rejection.
- Each later round changed one dimension in reaction to the latest remark (tone,
  then height, then planform, then outline) instead of fixing the whole constraint
  set before drawing. Round three dropped a boundary the owner had never released.
- Six variants per round across four rounds put twenty-four bodies in front of the
  owner without a single-body check-in that could have caught the misreading early.
- Section 01 framed a mechanic the owner considered settled as the unknown, costing
  a round before exploration began, and 02.1 chose the mechanic over the form that
  the brief was actually about.
- Whether medium reasoning effort contributed cannot be established from this run.

## Evidence limits

No comparison run exists at another effort level or model. The owner's "loop mode"
phrase is recorded as given; this record does not define it. Study quality was not
scored against the eight-criterion rubric. Only documentation and study status were
changed by this closure.
