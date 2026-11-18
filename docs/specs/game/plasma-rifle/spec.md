# Plasma rifle

## Blueprint

### Context

Holding a target close and steady commits the ship to a heavy plasma strike.
When the target slips away, the charge already paid for escapes through two
ports and pushes the ship back. The mounted light and ship response let the
pilot read the commitment while manoeuvring.

### Architecture and boundaries

- The existing `plasma-rifle` part keeps its unsanctioned status, compatible
  slots, 24.3 mass, unlit artwork and collision extent. It operates against
  derelicts in Derelicts and Playground Survival and against live ships in
  Gauntlet. It idles in target-free Practice.
- `packages/mode-a/src/lib/schemas/salvage.ts` validates tuning and presentation
  events. `SalvageSystem` owns the rifle cycle, swept contacts and power spending
  in the shared fixed-step weapon pass. `Simulation` supplies current resources,
  ship and target motion and hull damage. The rifle uses the authored mouth
  geometry in `plasma-rifle-art.ts` and the ship's fitted mass.
- The shared flight frame paints the mounted charge in LFX and the drifting
  stream, fumes and impact in FX. Presentation reads simulation state and
  events. The Hangar derives its figures from validated rifle tuning.

### Rules

- **Acquire.** A live ship or intact derelict centre within 130 u of the
  primary mouth and within 15° either side of the barrel is eligible. The
  nearest eligible centre wins, with lower stable body ID breaking ties.
  Debris can take damage. Star and planet surfaces block acquisition. A mount
  holds its chosen target until resolution. It cannot switch during charge.
- **Charge.** Start with at least 17 power and the shared weapon floor
  satisfied. Spend 5 power/s for up to 0.7 s in defence-first, stable gun-slot
  order. Idle and full-charge waiting are free. A mount that loses its target
  or cannot fund further charge at the weapon floor before reaching full
  vents its current fill. Reacquisition waits until after recovery.
- **Release.** At full charge with the locked target still eligible, require
  at least 13.5 power and the shared weapon floor, then debit 3.5 power once.
  A fully funded cycle costs 7 power. The firing phase lasts 0.7 s. A
  surviving eligible target can start another cycle after 2.1 s of free
  recovery. A vent-only cycle starts the same recovery when the vent stops.
- **Contact.** A release launches one stream from the primary mouth along the
  barrel. It adds 900 u/s to inherited ship velocity and travels up to 130 u
  relative to that inherited motion. Sweep against moving material and world
  surfaces. The first contact opens one eruption. On a world surface the
  stream dissipates without combat damage. A miss expires without an
  eruption. Apply at most one blast hit per body from its nearest collision
  material to the contact point, including the struck body. Inclusive bands
  are 75 through 10 u, 50 through 26 u, and 25 through 42 u. Snapshot the
  recipients before applying damage, so fragments shed by the blast enter
  subsequent contacts. Cells and the firing ship are excluded.
- **Vents and response.** Opening the vents launches two moving spray
  envelopes with a 6 u radius. Each starts at its authored mouth, inherits
  ship velocity and adds 300 u/s at 25° outward from the barrel on its side.
  A failed charge vents for 0.3 s times its fill fraction. A released shot
  vents for 0.3 s from release, while the kick continues through the 0.7 s
  firing phase. The sprays deal 3 damage per body on entry to their union,
  including a later re-entry after leaving it. Overlap adds zero extra hits.
  The shooter and cells are excluded. The kick supplies 70% of the plasma
  engine's reference thrust. Vent force is calibrated to 125 u/s² on a
  default Wasp with one rifle and one Light Ion Cannon. Both forces act
  opposite the captured barrel direction, divide by fitted mass and add
  translation without torque.
- **Cues.** Charge brightens in place and the side channels join halfway.
  The mounted bead respects hull occlusion, including the Wasp's
  undercarriage. The stream has a concentrated core and opens a fireball on
  the simulated contact. Glow may extend beyond the damage zones. Emission
  follows simulation time and visibility, with bounded shared FX work.

## Contract

### Definition of Done

- An eligible target at sufficient power initiates one independent cycle per
  fitted mount. An intervening draw can delay release at full charge.
- Charge loss spends only power already used and produces venting and
  recovery. A full release debits its strike cost once and adds the kick.
- Stream and spray contacts resolve against the same live bodies and world
  geometry as the encounter. Derelict holes remain open and successive
  damage events use current hull.
- Two mounts compete in stable order and hold separate charge, recovery and
  spray occupancy. Reset clears transient rifle state. Replay reproduces
  power, damage, timers and motion.
- The saved fitting launches with Playground On and blocks launch with
  Playground Off. The Hangar card communicates mass, reach, power cost and
  strike damage using the shared figures component.

### Scenarios

```gherkin
Scenario: Hold a wreck through release
  Given a fitted rifle with enough ship power in a Playground Derelicts run
  When a wreck stays inside the muzzle sector through the charge
  Then the rifle launches one stream and applies its backward kick
  And the first material contact opens one blast

Scenario: Lose the target during charge
  Given a rifle halfway through charging
  When its locked wreck leaves the muzzle sector
  Then the rifle vents the stored charge for half the full vent time
  And it spends no release power and starts recovery when venting ends
```
