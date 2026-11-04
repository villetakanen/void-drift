# Motion instrument: conform implementation to the reviewed contract

## Purpose and authority

Implement the contracts in [Motion instrument](../specs/motion-instrument.md) and
[Gravity tuning](../specs/gravity-tuning.md). This plan records implementation work;
creating it does not start that work. The designer reviewed the contracts in the
November 4 conversation. Recheck the specs and working tree before implementation:
the ship-motion study is being edited independently.

The result must support agent-configured experiments in Lab rooms and studies,
shared hull/equipment properties, explicit comparison conditions, current production
simulation, selected designer controls and exact-value export for conversation.

## Current gaps observed in code

- `apps/web/src/lib/instrument/config.ts` stores `changes` on each vehicle.
  `calculate.ts` constructs separate part and ion values from those changes;
  `DocumentPanel.svelte` edits them per vehicle. This permits identical builds
  to use different equipment properties inside one experiment.
- `InstrumentEmbed.astro` accepts only `config` and `label` and always renders
  `ShipTuning`. The custom `pane` snippet on `ShipTuning` receives a document,
  but is not a validated contract for selecting editable fields. Gravity tuning
  has its own fixed pane and configuration.
- Both `DocumentPanel.svelte` and `gravity-tuning/GravityPanel.svelte` contain
  a Load textarea, parser and controls. Export already uses Copy JSON.
- The calculation imports production `applyBuildEngines`; gravity uses production
  `massWellAcceleration` and `bounceOffSurface`. Preserve these dependencies.
  Audit integration and contact/geometry wiring against current production code;
  sharing the engine function alone does not establish complete equivalence.
- `packages/mode-a/src/lib/lab-instrument.test.ts` compares the result with a
  study-local calculator. That historical implementation is not the contract oracle.
- The shared screen already owns reading state, but multi-instance isolation,
  reading-control invariance and small-value propagation lack the newly specified
  end-to-end evidence. Repeated DOM IDs in panels also need instance-safe ownership.

## Implementation sequence

### 1. Define the experiment schema before changing consumers

Use strict Zod schemas in `apps/web/src/lib/instrument/config.ts` and the gravity
configuration module. Put tuning values at experiment scope; vehicles carry labels
and validated production loadouts. Represent supported comparison conditions
separately, including the gravity shadow relationship. The shadow derives its build
and shared properties from its source and changes only the gravity condition.

Define an explicit, validated selection of editable fields for each configured use.
Fixed values still participate in calculation and export; hiding a control must not
remove or change them. Reuse existing settings and production value constraints.
Do not add proposed propulsion laws, arbitrary chassis, custom burns or new metrics.

Choose and document the concrete field names and schema version in the same change.
Do not silently merge conflicting legacy per-vehicle overrides into one experiment.
Migrate maintained callers explicitly; legacy examples can show a clear unsupported
configuration error. No historical simulation engine or designer import migration
workflow is required.

Acceptance: unknown fields and invalid loadouts/settings are rejected; shared values
cannot be overridden per vehicle; configured editable fields are valid; exact numeric
values survive serialization. Update the spec's configuration example to the final
schema without claiming the pending implementation has already passed verification.

### 2. Apply shared values through the production simulation

Refactor `calculate.ts`, `ShipTuning.svelte`, `gravity-tuning/flight.ts` and their
callers to resolve one experiment's shared values consistently across its ships.
Use production hull/equipment definitions, geometry, engine behavior and gravity
functions. Keep overrides local; never mutate the game's definitions or tuning file.

Derive gravity shadows from the same build, motion settings, burn and starting
state. Keep production contact events available for path markers. Every burn change
recalculates the affected paths and references together. Preserve the present burns,
sampling conventions, supplied-power behavior and each Lab room's documented scope.
Do not change game laws or gravity/friction constants in this task. If matching a
production behavior requires a consequential choice, present the concrete conflict.

Acceptance: identical builds under identical conditions yield identical samples and
measurements; the shadow differs only in its gravity condition; changing a shared
value reaches all applicable ships and leaves unrelated experiment settings intact.

### 3. Wire configured controls, export and independent embeds

Update `DocumentPanel.svelte` to edit shared experiment values once, with the
configured field selection. Apply the same fixed/editable distinction to gravity
controls. Remove Load UI, draft state, import handlers and unused import styles in
both panels. Retain agent-input validation, invalid-value feedback and Copy JSON.
Export is the current experiment settings, not an acceptance or game-apply action.

Extend the embedding/composition API so studies can use the supported experiment
configurations and selected controls, including gravity conditions and measurements.
Reuse `MotionInstrumentScreen`, `PathPane`, `TimeGraph`, `BurnRow` and existing controls;
keep the two canonical Lab rooms and their existing routes. Avoid a general plugin
system or a visual redesign. Give each instance its own mutable state and DOM IDs.

Keep time selection, path scale and panning separate from authored settings and
calculated results. Preserve focus/Escape behavior and overlay geometry.

Acceptance: a study fixture with several differently configured instances edits only
the intended instance and fields; fixed conditions are preserved; no Load control
remains; clipboard export contains the exact edited values; reading controls do not
change configuration or simulation samples. Check the 10000-to-10001 gravity case.

### 4. Migrate maintained examples without changing study conclusions

Inventory consumers of `InstrumentConfig`, `calculate`, `InstrumentEmbed` and the
shared screen before editing. Include `starter.ts`, `LabGraphs.svelte`, canonical Lab
pages, the lab-instrument design record's live embed, Fiddler and current ship-motion
study examples. Coordinate around changes already present in the shared workspace.

The starter currently compares two identical plasma builds using different thrust
properties. Replace that invalid arrangement with distinct builds sharing one tuning
configuration, or separate configured instances for different experiment settings.
Do not invent per-ship exceptions to preserve an old chart.

Retain written findings and existing captured evidence. Keep interactive historical
examples only when interaction serves a current purpose; do not fabricate screenshots
of past results by rerunning changed production code. Leave unapproved capability
proposals in their studies, not in either instrument contract.

### 5. Verify the reviewed contract and finish

Use the spec Gherkins as the acceptance map. Add meaningful tests for shared property
scope, identical ships, shadow derivation, independent instances, fixed fields,
export precision, burn propagation and reading controls. Replace the historical
study-calculator equality test with evidence tied to current production behavior;
retain useful finite-result, schema and input-program coverage. Gravity equations
and collision-law tests remain owned by production physics, not duplicated as new
instrument requirements.

Run focused unit and browser checks first, then the required gates in
[Development](../development.md). Use the prescribed local Java 21 for backend gates.
Report unavailable or failed checks explicitly and isolate unrelated failures rather
than weakening contracts. Verify the implementation on a stable candidate; updates
from concurrent work invalidate claims about that candidate.

Inspect Ship tuning, Gravity tuning and a multi-instance study at widths of at least
1280px. Demonstrate shared value edits, well dragging, burn switching, exact export,
no import UI, focus/Escape, and inspection without mutation. Human experience review
remains separate from automated correctness. Mark spec checkboxes only when the
corresponding evidence exists; remove stale checked claims about previous examples.

## Deliverable boundary

Deliver schema, instrument code, maintained callers, targeted tests and synchronized
spec examples. No new game laws, fleet balance, speculative study capabilities,
archived simulation versions, dependencies or deployment are part of this plan.
Commit implementation separately from this contract-and-plan change. Obtain push or
publication authorization for that later work according to repository policy.
