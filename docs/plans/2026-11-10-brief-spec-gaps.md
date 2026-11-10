# Brief: missing, needed and incoherent specs

Handoff brief, written 10 November 2026 at the end of the 0.6.0 spec session
(commit `c7c22e7` on `feat/0-5-0`). It says where that session left off so you
can continue. Nothing was re-researched for it; check claims against the specs
and the code.

## Your task

Continue the spec work for 0.6.0 with the person guiding you: find which specs
are missing, which are needed, which have incoherent or stale details, and fix
them. Improve the terminology as you go, without fixing undecided words in
place. Specs are ASDLC.io-style living specs; follow the `spec` skill.

## How the project treats documents

- **Specs** hold stable intent. **Code** is the current contract of the
  software. **Plans** (everything in `docs/plans/`, this brief included) are
  transient sketches: nothing in them is reliable until checked.
- Specs carry no history: present tense, superseded text deleted, no dated
  decisions, no DEPRECATED or Target markers, no change logs. Status lives only
  in Definition of Done checkboxes.
- Game specs describe the game only. The Lab is not part of the game; game
  specs place no rule on it ([game spec](../specs/game/spec.md),
  [Lab spec](../specs/lab/spec.md)).
- Never call the person "the owner". Never invent human steps (playtests or
  feel reviews happen outside the repo and never gate anything). Never delete
  or offer to delete `docs/plans/` files or `docs/project-vision.md`.

## Where we are

### Done in the session (all in `c7c22e7`)

- [Experimental mode](../specs/game/experimental/spec.md), new: the toggle
  alone decides ranking. Off: only stable content can be fitted and flown, and
  every Survival run that starts is ranked. On: everything is unlocked and
  nothing is ranked, even with only stable parts; the score still shows.
  Turning Off removes nothing: experimental content stays fitted, disabled,
  and blocks every launch until the active ship is all stable. Release class
  is one flag per `CHASSIS` and `PARTS` entry in the catalog data. Player-facing
  words and the marker text are left to a design study (E11).
- [Active ship](../specs/game/active-ship/spec.md), new: the ship every launch
  flies (PRESS START, Hangar Survival, Practice, Derelicts). Choosing a ship in
  the Hangar makes it active with no Apply step. Each ship keeps its own
  fitting. Required engines are always fitted, so every ship can fly. A new
  device's active ship is the Wasp with light ion cannon, ion point defence,
  one light ion engine and stabilizers; other ships start unfitted. Kept per
  device; corrupt values fall back per value. Open: whether a fitting can be
  reset.
- [Lab](../specs/lab/spec.md), new root: no game modes, no score submission.
- Aligned to these: [game](../specs/game/spec.md),
  [title screen](../specs/game/landing-page/spec.md),
  [Hangar](../specs/game/hangar/spec.md),
  [game screen](../specs/game/game-screen/spec.md),
  [test flight](../specs/game/test-flight/spec.md),
  [derelicts](../specs/game/derelicts/spec.md),
  [survival](../specs/game/survival/spec.md),
  [light ion cannon](../specs/game/light-ion-cannon/spec.md),
  [ion point defence](../specs/game/ion-point-defence/spec.md).
- [0.6.0 plan](2026-11-08-ion-storm-0-6-0.md): Terms, known gaps per goal and a
  "Missing specs" section. Read it first. A draft deliverable 3 plan,
  [Experimental mode and the active setup](2026-11-10-experimental-mode.md),
  is unreviewed and belongs to a later implementation session.

### Terms

- **Active ship** is decided (10 November 2026, the term EVE Online uses).
- **Stable**, **experimental** and **fitting** are placeholders, not
  decisions. Keep them marked as such. "Production" and "starter" are wrong
  words and must not come back; "stable" is merely silly, which is better than
  wrong. `starterLoadout()` is a code name only.
- There is no starter kit: a new player gets one fitted ship because the active
  ship must fly at once; every other stable ship and part is simply available
  in the Hangar.
- The player-facing words cannot be judged without seeing them on the real
  screens. They come from a design study with a live prototype, not from a
  question.

### Missing specs (from the 0.6.0 plan)

1. **The stable ships.** Nothing describes the Wasp, the Scout and the Fighter
   as ships (slots, hull, role, handling).
   [Propulsion](../specs/game/ships/propulsion/spec.md) covers only the cruise
   ceiling. "Polish to stable quality" has nothing to be checked against.
2. **Stable parts without a spec.** Light ion and heavy ion engines (only their
   speed contribution is specified), Potential Well (`battery`), Heavy
   Potential Well (`heavy-well`), Gravity coil (`gravity-coil`), stabilizers.
   The cannon and the point defence have their own specs; decide whether parts
   get one spec each or a shared one.
3. **Choosing and fitting in the Hangar.** The Hangar spec's lower "Preserved
   assembly specification" is explicitly not refreshed and describes an older
   scope (independent builds, unranked custom survival, starter fleet). The
   0.6.0 choose-and-fit workflow has no current contract.

### Incoherent or stale details noticed, not yet fixed

- [Ship select](../specs/game/ship-select/spec.md): 0.4.0, "PLANNED", a
  title-screen ship selector persisted in settings. It contradicts the active
  ship and title screen specs.
- [High scores](../specs/game/high-scores/spec.md): marked historical; the game
  spec owns ranking and the leaderboard now. Unchecked items describe an old
  design.
- [Survival](../specs/game/survival/spec.md): dated sections ("Interstellar
  arrival — 2026-11-05", "Derelict arrivals — 2026-11-09", "Survival score —
  2026-11-09", "Current standard-Sun resource contract — 2026-11-07"), a
  "Phase 5 Checklist ✅ COMPLETE", "Known Limitations" and a "Future
  Enhancements" checklist. All against the no-history rule.
- [Options](../specs/game/options/spec.md): old phase format (Status,
  Phase, PBI).
- [Workbench](../specs/lab/workbench/spec.md): version 0.1.0 and "Do NOT load
  the full GameLoop in the Lab", which the current Lab contradicts. The Lab
  flight-tools session ([brief](2026-11-10-brief-lab-flight-tools.md)) owns
  Lab changes; coordinate rather than overlap.
- [Hangar](../specs/game/hangar/spec.md): the opening section still says shared
  changes stay "inspectable in the Lab at `/lab/builder`", a game rule on the
  Lab. The lower section still says "starter".
- [Derelicts](../specs/game/derelicts/spec.md): unchecked Derelicts-mode
  criteria (entry, endings, pause and game over, shared weapon rules, wreck
  size, breakup); whether stale or open is not verified.
- Open decision: whether hits from experimental weapons count toward the shown
  score.

## How to work (what worked, what did not)

What worked:

- Pick one feature, say why, then ask focused multiple-choice questions with a
  recommended option first. The person answers precisely and adds their own
  points in the answers.
- Draft the spec, then reconcile every neighbouring spec in the same change so
  no two specs disagree.
- Run `pnpm check:contracts` after edits. Run `npx biome format --write` on
  changed Markdown before committing; the lefthook pre-commit hook fails on
  unaligned tables. Commit with the `commit-messages` skill, staging the whole
  tree.

What did not:

- Writing an implementation slice plan when the person asked only for the
  overall gaps. The 0.6.0 plan records what is needed; focused sessions plan
  the work.
- Using words as if decided ("production", "starter", "agreed"). Mark
  placeholders loudly.
- Putting Lab rules in game specs.
- Asking for word choices without a live prototype.
- A question from the person is a request for the fact or a judgement, not a
  challenge; answer it and keep the position unless shown wrong.

Other sessions edit the same files; several changed on disk during the
session. Re-read before editing, and keep their changes.

## Done looks like

Each missing spec drafted with the person, each stale or incoherent spec
rewritten or reconciled, neighbours aligned, the 0.6.0 plan's "Missing specs"
section updated to match, checks passing, and a local commit.
