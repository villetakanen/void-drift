# Gauntlet bench

## Blueprint

`/lab/gauntlet` is a playable instrument for the first pirate encounter. It
constructs the production Gauntlet `Simulation`, advances it at the game tick,
and draws with the ordered production frame passes and shared flight layers.
It is not the production flight shell and does not define the final Gauntlet
mode.

The bench uses a Scout player build and two hostile pirate Scouts. Each pirate
pilots itself and uses the same weapon and damage systems as flight.
The player can apply left and right thrust from keyboard or pointer controls,
reset to a fresh deterministic encounter, and inspect elapsed time and both
hull values. The page targets Lab viewports at least 1280 CSS pixels wide.

## Contract

### Definition of Done

- `/lab/gauntlet` is listed in the Lab Tools group as a production example.
- The bench uses `Simulation` in Gauntlet mode, `drawFlightFrame`,
  `FlightLayers`, and production input, build and FX definitions.
- Reset creates a fresh encounter with one player and two hostile Scouts.
- Keyboard and pointer controls apply player thrust; both pirates remain
  autonomous and have independent hull readouts.
- The readout identifies the outcome and all three ships' current hull values.
