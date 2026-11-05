# Hangar

## Blueprint

### Context

The Hangar lets players assemble a ship from visible fittings, understand the
tradeoffs, and feel those choices in flight. Its complete loop is choose a ship,
fit it, inspect it, test it, and return to adjust it or start survival. Test flight starts directly from Hangar;
Abort or game-over return from Hangar survival returns to Hangar. Hangar also
provides a return to the title screen.

The owner-approved 0.4.0 scope, recorded in the archived
[rebuild charter](../../history/rebuild-charter.md#next-phase--ship-builder-2026-10-30),
sets free fitting in fixed mounts, desktop mouse and keyboard acceptance, and
initially unranked custom survival. Mobile Hangar layout is deferred; existing
landscape flight controls remain supported. Weapons are active in fitted Test flight
under the [weapons and salvage contract](../weapons-and-salvage.md), and remain static
in custom survival. Buying parts, survival combat, mount authoring and flight tuning
are separate work.

This spec owns the player assembly workflow and its handoff to flight. Shared ship
physics, balance and artwork can evolve independently. Their exact definitions
belong in code and schemas, with decision provenance in the
[former Ship Builder record](../../history/ship-builder.md). That record preserves
prior work; it is not a competing current specification.

### Architecture

| Boundary              | Canonical implementation / contract                                                                                                                                                                                                                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry and state       | [`builder.astro`](../../../apps/web/src/pages/builder.astro) and [`lab/builder.astro`](../../../apps/web/src/pages/lab/builder.astro) compose the same [`ShipBuilder.svelte`](../../../apps/web/src/components/ShipBuilder.svelte). It owns selection, fitting, browser persistence and flight entry.                                           |
| Ship identity         | `SHIP_IDENTITY` in [`config.ts`](../../../packages/mode-a/src/lib/config.ts), validated by `ShipProfileIdSchema` / `ShipIdentitiesSchema` in [`ship-profile.ts`](../../../packages/mode-a/src/lib/schemas/ship-profile.ts). Short names identify choices; the long name identifies the displayed ship.                                          |
| Fittings and saves    | [`loadout.ts`](../../../packages/mode-a/src/lib/schemas/loadout.ts): `PartSchema`, `ChassisSchema`, `LoadoutSchema`, `BuildStoreSchema`, `slotAccepts`, `defaultBuilds`. Browser data is parsed before use; a loadout is parsed again through [`FlightSettingsSchema`](../../../packages/mode-a/src/lib/schemas/flight.ts) at simulation entry. |
| Mounts and appearance | `buildMounts` and `drawBuild` in [`build-renderer.ts`](../../../packages/mode-a/src/lib/build-renderer.ts) supply production mounts and ship drawing. The Hangar consumes these definitions; the [mount planner](../ship-mount-planner.md) authors proposed geometry separately.                                                                |
| Information           | `PARTS`, `CHASSIS`, `fittedParts` and `buildStats` in `loadout.ts` supply catalog values and assembled estimates. Numerical catalogs, slot counts, coordinates and formulas are maintained there rather than copied into this spec.                                                                                                             |
| Flight handoff        | [`FlightDeck.svelte`](../../../apps/web/src/components/FlightDeck.svelte) receives `loadout`, `testFlight` and `onReturn`. [`Simulation`](../../../packages/mode-a/src/lib/simulation.ts) owns resources and termination; [`build-flight.ts`](../../../packages/mode-a/src/lib/build-flight.ts) owns engine commands and power demand.          |
| Shared interface      | [`Toggle.svelte`](../../../apps/web/src/components/inputs/Toggle.svelte) and the [design system](../design-system-core.md) supply controls and visual foundations. `/lab/builder` is the inspectable production composition.                                                                                                                    |

### Constraints

1. **Free, reversible assembly.** Players select a fixed mount and immediately fit a
   compatible part or empty an optional mount. Required propulsion remains fitted.
   Scout, Fighter and Corvette share one mirrored side-engine choice; the left
   primary edits the pair and the right mount communicates the link. Wasp has one
   required centre engine and independent equipment mounts. Fiddler has two required
   mirrored engine pairs: blade roots and rear, with a separate fitting choice for
   each pair. Its forward two + slots and centre + accept weapons or support;
   the lower two S slots accept support only. All five fittings sit below the hull;
   none accepts engines. Compatibility is owned
   by `slotAccepts` and `LoadoutSchema`, including equipment mounts accepting weapons.
2. **Independent builds.** Each chassis retains its own fittings and system choices
   across switching and reloads when storage works. Hangar builds are independent
   of the main game's `starterLoadout` fleet. Stored input must produce valid,
   flyable ships or an explained recovery; storage failure leaves assembly and
   flight usable in memory.
3. **Readable assembly.** The ship chooser, ship display, compatible parts, ship
   systems, flight estimates and flight actions are distinct functional regions.
   The chooser reports chassis mass and mount count, while estimates describe the
   assembled ship. Plan exposes mount occupancy, compatibility and linked state;
   View shows the fitted production appearance without editor overlays. Switching
   modes preserves fittings and selection. Resizing keeps the ship legible and
   selectable targets aligned with the drawing. Labels must leave controls usable.
4. **Meaningful numbers.** Catalog and build information explain mass, propulsion,
   energy supply, capacity and consumption using shared definitions. Estimates
   state their conditions and distinguish peak output from sustained behavior.
   They support comparison, not a promise of flight duration in every environment.
   Powered cruise ceiling is hull base speed plus every physically installed
   main-engine contribution; the builder shows both terms. Engine details report
   their contribution rather than an individual speed limit. Peak forward
   acceleration assumes full power, all fitted engines active and a start from
   rest; it is an instantaneous estimate before pulse or charge timing. Existing
   version-2 saved loadouts keep their IDs and restore without migration. The
   [ship propulsion contract](../ship-propulsion.md) owns values and flight law.
5. **System choices affect flight.** Stabilizers default on; explicit saved choices
   persist except that Wasp and Fiddler require them. Linked engines defaults off and changes
   the aft-engine command from both inputs to either input. Neither input commands
   no aft thrust. This setting leaves side-engine selection and Wasp's centre-engine
   rule intact. For Fiddler, both inputs fire all four mains; with linking off, a
   single input uses the four built-in stabilizers alone. With linking on, a turn
   or automatic spin-braking burn also commands the corresponding side's root
   and rear engines, proportionally to the stabilizer burn. They add forward force
   and exhaust, with no extra turning torque. The opposite mains stay off. Actual
   thrust, draw and exhaust still obey power and engine timing.
6. **Try the actual build.** Test and survival use the selected fittings and shared
   simulation/rendering. Every new flight and reset starts with full build capacity.
   Test flight has a small sun and no planets, retains energy and damage simulation,
   and continues at empty energy or lethal damage. Engines require available power
   and can resume after charging. Return preserves the build. Survival retains its
   normal end conditions and is explicitly unranked, with score submission excluded.
   The [weapon trial](../weapons-and-salvage.md) starts outside the small sun's
   influence, adds passing derelicts, automatic fitted weapons and energy pickups,
   and offers Send derelict. Reset reproduces the encounter sequence.

Constraints 1–2, 4 and 6 carry the original brief and charter; later fitting and
identity decisions are recorded under [Slot language](../../history/ship-builder.md#slot-language-integration--2026-10-31)
and [Ship names and ids](../../history/ship-builder.md#ship-names-and-ids--s4-2026-11-02).
Plan/View, chooser details and system defaults carry the latest
[Hangar notes](../../history/ship-builder.md#hangar-control-alignment--2026-11-03)
and [linked-engine notes](../../history/ship-builder.md#linked-engines-and-stabilizer-defaults--2026-11-03).
Those latest notes report local implementation; they do not establish completed
human acceptance of the composition or flight feel. Column order, corner sizes,
paint coordinates and formulas remain implementation details, not new product intent.

### Fiddler flight trial — 2026-11-03

The [accepted Fiddler study](../../../apps/web/src/pages/lab/studies/lhi-fiddler-2026-11-03.astro)
adds Ship 05, the LHI Fiddler Heavy Assault Corvette. It belongs to Wasp's LHI
family, independently of the military-inspired Corvette. `fiddler.ts` owns the
accepted +35% hull, unchanged Wasp-size black glass, nine mounts and four corrected
stabilizer positions. Its hull mass is 187. The centre + slot is at upright
(0, +20), below the chassis, between cockpit and rear engines.

Main-menu `starterLoadout("fiddler")` has four Light ions, two Potential Wells in
the lower pincer S slots and one Gravity coil in the centre + slot. Forward + slots
are empty: assembled mass 273, capacity 270. New Hangar saves begin with that same
fit; subsequent Hangar changes stay independent of the main-menu fleet. Fiddler is
available in the Hangar and shared instrument, with
unranked survival and test flight. Initial stabilizer strength uses Wasp's values
and Fiddler's geometric inertia; flight feel and endurance await owner review.

### Current implementation choices

`ShipBuilder` opens Fighter unless a valid `chassis` query selects another ship.
Choosing a ship selects its primary engine mount; Plan is the initial preview mode.
These are existing navigation choices, not a separately accepted navigation design.

The no-planet test fixture cannot demonstrate Gravity coil collection; that needs
a planetary flight environment. It remains a deliberate limit of this fixture.

The current browser key is `void-drift-builds-v3`; the contained loadouts have schema
version 2. The owner-approved alpha reset removes v1/v2 browser keys instead of
migrating retired IDs. `BuildStoreSchema` parses the store as a whole: a missing
Wasp or Fiddler entry gets its starting build, but a malformed required entry rejects the whole store.
On rejection, `ShipBuilder` retains defaults and reports recovery. This is not
per-chassis salvage. A storage exception reports limited persistence and keeps the
in-memory builds. Hangar persistence has no account or Firestore dependency.

## Contract

### Definition of Done

These are acceptance criteria, not claims that checks have passed.

| Criterion | Observable result                                                                                                    | Scenarios |
| --------- | -------------------------------------------------------------------------------------------------------------------- | --------- |
| D1        | Every offered chassis opens a flyable build; valid deep links work and invalid ones recover.                         | H1        |
| D2        | Compatible installation/removal updates only the intended mount or linked pair; required propulsion stays fitted.    | H2–H3     |
| D3        | Builds and system choices survive chassis switching/reload; recovery and storage limits are communicated accurately. | H4–H5     |
| D4        | Plan/View preserve the build; display framing and keyboard/pointer targets remain usable.                            | H6        |
| D5        | Part and build figures match shared definitions and state sufficient conditions to interpret them.                   | H7        |
| D6        | Stabilizer and linked-engine choices persist and govern the same build in flight.                                    | H8        |
| D7        | Test, reset and return preserve assembly while test and survival enforce their distinct end conditions.              | H9–H10    |
| D8        | Custom survival is labelled unranked and cannot submit a ranked score.                                               | H10       |

### Regression guardrails

- UI compatibility and parsed-save compatibility agree; changed data contracts are
  defined in Zod before consumers change. Required propulsion remains representable
  only as a valid engine choice. (D1–D3)
- Selection, preview mode and flight reset preserve saved assembly; editing one
  valid chassis build preserves the others. (D2–D4, D7)
- Hangar and flight consume the same mounts, part identities and loadout. Lab entry
  exercises the same component. Shared changes must remain inspectable there. (D4–D7)
- Browser-storage failure leaves a usable in-memory workflow with truthful status.
  Custom loadouts remain outside ranked submission and fixed starter builds. (D3, D8)
- Keyboard operation and existing landscape touch flight remain available. Human
  review separately assesses assembly satisfaction, readability and handling; test
  source and screenshots alone establish none of those judgments. (D4, D7)

### Scenarios

```gherkin
Feature: Assemble and fly a ship in the Hangar

  Scenario Outline: H1 Open a ship
    Given no saved builds
    When I open either Hangar entry with <query>
    Then <ship> has its default propulsion and empty optional mounts
    And I can choose each available chassis

    Examples:
      | query                 | ship                  |
      | chassis=wasp          | Wasp                  |
      | chassis=scout         | Scout                 |
      | chassis=fighter       | Fighter               |
      | chassis=corvette      | Corvette              |
      | chassis=not-a-chassis | the default selection |
      | no chassis parameter | the default selection |

  Scenario: H2 Fit a mirrored propulsion pair
    Given a Scout, Fighter or Corvette in Plan mode
    When I select its primary engine mount and fit another engine
    Then both side engines use that choice and both masses are counted
    And the linked secondary communicates that it is edited through the primary
    And required propulsion has no empty choice

  Scenario: H3 Fit or clear an optional mount
    Given an optional mount selected in Plan mode
    When I inspect its choices and fit a compatible part
    Then incompatible parts are unavailable and the chosen part appears immediately
    When I remove that fitting
    Then the mount is empty and other fittings are unchanged

  Scenario: H4 Restore independent builds
    Given different valid builds and system choices on two chassis
    When I switch between them and reload with working storage
    Then each chassis restores its own fittings and choices
    And the main game's fixed starter fleet is unchanged

  Scenario: H5 Recover from unavailable or invalid storage
    Given saved data cannot be parsed or browser storage throws
    When I open the Hangar or change a fitting
    Then I can continue building and flying a valid in-memory ship
    And the status explains recovery or limited persistence without claiming a successful save

  Scenario: H6 Inspect and select the same ship
    Given a fitted ship with a selected mount in Plan mode
    When I switch to View and back
    Then View shows production artwork without editor targets or overlays
    And the fittings, selection and framing are preserved
    When I resize the display or choose another chassis in Plan mode
    Then mount targets follow the visible drawing and remain operable by pointer and keyboard

  Scenario: H7 Understand a fitting's tradeoff
    Given a selected mount and the current build estimates
    When I replace its fitting
    Then catalog values and assembled figures reflect the shared part and build definitions
    And estimate conditions explain charging, engine response and relevant stabilizer assumptions

  Scenario: H8 Carry system choices into flight
    Given a new build with stabilizers on and Linked engines off
    When I change a permitted system choice and launch that build
    Then flight uses the saved choice
    And Linked engines commands all fitted aft engines on either input when on and both when off
    And no input commands no aft thrust
    And Wasp retains forced stabilizers and its both-input centre engine

  Scenario: H9 Test, reset and return
    Given my fitted ship in the small-sun test flight
    When energy is empty or damage would end survival
    Then the test continues and thrust is limited to available energy
    And newly available charge can power held engine controls
    When I reset and return to the Hangar
    Then reset started with full capacity and initial flight conditions
    And my fittings and system choices are preserved

  Scenario: H10 Start unranked survival
    Given my fitted ship in the Hangar
    When I start survival
    Then that build starts fully charged in the survival environment labelled unranked
    And survival end conditions apply
    And score submission is unavailable
    And I can return to the same build after the run
```

### Verification evidence and gaps

The scenarios are prose acceptance cases, not executable Gherkin. The references
below identify existing test assertions inspected on 2026-11-03, including local
uncommitted work. No tests were run for this specification review.

| Scenarios | Existing coverage                                                                                                                                                                                                                                                                                                                                                 | Remaining verification                                                                                                                                                                                                                                                                                                            |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1        | [Scout browser tests](../../../tests/browser/scout.spec.ts): valid Scout deep link and invalid-query fallback. [Wasp unit tests](../../../packages/mode-a/src/lib/wasp.test.ts): required engine shape, missing-Wasp default.                                                                                                                                     | Browser default/selection coverage for every chassis and both entries.                                                                                                                                                                                                                                                            |
| H2–H3     | [Builder browser tests](../../../tests/browser/builder.spec.ts): “fit, persist, fly…” and independent aft mounts. [Slot tests](../../../packages/mode-a/src/lib/slot-types.test.ts): compatibility matrix and linked primary. [Gravity coil browser test](../../../tests/browser/gravity-coil.spec.ts): install, persist, remove without disturbing Loading coil. | Full keyboard fitting/removal loop on every chassis.                                                                                                                                                                                                                                                                              |
| H4        | Builder tests preserve Scout/Corvette while editing Fighter and persist linked engines; Scout tests compare other saved builds. [Starter fleet tests](../../../packages/mode-a/src/lib/starter-fleet.test.ts) cover fixed fleet definitions.                                                                                                                      | Browser isolation from the main-game fleet and complete per-chassis system-choice persistence.                                                                                                                                                                                                                                    |
| H5        | Builder test “corrupt browser storage recovers…” covers valid JSON with an invalid store shape; “new engine catalog resets old saves…” covers old-key deletion.                                                                                                                                                                                                   | Malformed JSON, read/write exceptions and truthful save status. Current heading says “BUILDS SAVED ON THIS BROWSER” even alongside a failure notice: D3 is not fully met. Whole-store recovery is implemented, not individually tested for a mixed valid/invalid store.                                                           |
| H6        | Slot test “keeps builder overlays out of flight…” checks renderer operations. Builder/Scout tests exercise some keyboard targets. `ShipBuilder` implements mode/framing state.                                                                                                                                                                                    | No direct browser assertions for Plan/View preservation, resize alignment or high-density display framing; visual review pending.                                                                                                                                                                                                 |
| H7        | [Build-flight tests](../../../packages/mode-a/src/lib/build-flight.test.ts): mass, capacity and shared geometry. [Potential Well tests](../../../packages/mode-a/src/lib/potential-well.test.ts): combined reserves. Builder tests check flight capacity.                                                                                                         | No complete UI-to-calculation comparison. Endurance copy only excludes solar, omitting gravity supply; stabilizer draw assumptions are unexplained. Gravity coil still also carries the generic “Static fitting” label. D5 needs information-quality review.                                                                      |
| H8        | Builder test “linked-engine setting persists…”; build-flight tests “defaults stabilizers on…” and “links every aft engine…”; Wasp tests check forced stabilizers and centre-engine input.                                                                                                                                                                         | Wasp with Linked engines enabled is not directly covered; browser-to-flight behavior of the saved setting is not directly asserted.                                                                                                                                                                                               |
| H9–H10    | Builder tests cover launch/reset/return, unranked label and absent Submit Score after game over. Build-flight tests cover survival death, continued test flight, held controls receiving charge, and deterministic replay. Scout browser test covers landscape touch cancellation and blur.                                                                       | Reset assertions cover power, not every initial condition. The small-sun/no-planet fixture is established by source inspection, not a cited fixture assertion. Submission blocking is also enforced by `FlightDeck.save`, but no direct network non-submission assertion is cited. Human assembly/flight review remains separate. |

### Open decisions

- **Recovery granularity:** should one invalid chassis discard otherwise valid
  saved builds? The brief promises safe recovery, not a salvage policy. Recommend
  preserving valid chassis records if recovery is revised; current whole-store
  fallback remains an implementation choice, not newly approved product intent.
- **Navigation:** should the Hangar remember the last chosen ship, and should View
  allow fitting through the still-visible parts list? Current behavior opens Fighter
  without a query and permits parts-list edits in View. Recommend retaining these
  behaviors until owner review identifies a different need; no change is authorized
  by this spec cleanup.
- **Estimate presentation:** which peak/nominal figures best support fitting choices
  remains unverified in use. Recommend retaining the shared calculations and making
  their conditions explicit before adding metrics. Exact tuning and fun are still
  provisional; the discrepancies above are not evidence that balance is accepted.

Structure follows [The Spec](https://asdlc.io/patterns/the-spec/) and
[Living Specs](https://asdlc.io/practices/living-specs/) (consulted 2026-11-03).
