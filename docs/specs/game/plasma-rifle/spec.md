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

On reaching full charge with the same target, release as soon as 3.5 power can be debited while preserving that reserve (13.5 available for a 10-power reserve). Record exactly one release per funded cycle and spend the 3.5 immediately. The firing phase lasts 0.7 s even if the target leaves. A completed firing phase opens the paired vents for 0.3 s before the 2.1 s cooldown. The complete charge and release cost 7 power.

Loss or replacement of the charging target before release starts venting. Drain the remaining stored charge over the same 0.3 s vent cycle used after firing. A returning target cannot interrupt venting or the subsequent 2.1 s cooldown. At the end of recovery any currently eligible target can start a fresh charge. Each fitted rifle owns its timers and charge. Pausing freezes them; a fresh encounter starts idle.

### Cycle scenarios

- A held approach keeps the same opponent inside the rifle sector through a full charge, funded release, recovery and a second charge. The production scheduler reports the release and the ship pays for it once.
- A short pass in the three-loop workload starts a charge and loses the target before release. The rifle completes a full vent and recovery. Its neighbour can continue operating independently.
- Two full rifles compete for one affordable release. The first eligible gun in slot order releases. The second holds its charge while its target remains eligible and releases when power recovers.

### Paired vents

Completing the firing phase or losing the charging target opens the fitted rifle’s two purge outlets. Both sprays leave their actual ports together, following the fixed outlet axes. Emitted fumes inherit the ship’s velocity at emission plus 300 u/s along each outlet. Each puff keeps its own world velocity from its instant of ejection. Its orange glow travels with it and fades in flight for 0.36 s. Later thrust, recoil and turning affect subsequent emissions. After the ports close, the last glowing puffs continue away from the ship. The two sprays and their travel are visible at flight scale. Pause freezes emission and drift. Reset clears them.

For exactly the time spent draining, each venting rifle applies a common force opposite the hull’s current forward direction, through its centre of mass. Calibrate the force to 125 u/s² on a stock Wasp fitted with service ion side engines, a plasma rifle in the first hull socket and a light ion cannon in the second and divide by the actual fitted ship mass. Venting adds translation without torque. Each vent lasts 0.3 s and changes that reference Wasp’s backward velocity by 37.5 u/s. Both triggers use the same emission intensity over time and the same impulse for the same fitting and motion. Overlapping mounts contribute independently. Charge depletion, emission and thrust stop together even when a substep crosses into cooldown.

- A crossing target leaves at half charge. Both outlets spray while the bead drains, the ship acquires backward velocity over 0.3 s, and the existing fumes keep drifting into cooldown.
- A target returns during venting. The paid discharge finishes once, and the rifle proceeds into its normal recovery.
- A funded shot follows the release and eruption contract. After firing, both outlets run the same vent cycle with the charge light already empty.

### Mounted charge light

A paid charge is visible on the fitted rifle at flight scale. A warm, elongated central bead brightens in place along the barrel channel as the stored fraction increases. The two side channels begin to light halfway through charging. A fully charged rifle waiting for release power keeps its full indication. Losing the target dims the channels with the actual remaining charge during venting. A funded release clears the stored-charge indication immediately. Idle and cooldown show the unlit fitting.

The light follows each mount through ship motion and rotation. The Wasp hull masks its under-mounted fitting; the exposed Fighter mount shows the full channel pattern. Charge remains readable beside ion fire and with targeting traces off. Drawing reads the mount’s paid charge and cycle phase. Pause preserves the visible state, and reset clears it with the encounter.

### Presentation scenarios

- In a crossing pass, the rifle brightens briefly and then drains as the target leaves. A different rifle on the same ship can show a different charge.
- On a held approach, the centre brightens first, the sides join after half charge, and the loaded bead clears at release. Repeating the same flight produces the same charge and release events with rendering enabled or disabled.

### Release and eruption

A funded release sends a narrow spew along the barrel axis from the fitted muzzle. Measure its 130 u reach in the firing ship’s inertial frame at release. Its motion inherits ship velocity. Later steering and target identity have no effect. Provisional presentation and travel tuning puts the full reach within one 60 Hz simulation tick (7,800 u/s). Acquisition reach and eruption reach are independently tunable.

Clear space produces one eruption at full reach, even if the acquired ship has moved. A nearer ship, wreck or fragment intercepts the spew at its first remaining material and moves the single eruption to that surface. This makes a ship crossing the muzzle matter and permits a shot through an opening in a wreck. The emitter is excluded. A celestial surface absorbs the discharge. Resolve the earliest intersection through the swept motion, including contact at the endpoint. A celestial blocker wins an exact tie, then stable body ID orders coincident material contacts.

At eruption sample each eligible body’s nearest remaining material at the eruption instant. Apply the innermost applicable band once per body, including the interceptor. Exclude the shooter. Resolve recipients before damage or breakup creates new fragments. Each distinct funded release owns its eruption. Hull protection in the sustained bench remains available.

| Distance to nearest material | Hull damage |
| ---------------------------- | ----------: |
| Through 10 u                 |          75 |
| Over 10 through 26 u         |          50 |
| Over 26 through 42 u         |          25 |
| Beyond 42 u                  |           0 |

### Visible discharge

At normal flight scale the hot narrow discharge on LFX and the amber emission on FX connect the muzzle and opening point in one rapid gesture. Retain the visible path across substeps so the discharge reads even when an entire shot resolves between draws. A connected orange fireball with a hot core opens at the actual eruption position. The provisional visual reach is 58 u and the eruption lasts 0.26 s. Use simulation time, existing visibility and effect budgets. Pausing preserves the instant and reset clears its history.

### Release scenarios

- A ship triggers a funded release while the barrel line is clear. The discharge opens at 130 u. A hull with material 20 u from that point takes 50 damage, including when another ship triggered the shot.
- An intervening fragment intercepts at 45 u. The discharge terminates there and the fragment takes a single 75-point hit. Nearby material is evaluated around that point. The shot is spent.
- Two rifles erupt between rendered frames. Both paths and eruptions are eligible for presentation, and each resolves its own damage whether visible or offscreen.
