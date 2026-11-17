# Gauntlet two-pirate review evidence

## Planning cost

Measured on 2026-11-11 with the local Vitest/Node 24.14.0 runtime on Darwin
25.6 arm64. The host CPU model was unavailable to the sandbox. The probe built
`Simulation({ ...gameSettings("fighter"), mode: "gauntlet", arrival: true,
seed: 812 })`, warmed each pirate with four `planPirate` calls, then measured
five samples with `performance.now()` and reported each median. Each sample
planned against the same player, star, planets and ion settings without stepping
the live simulation.

| Workload                 | Median wall time | Per plan |
| ------------------------ | ---------------: | -------: |
| 8 plans for one pirate   |         67.59 ms |  8.45 ms |
| 16 plans for two pirates |        130.22 ms |  8.14 ms |

The measured planning work nearly doubles for two pilots. The simulation now
offsets the pilots' existing eight-tick planning cadence by four ticks, so the
extra work is spread across separate frames. This measures pilot planning only,
not the full simulation or rendering cost.

## Render inspection

The production Gauntlet and `/lab/gauntlet` were inspected in Chromium at
1440×900. The production capture shows one hostile Scout in-frame and the
second pirate's offscreen bearing cue; the Lab
framed the player and both opponents and kept both hull readouts visible.
Review captures are retained outside the repository at:

- `/private/tmp/gauntlet-pair-production-1440x900.png`
- `/private/tmp/gauntlet-pair-lab-1440x900.png`
