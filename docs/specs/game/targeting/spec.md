---

generator_model: GPT-6 (Codex)
reviewer: Ville Takanen
review_done: true
---

# Mounted weapon targeting

## Blueprint

### Context

All active ships obtain their mounted weapon targets from one acquisition pass over the encounter per combat substep. This includes the player and both pirates in Gauntlet. Fitting another weapon or introducing another shooter adds selection work but never another traversal of the encounter. Target selection runs on simulation time. Camera position, render rate and effects settings have no bearing on eligibility.

### Architecture

`packages/mode-a/src/lib/simulation.ts` owns encounter membership and the combat clock. `packages/mode-a/src/lib/salvage.ts` owns mounted weapon acquisition, aiming, funding and contact resolution. The fleet selector in `packages/mode-a/src/lib/targeting.ts` consumes a common encounter view before individual weapons execute. `packages/mode-a/src/lib/derelict-collision.ts` supplies the reference geometry for wrecks and fragments. Weapon-specific thresholds belong to the owning weapon contracts.

The encounter supplies live body identities, geometry, motion, occluders and the intended opponents for each shooter. Each active firing or tracking rule supplies its origin, orientation, reach and previous target where applicable. Idle point defence can track while it cools. An empty Practice encounter and a ship carrying only disabled fittings require no acquisition work.

The combat substep owns one roster shared by all shooters. Each participating live ship has one physical body adapter and a stable encounter ID. Each shooter supplies its identity and encounter eligibility policy against that roster. Exclude the shooter from its own contacts and acquisitions. Other ships can physically intercept regardless of whether that shooter may acquire them. Preserve existing encounter-owned derelict material and celestial blocking.

A roster's membership and pose references are valid for its substep. Refresh them before the next substep, including spawns, deaths and pose changes. A retained weapon target uses a stable ID, and a substep aim point is a captured coordinate. Neither retains a roster index or mutable adapter across substeps. Physical contact observes current damageability at discharge. Roster preparation and selection are separate operations with independently observable costs.

Register the current requests before visiting bodies. Evaluate each body against the relevant requests during its visit, sharing eligibility and geometric work where the inputs match. All ready Light Ion Cannons on one chassis share a trigger. Two turrets at different pivots can have different winners. Return a trigger or a stable target identity and aim point as the weapon requires. Selection does not spend power, rotate barrels, deal damage or run the enemy pilot.

### Constraints

The rules below supply the reference for judging acquisition quality. Production selection may estimate geometric overlap, distance, aim point and threat time. Shooter and body eligibility, priority classes and deterministic tie breaking still apply. For example, two nearby fragments can exchange rank when their estimated distances are close. A collectible cannot become a target through approximation.

| Active weapon     | Reference selection                                                                                                                                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Light Ion Cannon  | Find visible damageable material touching the ship's forward rectangle, including its boundary. Test live ship circles against the actual rectangle and wrecks and fragments against their remaining material. An offset muzzle can legitimately miss after acquisition. |
| Ion Point Defence | Choose the nearest eligible visible material from each turret pivot. Resolve equal distances by lower body ID. Retain the current eligible target unless a challenger is at least 10 units closer.                                                                       |
| Laser             | Preserve the defensive priority of an incoming fragment on a collision course, then a wreck, then another eligible contact. Retain an eligible target in the winning priority class. Resolve a fresh choice by threat time or distance as applicable, then by stable ID. |

Encounter policy applies independently for each shooter. A pirate can intend to fire at the player while an allied pirate intersects the barrel. Collectible energy cannot trigger a shot. Apply each weapon's visibility rule from its specified origin. A blocked body cannot conceal an eligible runner-up simply by ranking closer.

## Contract

### Definition of Done

Take acquisition inputs at one defined instant per combat substep. Fire in the existing defence-before-guns and mount funding order. Resolve each discharge from its actual muzzle against current physical bodies and celestial blockers. A shot may hit a different body from the selected target. Damage, breakup and power use remain ordered even when several weapons acquired together. Physical contact queries and visual beam clipping are separate costs and must be reported separately.

Keep the trigger or aim point from acquisition for the rest of the substep. If an earlier weapon destroys the selected body, the later weapon can still fire toward the recorded position under its normal alignment, contact, funding and cooldown rules. A cannon that discharges into empty space spends its normal shot cost. A turret whose firing rule requires physical contact still checks the barrel line. Destruction requires no target revalidation or replacement search. Newly born fragments can intercept immediately and first participate in selection on the next substep.

- Count roster builds and live body adapters prepared per fleet substep, together with preparation time. An active 16-Wasp ring prepares one roster with at most 16 live-ship adapters for the whole fleet. Reusing the roster for 32 weapons leaves construction independent of weapon count.
- A substep with no acquisition requests performs zero acquisition visits, comparisons and acquisition-only candidate preparation. A physical query that still needs encounter bodies accounts for that preparation under physical work. A substep with neither kind of request need not build a roster.
- Instrument the production simulation boundary. With acquisition requests and B encounter bodies, the outer candidate traversal visits at most B bodies across all shooters combined. Count visits inside any helper that enumerates candidates. A second traversal hidden behind a per-weapon list, sort, or mode adapter fails this criterion. Verify zero visits with no requests.
- Record active requests, candidate/request comparisons, exact material tests, visibility tests, temporary allocations, acquisition time and physical-contact time. A single traversal can still cost B times the number of requests. Reject impossible candidates cheaply before exact geometry, share identical requests and avoid rebuilding candidate arrays per mount.
- Compare equal seeded workloads against the recorded baseline on the same device and build settings, with the same active ships, fittings and body populations. Include an empty encounter, a dense fragment field with multiple mounts, and Gauntlet with two opponents and quarter-step combat. Report median and p95 acquisition and total simulation time, plus p95 frame interval in real flight. Report body and mount counts and the device with the timings.
- The measured production flight meets the agreed numeric acquisition budget derived from available simulation time. Improvement on the workload exposing the bottleneck exceeds run-to-run variation. The acquisition measurement excludes unrelated flight systems.
- Compare the approximate selector with the reference offline on identical seeded encounters. Record missed and extra triggers, target switches, differences in aim direction and acquisition time. Inspect whether differences cluster around close calls or systematically miss threats, chatter between targets or fire through obvious gaps. Use this comparison to choose the cheapest acceptable approximation; the reference adds no work in flight.
- Exercise a cannon circle just outside the far corner, a tangent, a rear-edge overlap, a wreck with an empty gap, an occluded best candidate, two independent turret pivots, and an allied interceptor. Permuting the body list must preserve the selected results. Verify volley capture, scarce-power order and the agreed same-substep destruction rule.

### Regression Guardrails

- Exact reference geometry is available offline for quality comparisons. Production can approximate eligible material while preserving encounter policy and deterministic selection.
- Candidate visits are counted at the point of traversal across all shooters. Physical-contact and rendering queries are measured independently.
- Barrel alignment, discharge funding, cooldowns, damage attribution and physical blockers follow the owning weapon contracts.

### Scenarios

```gherkin
Scenario: The next substep refreshes the roster
  Given one shared roster includes a ship that is destroyed before the next substep
  When surviving shooters request targets in the next substep
  Then they read the refreshed membership and poses
  And no retained target can resolve to a different ship through a reused roster position

Scenario: Several mounts share one view of the encounter
  Given 16 ships each carry two tracking turrets
  When the fleet acquires targets during a combat substep
  Then at most 16 encounter bodies are visited for acquisition
  And each turret receives the result for its own pivot

Scenario: An earlier shot destroys a cannon's trigger
  Given two ready funded cannons acquired a volley from the same trigger
  When the first cannon destroys the triggering body
  Then the second cannon can fire on its stored trigger without reacquiring
  And the second shot resolves against the current physical scene

Scenario: An ally intercepts a pirate shot
  Given a pirate may acquire the player and an allied pirate crosses its barrel
  When the pirate fires at the player
  Then the ally may intercept the shot
  And the ally cannot trigger acquisition for that pirate
```

The owning weapon contracts define detailed geometry, firing and resource behavior. [Light Ion Cannon](../light-ion-cannon/spec.md) · [Ion Point Defence](../ion-point-defence/spec.md) · [Gauntlet](../gauntlet/spec.md)
