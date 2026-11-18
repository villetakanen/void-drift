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

The existing Playground fitting supplies the mount and barrel orientation. Mode A registers rifle observations with the [fleet selector](../targeting/spec.md) before ordered weapon execution. Each observation yields a stable body ID and captured centre coordinates, or an empty result for that substep. The selector visits each encounter body once across all requesting mounts. Acquisition is free. The ordered weapon scheduler uses the observation to advance the mount’s cycle and debit ship power.

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

### Automatic charge cycle

Each mount starts idle. With an acquired ship or wreck it charges against that ID for 0.7 simulation seconds at 5 power/s. Defence weapons execute first; guns draw from the remaining power in fitted slot order. An idle or partly charged rifle can fund charging only from power above the greater of 10 power and 10% of fitted capacity. Pay only for charge actually accumulated. When available power runs out, hold the accumulated charge while the same target remains eligible. Idle, holding, venting and cooldown consume zero rifle power.

On reaching full charge with the same target, release as soon as 3.5 power can be debited while preserving that reserve (13.5 available for a 10-power reserve). Record exactly one release per funded cycle and spend the 3.5 immediately. The firing phase lasts 0.7 s even if the target leaves. A completed firing phase enters 2.1 s of cooldown. The complete charge and release cost 7 power.

Loss or replacement of the charging target before release starts venting. Preserve the charge already paid for and empty it in proportion to the stored fraction, taking 0.3 s from full. A returning target cannot interrupt venting or the subsequent 2.1 s cooldown. At the end of recovery any currently eligible target can start a fresh charge. Each fitted rifle owns its timers and charge. Pausing freezes them; a fresh encounter starts idle.

### Cycle scenarios

- A held approach keeps the same opponent inside the rifle sector through a full charge, funded release, recovery and a second charge. The production scheduler reports the release and the ship pays for it once.
- A short pass in the three-loop workload starts a charge and loses the target before release. The rifle completes a partial vent and recovery. Its neighbour can continue operating independently.
- Two full rifles compete for one affordable release. The first eligible gun in slot order releases. The second holds its charge while its target remains eligible and releases when power recovers.

### Mounted charge light

A paid charge is visible on the fitted rifle at flight scale. A warm, elongated central bead brightens in place along the barrel channel as the stored fraction increases. The two side channels begin to light halfway through charging. A fully charged rifle waiting for release power keeps its full indication. Losing the target dims the channels with the actual remaining charge during venting. A funded release clears the stored-charge indication immediately. Idle and cooldown show the unlit fitting.

The light follows each mount through ship motion and rotation. The Wasp hull masks its under-mounted fitting; the exposed Fighter mount shows the full channel pattern. Charge remains readable beside ion fire and with targeting traces off. Drawing reads the mount’s paid charge and cycle phase. Pause preserves the visible state, and reset clears it with the encounter.

### Presentation scenarios

- In a crossing pass, the rifle brightens briefly and then drains as the target leaves. A different rifle on the same ship can show a different charge.
- On a held approach, the centre brightens first, the sides join after half charge, and the loaded bead clears at release. Repeating the same flight produces the same charge and release events with rendering enabled or disabled.
