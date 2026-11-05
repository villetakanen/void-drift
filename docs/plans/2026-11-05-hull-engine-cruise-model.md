# Hull and engine cruise model

## Assignment and authority

Implement the owner's agreed propulsion model in production, explain it on a Lab
documentation page, and expose truthful ship-builder figures. This plan is the
implementation handoff; writing it does not start implementation. The originating
chat retains the control/critic role: return inspectable evidence there for owner
review. Automated correctness does not constitute acceptance of handling or balance.

Implement the decisions below without reopening engine balance. Plasma and fission
are not yet balanced; this model provides the foundation for that work. Gravity was
recently rebalanced: lower available push is a known interaction to monitor, not a
reason to retune gravity in this assignment.

## Accepted behavior

Use `Powered cruise ceiling` as the user-facing name, in world units per second.
Explain that this is the speed propulsion approaches, not a cap on coasting or
gravity-assisted velocity. There is no new boost button or temporary boost state.

`V = hull base speed + sum of installed main-engine speed contributions`

| Hull     | Base (u/s) |
| -------- | ---------: |
| Scout    |        370 |
| Wasp     |        420 |
| Fighter  |        330 |
| Corvette |        240 |
| Fiddler  |        280 |

| Engine    | Contribution per installed engine (u/s) |
| --------- | --------------------------------------: |
| Light ion |                                       8 |
| Heavy ion |                                      11 |
| Fission   |                                      17 |
| Plasma    |                                       9 |
- Count physical main engines: Wasp has one centre main; other hulls have two
  side mains. Count each fitted aft engine, including Fiddler's required pair.
  Empty slots and non-engine fittings contribute zero. Stabilizers contribute zero.
- Contributions are scalar and are not projected by mount angle or weighted by
  thrust strength. Engine firing, charge, pulse, linkage, and power state do not
  change V. Every propulsion impulse uses the same V for that installed build.
- Preserve the current production linear taper and radial/transverse decomposition
  in `engineImpulse` with its ordinary, non-directional rule. For straight forward
  thrust below V, acceleration is `a0 * max(0, 1 - speed / V)`.
- Preserve full braking and transverse steering, and the existing finite-impulse
  protection against adding propulsion overspeed. Existing velocity above V is
  retained; propulsion must not clip it back to V. Gravity can add overspeed.
- Preserve force divided by fitted mass, engine duty/charge timing, energy demand,
  torque, inertia, angular caps, stabilizer braking, linked-drive rules and input.
  Preserve existing force-composition order unless a demonstrated defect requires
  a separately reported change. The task changes ceiling ownership, not force laws.
- Do not promote the instrument-only directional-projection candidate, introduce
  logarithmic taper, or change gravity/friction constants.
- Correct the displayed engine name to Fission. Retain internal `fusion` IDs for
  compatibility in this slice; explain the alias in developer documentation only.
  Do not invalidate saved builds merely to correct the label.

Analytical reference for constant forward acceleration capability a0, from rest,
without gravity and with continuous power/delivery:
`v(t) = V * (1 - exp(-a0*t/V))`; `t95 = -ln(0.05)*V/a0`.
This describes the continuous equation; fixed-step results need numeric tolerance.
Pulse, charge, variable power and turning do not satisfy these reference conditions.

## Inspect before editing

Read AGENTS.md, docs/development.md, docs/design.md and the applicable shared-components
and spec skills. Follow the spec skill's ASLDC guidance when authoring living contracts.
Inspect current source and diffs rather than assuming this snapshot is still current.

At planning time there are unrelated/ongoing edits in package manifests,
`build-flight.ts`, the ship-motion study, and `docs/specs/motion-instrument.md`, plus
study captures and loop records. Preserve their provenance; do not overwrite, revert,
or include them in a commit without determining ownership. In particular the motion
instrument conformance work and directional candidate may have advanced by handoff.

Primary integration points:

- `packages/mode-a/src/lib/schemas/loadout.ts`: ChassisSchema, PartSchema, CHASSIS,
  PARTS, physical engine enumeration and buildStats.
- `packages/mode-a/src/lib/schemas/ion.ts`: existing ion-only ceiling tuning.
- `packages/mode-a/src/lib/build-flight.ts`: shared propulsion and engineImpulse.
- `packages/mode-a/src/lib/simulation.ts` and flight/settings schemas: resolve the
  assembled production route, starter fleet, builder handoff and replay inputs.
- `apps/web/src/components/ShipBuilder.svelte`: shared `/builder` and `/lab/builder`
  stats and part details; currently displays individual engine powered ceilings.
- `apps/web/src/lib/instrument/` and gravity-tuning consumers: production-backed
  calculation, shared property overrides, validation and exact export.
- `apps/web/src/data/lab-pages.ts`: Lab route inventory and navigation.

Legacy stock trials remain a distinct supported path. Main-game assembled ships,
builder flights and current production-backed Lab calculations must use this model.
Do not change legacy stock physics incidentally or leave the main game on old ceilings.

## Implementation sequence

### 1. Define the living contract and schema

Create `docs/specs/ship-propulsion.md` as the authoritative assembled propulsion
contract. Use context, architecture/boundaries, independently verifiable Definition
of Done, regression guardrails and Given/When/Then scenarios. State current intended
behavior in present tense; use unchecked criteria until evidence exists. Include
the exact values, installed-capacity rule, taper, overspeed and family timing.

Add validated finite positive hull base speed and finite nonnegative engine
contribution fields before changing calculations. Choose clear field names and
one shared derived calculation, usable by flight, stats and the Lab. Do not persist
derived V in loadouts or duplicate hull/engine tables in presentation code.

Retire old assembled ceiling authorities (`ion.maxSpeed`, `bonus`, `falloff` and
individual part limits) from the new production path. Inventory all consumers before
removal: some are legacy fixtures or historical experiments. Update maintained
configuration schemas and examples explicitly; reject unsupported old configurations
with a clear message rather than silently interpreting old ceilings as new values.
Preserve valid saved loadouts. Do not build a historical physics engine to keep old
charts interactive. Follow the current instrument contract's experiment-wide scope
for shared tuning; do not reintroduce per-vehicle equipment overrides.

### 2. Implement and integrate the rule

Compute V once from the effective build and shared property set and pass it to all
assembled propulsion families. A fitted inactive engine raises the ceiling for every
other engine; stabilizer firing cannot change V. Keep torque independent of speed
taper as it is today. Preserve response timing and emitted-output semantics.

Ensure default game entry, all five hulls, builder flight and both canonical motion
and gravity instruments resolve the same definitions. Overrides must remain local to
an experiment and must not mutate production values. Update maintained consumers
and clear obsolete ceiling UI. Preserve historical study findings and captures; link
them to the new reference and label any live example that now uses the changed law.
Do not present a rerun under new physics as evidence for an old conclusion.

### 3. Update builder figures

Extend shared buildStats with V and enough breakdown data to explain it. Display
`Powered cruise ceiling` with u/s and hull-base plus installed-engine total. Part
details show `+N u/s to ship cruise ceiling` instead of the old standalone ceiling.
Use Fission in current production-facing names and shared part descriptions.

Audit existing peak acceleration and angular figures against actual hull geometry,
especially Fiddler's forward mains and Wasp's centre main. Fix any affected mismatch
in the shared calculation; preserve mass, capacity, draw and endurance information.
Label peak acceleration with its full-power, active-engine, from-rest conditions;
do not present pulse peak or delayed output as sustained performance. Do not invent
new balance metrics or redesign the builder.

Verify selecting hulls, fitting/removing/swapping engines and restoring saves updates
the figures immediately and the handed-off flight uses that same ceiling.

### 4. Add the Lab documentation page

Create `/lab/ship-propulsion/` using the established Lab documentation layout and
shared typography/tokens; register it in `lab-pages.ts`. This is a readable reference
page, not a new experimental dashboard. Inspect at 1280px or wider only.

Include purpose and terminology, both source-derived value tables, the build formula,
physical engine counting, inactive-engine behavior, taper and its analytical reference,
and the distinction between propulsion ceiling and gravity/coasting speed.
Show worked calculations and derived full-complement examples:

| Hull     | Engine count | All light ion V | All fission V |
| -------- | -----------: | --------------: | ------------: |
| Scout    |            3 |             394 |           421 |
| Wasp     |            1 |             428 |           437 |
| Fighter  |            4 |             362 |           398 |
| Corvette |            5 |             280 |           325 |
| Fiddler  |            4 |             312 |           348 |

These are maximum occupied engine complements, not necessarily starter builds.
Derive displayed results from real valid builds and shared production definitions.
Include a mixed-engine example and explain why releasing its controls leaves V
unchanged. Show remaining forward thrust at 0%, 50%, 90%, 100% of V (100%, 50%,
10%, 0%) under the stated straight-flight conditions. Braking remains available.
Any curve must use the shared model or explicitly labeled analytical equation and
conditions. No independent study-local simulator is needed.

Link to builder, existing motion/gravity instruments and the historical motion study.
Explain that engine balance and human handling review remain follow-up work.

### 5. Synchronize documentation

Update `docs/specs/hangar/spec.md` for figures, conditions and saved-build continuity;
`docs/specs/motion-instrument.md` for actual shared configuration and supported
overrides; and `docs/architecture.md` for ceiling ownership. Link the new propulsion
spec from `docs/specs/playable-alpha.md` and replace conflicting assembled-flight
claims while distinguishing legacy stock behavior. Update gravity-tuning/field specs
only where their actual integration contract changes. Avoid unrelated history cleanup.

Keep implementation status and review evidence in this plan or an evidence record,
not dated changelogs in living specs. This is not a release task. Record that a future
release must apply the documented challenge/rules-version policy; do not bump it
merely for intermediate tuning.

## Verification and acceptance evidence

Add focused behavioral tests, reusing existing suites where appropriate:

1. Exact hull/engine constants, physical engine counts, mixed sums, zero contribution
   from equipment/stabilizers, and schema rejection of invalid numeric values.
2. Fitting a non-firing engine changes V for other engines; pulse, charge, linkage,
   single-side input and power loss leave installed V unchanged.
3. Continuous straight burns approach the shared V for each hull and engine family;
   compare continuous ion cases against the analytical curve with suitable tolerance.
   Check mixed families and representative differing time steps for finite, bounded
   results. Do not force pulsed/charging cases to match a steady-thrust equation.
4. Above-ceiling coasting is retained; braking reduces speed; transverse control is
   available without propulsion inflating overspeed. Rotation and stabilizer braking
   retain their current authority. Distinguish rotational response from changed paths.
5. Production game entry, builder and Lab use the same derived values; UI edits and
   restored saves show the same V used in flight. Fission label preserves saved IDs.
6. A fixed current gravity-well scenario compares powered escape and coasting using
   the rebalanced gravity values. Record observed outcomes; report any handling
   concern without retuning gravity or weakening a regression contract.

Inspect the rendered documentation page and both builder consumers, including
meaningful fitted states and visible calculations. Retain keyboard and landscape
phone touch checks for play; Lab review is desktop only. Provide reproducible flight
conditions (build, seed/well, power, input sequence) for angled-engine and LHI review.

Run focused tests during implementation, then the required `pnpm verify` gates from
docs/development.md on a stable candidate, using the prescribed local Java 21.
Report failed, unavailable and skipped checks explicitly. Do not weaken contracts
to obtain green results or claim a partial run is full verification.

## Handoff back to the control/critic chat

Return changed-file summary, local revision/working-tree identity and provenance,
links to the Lab reference and builder, representative calculation/flight evidence,
the exact verification report, and any remaining discrepancies. Separate automated
correctness, visual inspection and owner handling acceptance. Identify known gravity
observations and engine-balance follow-ups without expanding this implementation.

The three required outputs are: (1) an inspectable Lab explanation with live-source
numbers/calculations; (2) truthful builder stats including the ship-wide ceiling;
(3) the agreed model running in the game with synchronized ASLDC-style contracts.
No pushing, publishing, external feedback, new dependencies or autonomous balance
iteration is authorized by this plan. Consequential departures return to the
originating chat with concrete evidence; routine implementation choices are local.
