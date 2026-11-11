import { defaultLoadout, PARTS } from "@void-drift/mode-a";
import { describe, expect, it } from "vitest";
import { FlightSceneDocumentSchema } from "./config";
import { FlightRun } from "./flight";

// A Wasp with a plasma main engine: one delayed engine beside ion stabilizers.
const doc = FlightSceneDocumentSchema.parse({
  loadout: { ...defaultLoadout("wasp"), side: "plasma" },
});
const pose = (run: FlightRun) => ({
  x: run.sim.ship.pos.x,
  y: run.sim.ship.pos.y,
  rotation: run.sim.ship.rotation,
  vx: run.sim.ship.vel.x,
  vy: run.sim.ship.vel.y,
  power: run.sim.state.resources.power,
});

describe("study light", () => {
  it("does not change the flight", () => {
    const plain = new FlightRun(doc, "weave");
    const replaced = new FlightRun(doc, "weave", undefined, ["plasma"]);
    plain.seek(600);
    replaced.seek(600);
    expect(pose(replaced)).toEqual(pose(plain));
  });
});

describe("part tuning", () => {
  it("leaves the game's parts unchanged", () => {
    const game = PARTS.plasma.chargeSeconds;
    new FlightRun(doc, "course", undefined, [], {
      plasma: { chargeSeconds: game / 3 },
    }).seek(120);
    expect(PARTS.plasma.chargeSeconds).toBe(game);
  });
});
