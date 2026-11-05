# Camera framing direction and charter archive — closure evidence

Closed 2026-11-04 by owner instruction ("close loop"). This record collects evidence
only. It does not state causes, lessons or process changes.

## Intent and scope

The owner opened a discussion: "lets discuss, this is a fairly complex topic." They
asked whether a return to dynamic zoom is feasible or sensible if the camera always
keeps three things visible: the ship, the closest planetary body or the sun, and the
closest shootable target. They asked for an assessment of performance, UX and
options.

The scope then changed twice:

1. From assessment to planning ("Plan the Lab trial").
2. From planning to clearing historical documents that the owner said were causing
   drift. The camera plan was then rewritten for the in-game camera.

No camera code was changed in this loop.

Source: this chat's owner messages; branch `feat/0-5-0`.

## Sequence and owner feedback

Quotes are short extracts from the owner's messages. Paraphrases are attributed.

1. The agent assessed feasibility from `Camera.ts`, `FxSurface` reprojection,
   `playable-alpha.md` (0.3.1 stepped zoom), `weapons-and-salvage.md` and
   `gravitySource()`. It proposed four options for how the zoom moves and a Lab
   comparison. No profiling was run, and the performance statements were based on
   reading code.
2. Owner chose "Plan the Lab trial". The agent wrote
   `docs/plans/2026-11-04-camera-framing-lab.md`, which was never committed under
   that name.
3. The agent had stated that the reason for replacing continuous zoom was not written
   down. Owner: "we never record to repo data like" that, so claiming it is missing
   "is like claiming water is wet." The agent removed a plan slice that recorded
   owner feel judgements, and wrote a memory entry outside the repo
   (`feel-reviews-not-in-repo`).
4. Owner: "line guides have _constant_ width", and asked whether that is why the
   inspiring games had about four zoom levels. The agent's answer:
   - it attributed Star Control 2's stepped zoom to pre-drawn sprites, from its own
     recall without a lookup
   - it found that production world lines use world-space widths
   - it called that a gap in constant-width guides

   Owner: "guides are "hud" not world, thats intentional." The agent withdrew the
   gap claim.
5. Owner named the active play zone from an earlier controls study, which is
   smaller than the screen: "We want to keep the ship inside that zone always."
   The closest moon, planet or sun must have its centre inside the same box. In
   future, enemies and nearby derelicts (targets) must be inside it too. The agent
   located the box in `/lab/studies/in-game-controllers` part 02.2 (study status
   `open`, Balanced preset 220 / 64 logical px).
6. Owner: "all planetary bodies are gravitysources", "the relevant gravitysources
   need to be visible", and a target means "a _prioritized_ list of arbitrary
   objects in the field, not weapon targets." The agent had first tied targets to
   weapon acquisition range and the weapons' own target field.
7. Owner: "i'm confused by last answer: our concern is in-game camera, right?", then
   "what charter, why involve lab here?" The agent cited `docs/rebuild-charter.md`
   lines 16 and 45 and the CLAUDE.md Lab rule as its reason for a Lab comparison.
8. Owner: "some historical datapoints are causing a drift here. lets clear them, and
   their source first." The agent removed four camera/Lab clauses from the charter
   in the working tree. `git log -L` traced all of them to `fafed65` (2026-10-28).
9. Owner: "so, there is a stale plan from earlier age, and agents keep mulling that
   up, as a mistake? if so, do 1-3". The owner says this happened repeatedly. This
   loop directly shows the agent's own use of the charter in this chat; earlier
   sessions were not inspected. The agent restored the charter's original text, then
   archived it (see Changes).
10. Owner chose "Rewrite the plan". Decisions given through the question tool:
    - **Zoom:** continuous zoom. Eased steps were offered and not chosen.
    - **Gravity source:** the closest one.
    - **Target list, in priority order:** "1. energy cells, if any, within 600 u",
      then "2.. intact derelicts, withing 600 u".
    - **Box margins:** the Balanced preset, 220 / 64.
11. Owner: "Commit plan only", then "then give me link". The commit is local only,
    so the agent gave a file link and no GitHub URL.

## Changes delivered

| Revision  | Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `af20e14` | **Charter archive** (8 files). The charter moves to `docs/history/rebuild-charter.md` with a historical banner. Its original text is kept; the interim clause removals were reverted with `git checkout` before the move. Two charter-only rules move to `docs/specs/voice-led-factory.md`. Scope now points to the owner's latest decisions, `docs/vision.md` and `docs/plans/`. References are repointed in `AGENTS.md` (`CLAUDE.md` is a symlink to it), README, architecture, project-vision, the Hangar spec and one line of the gravity-field plan. |
| `0084569` | **Camera plan.** Adds `docs/plans/2026-11-04-camera-framing.md`: the in-game camera plan with the owner's decisions; not started. The commit was amended from `f514731` to change only its message.                                                                                                                                                                                                                                                                                                                                                       |

Neither commit touched the other session's changes:

- The gravity-field plan's status line ("steps 1–3 implemented") belonged to that
  session and was excluded from `af20e14` by staging a single hunk. The other session
  later committed it in `1abfcab`.
- `1abfcab` (another session, committed between the two commits above) touches none
  of this loop's files, according to `git log af20e14..HEAD` on those paths.

## Checks

All checks ran from the repository root on the local macOS shell.

| Check                                           | Outcome                                                                                                   | Tree                                                                       |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `node scripts/check-contracts.mjs`              | Exit 0. Agent entry point 79 lines, all context links resolve; design.md 0 warnings; token parity passed. | Dirty tree before `af20e14`, including other sessions' uncommitted changes |
| `npx biome check AGENTS.md README.md docs`      | "Checked 97 files … No fixes applied."                                                                    | Same                                                                       |
| Ad hoc Python link check of the six edited docs | No broken relative links. Not a repository gate.                                                          | Same                                                                       |
| lefthook `commit-msg` (commitlint) on `af20e14` | Passed                                                                                                    | —                                                                          |
| lefthook `commit-msg` on `f514731`              | Passed with a `footer-leading-blank` warning (a body line starting `decisions:` was read as a footer)     | —                                                                          |
| lefthook `commit-msg` on `0084569`              | Passed with no warnings                                                                                   | —                                                                          |

**Not run:** `pnpm verify`, unit tests, browser tests and FX profiling. Only docs
changed, and no camera code was implemented.

## Publication

- **Local commits:** `af20e14` and `0084569` on `feat/0-5-0`.
- **Push:** none. At closure the branch showed "ahead 12" of `origin/feat/0-5-0`.
- **Deployment:** none.

## Findings

These are observations only, with no causes attributed.

- **Agent claims the owner corrected:**
  - the missing feel rationale reported as a gap (step 3)
  - production lines reported as not following constant-width guides (step 4)
  - targets defined by weapon state (step 6)
  - a Lab-first plan (step 7)
- **The charter was still referenced as the current scope authority,** and two
  owner decisions were added to it on 2026-11-04 (`3093142`, `cfc977c`). Before the
  archive it was referenced from:
  - `AGENTS.md`
  - `voice-led-factory.md` ("Authority")
  - `architecture.md`
  - `project-vision.md`
  - the Hangar spec
  - README
- **`docs/specs/game-viewport.md`** describes bounding-box dynamic zoom and has no
  historical banner. It was not edited; slice 1 of the camera plan lists it.
- **Memory index inconsistency.** The memory index listed "Rules version bumps on
  release" (`rules-version-bumps-on-release.md`), but that file was absent from the
  memory folder when checked. The index line was also absent at that check. This is
  outside the repo and was not changed.
- **Concurrent work.** Another session committed and edited the working tree during
  this loop. An untracked `packages/mode-a/src/lib/zz-probe.test.ts` appeared; its
  provenance is unknown.

## Evidence gaps

- **No performance measurement.** The assessment of FX reprojection and line-width
  effects was based on reading code.
- **Star Control 2's zoom history** (PC stepped zoom, 3DO smooth zoom, Ur-Quan
  Masters option) is agent recall and was not looked up.
- **Earlier sessions** were not inspected for charter-driven drift.
- **No owner feel review of any camera behaviour** took place in this loop.
