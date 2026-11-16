import { it } from "vitest";
import { FlightRun } from "../../../lib/flight-scene";
import { scene } from "./fixture";

it("reports full fixed burns for staging", () => {
  for (const burn of ["course", "turn", "weave"] as const) {
    const run = new FlightRun(scene, burn);
    const samples: unknown[] = [];
    for (let tick = 1; tick <= 840; tick++) {
      run.advance();
      if ([130, 155, 156, 170, 180, 210, 840].includes(tick)) {
        const s = run.sim.ship;
        samples.push({
          tick,
          x: s.pos.x,
          y: s.pos.y,
          rotation: s.rotation,
          vx: s.vel.x,
          vy: s.vel.y,
        });
      }
    }
    console.log(burn, JSON.stringify(samples), run.lost);
  }
});
