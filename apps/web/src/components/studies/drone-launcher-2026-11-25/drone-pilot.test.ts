import { type GameObject, Vec2 } from "@void-drift/core";
import { engineImpulse, STEP } from "@void-drift/mode-a";
import { expect, it } from "vitest";
import { FlightRun } from "../../../lib/flight-scene";
import {
  AI_FLIGHT,
  COMMANDS,
  createLaunchGate,
  DEFAULT_PILOT,
  droneMode,
  EncounterSchema,
  predictTick,
} from "./drone-pilot";
import { DRONE_ENGINE_LIMIT, droneSteering } from "./flight-motion";
import { AI_SCENE, pilotExperiment } from "./launch";

it("prioritizes the enemy and excludes exactly 500 u from both ranges", () => {
  expect(droneMode(499.999, 1)).toBe("Pursuit");
  expect(droneMode(500, 499.999)).toBe("Return");
  expect(droneMode(500, 500)).toBe("Drift");
  expect(droneMode(501, 0)).toBe("Return");
});
function body(speed = 140): GameObject {
  return {
    pos: new Vec2(0, 0),
    vel: new Vec2(speed, 35),
    acc: new Vec2(0, 0),
    rotation: 0.7,
    radius: 3,
  };
}
it("predicts the actual drone response across spin, commands and inherited overspeed", () => {
  for (const initialSpin of [-2, -0.3, 0, 0.7, 2])
    for (const speed of [0, 140, 350])
      for (const [index, command] of COMMANDS.entries()) {
        const live = body(speed),
          predicted = body(speed);
        let spin = initialSpin,
          predictedSpin = spin;
        for (let tick = 0; tick < 72; tick++) {
          const steering = droneSteering(
            live.rotation,
            spin,
            command.turn,
            STEP,
            "Fighter",
            command.burn,
          );
          live.rotation = steering.angle;
          engineImpulse(
            live,
            steering.direction,
            AI_FLIGHT.acceleration * steering.accelerationFraction,
            DRONE_ENGINE_LIMIT,
            STEP,
          );
          live.pos.x += live.vel.x * STEP;
          live.pos.y += live.vel.y * STEP;
          spin = steering.angularVelocity;
          predictedSpin = predictTick(predicted, predictedSpin, index);
        }
        expect(
          Math.hypot(
            live.pos.x - predicted.pos.x,
            live.pos.y - predicted.pos.y,
          ),
        ).toBeLessThan(1);
        expect(Math.abs(live.rotation - predicted.rotation)).toBeLessThan(0.02);
        expect(Math.abs(spin - predictedSpin)).toBeLessThan(0.02);
      }
});
it("Off keeps drift while settling angular motion without main output", () => {
  const live = body(350);
  let spin = 1.4;
  for (let tick = 0; tick < 120; tick++) {
    const response = droneSteering(
      live.rotation,
      spin,
      0,
      STEP,
      "Fighter",
      false,
    );
    expect(response.mainFraction).toBe(0);
    expect(response.angularVelocity).toBeGreaterThanOrEqual(0);
    expect(response.angularVelocity).toBeLessThanOrEqual(spin);
    spin = predictTick(live, spin, 0);
  }
  expect(spin).toBe(0);
  expect(live.vel.mag()).toBeGreaterThan(300);
  const velocity = live.vel.clone();
  for (let tick = 0; tick < 60; tick++) spin = predictTick(live, spin, 0);
  expect(live.vel).toEqual(velocity);
});
it("gates launch at inclusive range and cancels a preview if the enemy leaves", () => {
  const gate = createLaunchGate(450);
  expect(gate.step(0.9, 451)).toEqual({ seated: false, release: false });
  expect(gate.step(1, 450)).toEqual({ seated: true, release: false });
  expect(gate.step(1.05, 450.001)).toEqual({ seated: false, release: false });
  expect(gate.step(1.1, 450)).toEqual({ seated: true, release: false });
  expect(gate.step(1.2, 450)).toEqual({ seated: false, release: true });
  expect(gate.step(2, 0)).toEqual({ seated: false, release: false });
  const opening = createLaunchGate(450);
  expect(opening.step(0.9, 450).seated).toBe(true);
  expect(opening.step(1, 450).release).toBe(true);
  expect(droneMode(475, 20, { ...DEFAULT_PILOT, launchRange: 50 })).toBe(
    "Pursuit",
  );
});

it("flies both legitimate encounters through their modes and reconstructs on rewind", () => {
  for (const encounter of EncounterSchema.options) {
    let status = "";
    const run = new FlightRun(
      AI_SCENE,
      "course",
      "none",
      [],
      {},
      pilotExperiment(
        { ...DEFAULT_PILOT, encounter },
        (value) => (status = value),
      ),
    );
    const transitions: string[] = [];
    const modes = new Set<string>();
    let previous = "";
    for (let tick = 1; tick <= 840; tick++) {
      run.seek(tick);
      expect(run.lost).toBeNull();
      expect(status).not.toContain("NaN");
      const mode = status.split(" · ")[0];
      if (["Return", "Pursuit", "Drift"].includes(mode)) modes.add(mode);
      if (mode !== previous && modes.has(mode))
        transitions.push(`${tick / 60}: ${status}`);
      previous = mode;
    }
    const pursuitStart = Number(transitions[0].split(":")[0]);
    const secondStart = Number(transitions[1].split(":")[0]);
    expect(pursuitStart).toBeGreaterThan(1);
    expect(secondStart - pursuitStart).toBeGreaterThan(
      encounter === "Long pursuit" ? 5 : 2,
    );
    expect(14 - secondStart).toBeGreaterThan(
      encounter === "Long pursuit" ? 3 : 5,
    );
    if (encounter === "Early departure")
      expect(Number(/carrier (\d+) u/.exec(status)?.[1])).toBeLessThan(15);
    else expect(status).toContain("spin 0°/s");
    expect(modes.has("Pursuit")).toBe(true);
    expect(modes.has(encounter === "Long pursuit" ? "Drift" : "Return")).toBe(
      true,
    );
    const final = status;
    run.seek(60);
    run.seek(840);
    expect(status).toBe(final);
  }
});
