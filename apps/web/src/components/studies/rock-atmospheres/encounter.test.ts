import { expect, it } from "vitest";
import { FlightRun } from "../../../lib/flight-scene/flight";
import { studyLightState } from "../../../lib/flight-scene/light";
import { atmosphereSample } from "../../../lib/flight-scene/planet";
import { heatStart, ROCK_HEAT_SCENE } from "./fixture";
import { heatExcitation } from "./heat";

it("offers an air miss and two increasingly strong exposures without solid contact", () => {
  for (const burn of ["course", "turn", "weave"] as const) {
    const peaks: number[] = [];
    for (const approach of ["Outside", "Skim", "Deeper"]) {
      const doc = { ...ROCK_HEAT_SCENE, start: heatStart(approach) };
      const run = new FlightRun(doc, burn);
      let peak = 0,
        entered = false,
        exited = false;
      for (let tick = 1; tick <= 840; tick++) {
        run.advance();
        const sample = atmosphereSample(run.sim.ship, run.sim.planets[0], 10);
        expect(sample.clearance).toBeGreaterThan(0);
        expect(run.sim.state.resources.hull).toBe(100);
        const cue = heatExcitation(
          studyLightState(run.sim, doc.loadout, tick, 10),
        );
        peak = Math.max(peak, cue);
        if (cue > 0) entered = true;
        else if (entered) exited = true;
      }
      expect(entered).toBe(approach !== "Outside");
      expect(exited).toBe(entered);
      peaks.push(peak);
    }
    expect(peaks[0]).toBe(0);
    expect(peaks[1]).toBeGreaterThan(0);
    expect(peaks[2]).toBeGreaterThan(peaks[1]);
  }
});
