---
name: flight-scene-study
description: Evaluate ships, effects, weapons and world objects in Void Drift design studies using the shared Flight scene instrument. Use Motion for paths and measurements.
---

# Flight scene study

Show the proposed visual with a real fitted ship in the game's standard look. Rendering does not establish gameplay acceptance.

Read the [Flight scene contract](../../../docs/specs/lab/flight-scene-instrument/spec.md) and inspect `/lab/flight-scene`. Follow [design-study](../design-study/SKILL.md) for framing, decisions and round retention. Use [Motion](../../../docs/specs/lab/motion-instrument/spec.md) for path/graph questions.

## Compose

Mount `FlightSceneInstrument` with its standard burns, timeline, views and burger pane. Never substitute a custom scene or add manual flight controls.

- Without study controls, use `FlightSceneEmbed.astro`.
- With controls or painters, use a small Svelte wrapper around `FlightSceneInstrument.svelte`, supplying its `pane` snippet and supported inputs. Mount in `InstrumentBand.astro` with a client directive and a prop.
- Put shared controls in the pane. Supply conditions and appearance, not another loop or timeline.

Read `apps/web/src/lib/flight-scene/index.ts` and the Zod document schema. Follow supported reactive inputs and replay semantics; mounted `config` edits may not reconfigure it.

Agree missing shared capabilities with the designer; existing authorization suffices. Update schema before consumers, then the contract and canonical example. Keep production simulation, geometry and layers shared; mark proposed behavior and appearance experimental.

## Stage and check

Choose a real loadout, initial pose/velocity, environment, burn and opening instant that reveal the question. Hold agreed conditions fixed. Distinguish world units, pixels, display scale and gameplay quantities. Judge at flight scale beside the ship; enlarge for construction. Document required zoom-range changes.

Run every offered burn's full configured sequence. Measure the claimed event and its useful time window, including recovery where relevant. Screenshots or differing final states do not establish activation. Label intentional misses. Keep study/check fixtures together and recheck changed conditions, burns, geometry or rules. Repair trajectories without silently changing mechanics or reach. Keep approach and aftermath available.

## Compare and verify

Expose relevant variables with units, bounds, defaults and baselines. Preserve burn/time across changes. Appearance must not affect flight; behavior changes must reconstruct without accumulating impulses or doses. Use simulation time and shared light history, including pause and backward seek.

Compare relevant states. Keep proposed parameters distinct from accepted qualities. A usable range or an earlier study does not automatically select a default.

Inspect the instrument and pane at widths ≥1280px. Exercise burns, options, keyboard-operated controls, pause and backward seek; check shared consumers after extensions. Distinguish event checks, rendering and designer judgment. Report limits and a review URL. Preserve earlier rounds under design-study's retention rules.
