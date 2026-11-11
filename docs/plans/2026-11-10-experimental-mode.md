# Experimental mode and the active setup

> Authorized delivery now follows [Active ship and Experimental delivery](2026-11-10-active-ship-delivery.md).
> This earlier draft includes superseded ranking, query-selection and saved-score
> assumptions. The current feature specs and the delivery plan take precedence.

Deliverable 3 of [0.6.0 "The ion storm"](2026-11-08-ion-storm-0-6-0.md), scoped
in conversation on 10 November 2026. Contract:
[Experimental mode spec](../specs/game/experimental/spec.md), with the
[game](../specs/game/spec.md), [title screen](../specs/game/landing-page/spec.md),
[Hangar](../specs/game/hangar/spec.md) and
[game screen](../specs/game/game-screen/spec.md) specs updated the same day.
Status: plan recorded; no slice started.

Terms here ("stable", "experimental", "active ship", "fitting") are undecided
placeholders; see the Terms section of the 0.6.0 plan.

## Decisions (2026-11-10)

- Experimental is its own feature, not a Hangar sub-feature. The control lives
  in the Hangar opening.
- **The toggle decides ranking.** Off allows only stable ships and parts,
  so only a run with a stable ship and stable parts can be scored.
  On unlocks everything and scores nothing: a run flown with Experimental On
  and no experimental parts is still unscored. Runs always show their score.
- **Turning Off removes nothing.** Experimental ships and parts become disabled,
  marked, and stay fitted. Every flight launch, from the title screen and the
  Hangar, is unavailable until the player picks a stable ship fitted with
  stable parts.
- **Marker.** While On, a short corner marker shows on the title screen beside
  Start and in the Hangar opening; run complete says the run is not ranked.
  Experimental ships and parts carry the marker in the Hangar in both states.
- **Persistence, per device:** the Experimental setting, the active ship and
  each ship's fitting. A fresh device starts Off with the starter Wasp.
- **Release class as data.** Each `CHASSIS` and `PARTS` entry carries one
  stable/experimental class. The spec states the rule; the 0.6.0 set is set
  in data.
- **Wording is open.** The class names and the marker text are chosen in a
  design study with a live prototype. Until then implementation uses neutral
  placeholder copy.
- PRESS START launches the active setup chosen in the Hangar, and the title
  screen shows that ship in its fitting.
- A Survival run launched from the Hangar with Experimental Off is ranked, like
  a title-screen run.

## Today, for reference

- `CHASSIS` and `PARTS` (`packages/mode-a/src/lib/schemas/loadout.ts`) carry no
  release class. Ship ids: wasp, scout, fighter, corvette, fiddler.
- `HighScoreSubmissionSchema` excludes only Fiddler; `firestore.rules` accepts
  `shipId` in wasp, scout, fighter, corvette.
- Ranking in `FlightDeck.svelte`: the mode label, `save()` and the run complete
  initials and Save Score all test `mode === "survival" && !loadout && chosen
  !== "fiddler"`. Any Hangar loadout is unranked; the title run is always
  ranked.
- The title page (`GameWrapper.svelte`) mounts `FlightDeck` with no loadout, so
  PRESS START flies `gameSettings("wasp")`. `TitleScreen.svelte` draws
  `starterLoadout("wasp")` as its decorative ship.
- `ShipBuilder.svelte` (shared by `/hangar` and `/lab/builder`) keeps builds per
  chassis in `localStorage` under `void-drift-builds-v3`, parsed by
  `BuildStoreSchema`. The selected chassis comes from the `chassis` query, not
  from storage. Experimental is inert local state (`experimental = "Off"`) with
  "Not available yet".
- Browser suites asserting today's behaviour: `hangar-opening` (inert toggle,
  reload reset), `builder`, `flight-deck`, `scout`, `salvage`,
  `derelicts-score`; Firebase: `competition`.

## 0.6.0 release classes

| Class        | Ships                | Parts                                                                                                             |
| ------------ | -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Stable       | Wasp, Scout, Fighter | `ion`, `heavy-ion`, `light-ion-cannon`, `ion-point-defence`, `battery`, `heavy-well`, `gravity-coil`; stabilizers |
| Experimental | Corvette, Fiddler    | `fusion`, `plasma`, `rail`, `laser`, `coil`                                                                       |

## Slices

### S1. Release class in the catalog (mode-a, Firebase, small)

- `ChassisSchema` and `PartSchema` gain a required release class; every entry
  sets it from the table above. A helper answers whether a chassis and loadout
  are all stable; nothing else keeps its own list.
- `HighScoreSubmissionSchema` accepts only stable chassis, derived from the
  catalog. `firestore.rules` accepts `shipId` in wasp, scout and fighter.
- Spec: E1, E10. Changed 10 November 2026: the
  [scores spec](../specs/game/scores/spec.md) accepts any ship and keeps no
  ship list in the schema or `firestore.rules`; this slice needs replanning.
- Checks: the schema rejects an entry without a class; the helper on a stock
  Wasp, an experimental chassis and an experimental part; submission and the
  rules emulator reject Corvette and Fiddler.

### S2. Setting and active setup in storage (mode-a and web, small; parallel with S1)

- A Zod schema for the Experimental setting (Off by default, invalid reads as
  Off) and for the stored active chassis alongside the per-chassis builds.
  Existing `void-drift-builds-v3` builds migrate without loss.
- One shared web module reads and writes both, used by the title page and the
  Hangar; `ShipBuilder` stops owning the store alone. A `chassis` query still
  selects a ship in the Hangar and makes it active.
- Spec: E2, E9, active ship A7.
- Checks: round trip, missing and corrupt values, migration of a v3 store, a
  fresh device yields Off and the starter Wasp.

### S3. Title screen flies the active setup (web, medium; needs S2)

- `GameWrapper` / `FlightDeck` launch PRESS START with the active setup;
  `TitleScreen` draws the active ship in its fitting as the decorative ship.
- Ranking moves out of `!loadout`: a Survival run is ranked when Experimental
  is Off, whatever the launch source. The mode label, `save()`, initials and
  Save Score read that one rule.
- Spec: game rules and DoD, title-screen DoD and scenarios, game-screen mode
  label, active ship A3 and A4.
- Checks: after choosing the Scout in the Hangar the title shows and launches
  the Scout; a Hangar Survival run with Off offers Save Score; Practice and
  Derelicts never do; a fresh device launches the starter Wasp, ranked.

### S4. Experimental gating (web, medium; needs S1–S3)

- The Hangar control writes the setting. Off: experimental chassis and parts
  are visible, marked and disabled for pointer and keyboard; fitted
  experimental content stays, marked and disabled; every Hangar launch action
  is unavailable while the active setup holds experimental content.
- The title screen disables PRESS START in the same state, says why and offers
  the Hangar.
- On: everything is selectable; every run is unranked, Save Score absent and
  submission never called.
- Spec: E3–E7, Hangar H4.
- Checks: both toggle directions with an experimental part fitted and with an
  experimental chassis active; launch returns after refitting; On with only
  stable parts shows the score and no Save Score; no network submission.

### S5. Marker and run complete copy (web, small; needs S4)

- The experimental marker, as a shared component, in the title screen corner
  beside Start and in the Hangar opening while On, with an accessible name
  saying runs are not ranked; on experimental items in the Hangar in both
  states. Run complete states that the run is not ranked.
- Placeholder copy until S6 chooses the wording. The marker shows in the Lab.
- Spec: E8.
- Checks: presence and accessible name with On, absence with Off.

### S6. Naming study (design study; prototype after S5)

- A design study chooses the two class names and the marker text, judged on a
  live prototype of the title screen, Hangar and run complete.
- The accepted wording replaces the placeholder copy and the open decision in
  the Experimental mode spec.
- Spec: E11.

## Open points

1. **Lab builder.** `/lab/builder` mounts the same `ShipBuilder`. Does it read
   and write the same device setting and active setup, or keep its own?
2. **Hangar hint copy.** The title screen's rotating hint points to the Hangar
   to choose a ship; whether it also mentions Experimental waits for S6.

## Order

S1 and S2 in parallel. S3 after S2. S4 after S1–S3. S5 after S4. S6 prototypes
on S5; its exploration may start earlier on a Lab bench.
