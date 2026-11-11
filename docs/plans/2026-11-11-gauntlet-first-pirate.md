# Gauntlet: first pirate experiment

Authorized experiment, 11 November 2026. This plan records the bounded first
encounter being built; it does not define a future Gauntlet mode.

## The bite

Launch from the Hangar into a fresh system with the active player build and
exactly one hostile Scout. It arrives through the existing system-edge entry
mechanism, flies under its own thrust, and tries to shoot the player. The purpose
is to discover whether fighting a moving, physically constrained opponent is fun.

Requested pirate: existing Scout geometry, black/charcoal hull variant, one Ion
Point Defence turret, one Light Ion Cannon, two Light Ion engines, full initial
hull and energy. Use valid existing mounts and preserve normal fitting rules.
Keep enough facet contrast to read the dark hull against space; use the shared
renderer and show the same variant in the Lab. No new chassis or part artwork.

Proposed defaults for this first trial:

- Full resources means full at spawn, followed by normal costs and damage.
- One opponent per launch; no waves, reinforcements or progression.
- No ambient derelict stream, score, leaderboard submission or persisted rewards.
- Both ships can damage each other using their fitted weapons. Existing weapon
  ranges, cadence, power floors, obstruction and damage bands apply.
- Normal environmental hazards remain. Pirate destruction or loss ends the
  encounter with a clear result; player loss uses the normal failure flow. If
  both die in the same tick, report mutual destruction.
- Pause freezes everything; return goes to the Hangar; relaunch starts fresh.
- Seeded independent arrival bearings, with a deterministic separation check,
  avoid overlapping entries. Neither ship fires before both are active.
- Keep the existing camera initially; provide a minimal hostile bearing cue
  when the pirate is offscreen so the encounter is findable.

## What exists and what must change

Gauntlet is currently a disabled Hangar action, absent from `FlightModeSchema`.
`Simulation` owns one live ship and its resources, propulsion and arrival.
`salvage.ts` owns automatic weapons, which currently acquire wrecks/fragments,
not live ships. Existing Scout geometry, equipment, ray damage, engine physics,
arrival rules and FX can be reused, but adding an enemy is more than adding AI.

The central change is a second live actor in one authoritative world. Extract
only the per-ship stepping needed to share propulsion, energy, gravity, collision
and weapon state. Do not run two independent worlds or duplicate physics in AI.
Define actor identity, allegiance, lifecycle and damageable contacts in schemas
before changing consumers. Exclude self-targeting and keep first physical contact
and world obstruction authoritative. Specify ship-to-ship collision and stable
same-tick damage resolution explicitly during this extraction.

Extend weapon acquisition/contact to hostile live ships without changing the
existing wreck/fragment behavior in other modes. Ensure all currently selectable
player fittings behave coherently; inventory laser/rail assumptions as well as
the two ion weapons before declaring integration complete.

## Predictive pilot

Use a small sampled, receding-horizon controller. At each planning update, roll
out a bounded set of left/right/both/neither thrust sequences using shared flight
stepping on scratch state. Execute only the first command, then plan again.

Start tuning around a 1–2 second horizon and 5–10 planning updates per second;
these are hypotheses, not acceptance thresholds. Retain the 60 Hz simulation.
Predict the player's near-term trajectory from current observable motion, without
reading future player inputs. Include gravity, inertia, angular motion, engine
timers and available power. Prediction must not mutate the world, consume its
random stream, or emit damage or FX.

Score trajectories for survival, useful firing opportunities, cannon alignment,
relative speed and energy. The cannon reaches 300 units; the turret fires within
200 and tracks within 300. Favor opportunities to use both without demanding
perfect simultaneous alignment or simply chasing the player's current position.
These are instant rays, so lead the encounter position, not projectile travel.
Automatic weapon systems decide whether a real shot can fire.

Use fixed candidate budgets and deterministic tie-breaking. Include command-change
cost to reduce twitching. Handle arena transitions consistently with real flight;
do not aim or shoot through an imagined toroidal shortcut. Measure actual cost
before increasing horizon or search width. No optimizer dependency is needed.

## Build order and possible agent ownership

1. **Foundation, one owner:** define mode/actor contracts, validate the pirate
   loadout, extract shared actor stepping, implement arrivals and lifecycle.
   Establish actor and world-query interfaces before parallel implementation.
2. **Combat agent:** extend targeting, first contacts and damage to live hostile
   ships; cover self-exclusion, obstruction, both directions and destruction.
3. **Pilot agent:** implement bounded prediction against the agreed stepping API,
   deterministic scenarios and prediction diagnostics.
4. **Presentation/integration owner:** shared charcoal Scout variant, actor
   rendering and FX, Hangar launch, mode/result labels, hostile cue and a playable
   Lab encounter. Integrate and verify the combined production path.

Combat and pilot can run in parallel after foundation. Assign shared files such
as `simulation.ts`, schemas and `FlightDeck.svelte` to one integration owner;
agents expose modules rather than making competing edits there. Start agents only
when implementation is authorized. No publication is part of this experiment.

Update game, Hangar, weapon, rendering and relevant world contracts alongside
implementation, and add a Gauntlet spec describing this bounded first mode.
Follow shared-components and FX skills for implementation in those areas.

## Acceptance and evidence

- Each Gauntlet launch creates exactly the requested pirate and a fresh player
  run; other modes preserve their behavior and score eligibility.
- The pirate moves through real engine commands, can bring both weapons to bear
  in controlled scenarios, spends energy normally and can be destroyed.
- Player weapons can hit the pirate; hostile hits damage the player; stars and
  planets block shots; no self-hit or damage after destruction occurs.
- Seed and identical input produce repeatable results. Pause/resume and relaunch
  do not leak actor state, weapon cooldowns, AI state or FX.
- Prediction leaves live state untouched and matches real stepping for the same
  initial state and commands over its modeled interval.
- Targeted scenarios cover head-on approach, lateral motion, overshoot, a hazard,
  low energy and arena transition. Diagnostics show selected path and command,
  allowing inspection of pursuit failures rather than guessing at weights.
- A playable Lab bench at 1280px or wider uses production systems; keyboard and
  landscape touch work through the production Gauntlet launch.
- Run repository-required checks and meaningful regression tests. Measure worst
  observed planner cost and integrated frame performance with both weapons/FX.
  Report failures and unavailable checks explicitly.

Automated evidence establishes functioning combat and bounded computation. The
experiment stays deliberately easy to tune after trying it; neither difficulty
balance nor a larger Gauntlet progression is promised by this first bite.
