---
name: lab-instruments
description: Choose, compose, build or change instruments for Lab tools and design studies, including reuse, extension and bespoke instruments.
---

# Lab instruments

Start with what the designer needs to observe, measure or edit. Use a static
specimen when motion or interaction adds no useful evidence.

## Choose

Read the relevant spec and inspect its canonical implementation and rendered
page before composing it. Check supported inputs, outputs, sizing and state
lifecycle; a navigation entry does not establish an embed API.

| Purpose | Spec and canonical page | Reuse surface |
| --- | --- | --- |
| Paths, motion measurements and ship tuning | [Motion](../../../docs/specs/lab/motion-instrument/spec.md), `/lab/instrument` | `ShipTuning`, `InstrumentEmbed` |
| Events and effects during flight | [Flight scene](../../../docs/specs/lab/flight-scene-instrument/spec.md), `/lab/flight-scene` | `FlightSceneInstrument`, `FlightSceneEmbed` |
| Planet surfaces, lighting and motion | [Planet Inspector](../../../docs/specs/lab/planet-inspector/spec.md), `/lab/planet-inspector` | `PlanetInspector`, `PlanetInspectorEmbed` |
| Sky generation | [Sky](../../../docs/specs/lab/sky-instrument/spec.md), `/lab/sky-instrument` | Standalone tool; no configurable embed API |
| System layout | [System](../../../docs/specs/lab/system-instrument/spec.md), `/lab/system-instrument` | Standalone tool; no configurable embed API |
| Gravity and targeting workloads | [Gravity](../../../docs/specs/lab/gravity-tuning/spec.md), `/lab/gravity-tuning`; [Targeting](../../../docs/specs/lab/targeting-bench/spec.md), `/lab/targeting` | Specialised benches; inspect their contracts before adapting |
| Other tools or a different composition | [Lab registry](../../../apps/web/src/data/lab-pages.ts); `/lab/ds/instrument-parts` | Find an existing tool or compose shared parts |

Reuse when the instrument fits the question. Extend when the missing capability
belongs to that instrument. Build a bespoke instrument when its workflow differs,
composing shared game systems and design-system parts. Reusing simulation does
not require reusing the entire instrument.

## Compose

Follow the instrument's host contract. Lab stages and study embeds have different
sizing responsibilities. Use supported controls, panes and readouts where they
fit; do not assume every instrument needs them. Check which inputs are reactive
and which require reconstruction. Resolve conflicting requirements in their
owning specs.

Use [shared-components](../shared-components/SKILL.md) for shared ownership and
[design-study](../design-study/SKILL.md) for study decisions and evidence retention.
Keep instrument-specific interfaces and replay rules in the instrument spec.

For a staged encounter, establish that the claimed event occurs and identify its
useful inspection window. Run each offered sequence relevant to the claim through
its full duration, including aftermath. Keep experimental conditions explicit;
repair staging without silently changing the mechanics being inspected.

## Verify

Inspect the canonical and changed surfaces at supported widths, starting at
1280px. Check control readability, relevant panes and readouts, keyboard operation,
and pause, forward and backward seeking where supported. Confirm that changed
options reach the scene and its readouts, and replay does not accumulate effects.
Check affected consumers after shared changes.

Report automated checks, rendered inspection and designer judgment separately,
with the review URL and any verification limits. Passing simulation checks does
not establish a usable composition.
