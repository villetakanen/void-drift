---

generator_model: GPT-6 (Codex)
reviewer: Ville Takanen
review_done: true
---

# Plasma rifle

## Blueprint

### Context

An approach that keeps an opponent in front of the rifle should give the pilot time to build a charge. An opponent slipping across the muzzle should produce a shorter opportunity. Each fitted rifle observes the encounter from its own fixed muzzle. The 0.7 s charge interval is the benchmark for judging these opportunities. [Operation study](../../../../apps/web/src/pages/lab/studies/plasma-rifle-operation-2026-11-18.mdx)

### Architecture

The existing Playground fitting supplies the mount and barrel orientation. Mode A registers rifle observations with the [fleet selector](../targeting/spec.md) before ordered weapon execution. Each observation yields a stable body ID and captured centre coordinates, or an empty result for that substep. The selector visits each encounter body once across all requesting mounts. Observing a target spends zero power and produces zero discharges.

## Contract

### Definition of done

- Measure the sector from the fitted muzzle along its forward axis, including both edges at ±15° and the 130-world-unit range boundary. Test body centres. Apply encounter hostility and the existing celestial visibility rule.
- A live eligible ship or wreck can be selected. The shooter, allied ships excluded by encounter policy, destroyed bodies, fragments and pickups cannot initiate a charge.
- Keep the previous target while it remains eligible. Otherwise select the nearest eligible centre, breaking equal-distance ties by stable body ID. A replacement starts a new same-target observation interval. Each mount makes its own choice.
- Measure uninterrupted same-ID intervals in the three-loop bench. Report those reaching 0.7 s separately from shorter passes and publish fleet body visits. Reset starts a new observation window.

### Scenarios

- A ship enters one rifle’s sector while a second rifle on the same hull sees empty space. Only the first mount reports a target.
- An eligible wreck remains inside the sector as a closer ship crosses it. The rifle retains the wreck until it leaves or becomes ineligible. A surviving candidate can be selected on that substep.
- A fragment passes the muzzle in an otherwise empty sector. The rifle reports empty.
