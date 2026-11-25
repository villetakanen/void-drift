import { type GameObject, Vec2 } from "@void-drift/core";
import {
  applyBuildEngines,
  defaultLoadout,
  engineImpulse,
  PARTS,
  STEP,
} from "@void-drift/mode-a";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_FLIGHT,
  DRONE_ENGINE_LIMIT,
  type DroneFlight,
  droneBeam,
  droneSteering,
  type FlightStyle,
  FlightStyleSchema,
  flightCommand,
  stepDrone,
} from "./flight-motion";
import { railLaunchSample } from "./launch-motion";

const rail = { x: 2, y: 3, angle: 0, length: 14 };
const carrier = { x: 0, y: 0, vx: 90, vy: 0, angle: 0 };
function flight(style: FlightStyle, end = 240, acceleration = 60) {
  const drone: DroneFlight = { time: 1 };
  const samples = [];
  for (let tick = 60; tick <= end; tick++) {
    samples.push(
      stepDrone(drone, carrier, carrier, tick * STEP, STEP, rail, {
        ...DEFAULT_FLIGHT,
        style,
        acceleration,
      }),
    );
  }
  return samples;
}

describe("study drone engine envelope", () => {
  function body(speed: number): GameObject {
    return {
      pos: new Vec2(0, 0),
      vel: new Vec2(speed, 0),
      acc: new Vec2(0, 0),
      rotation: 0,
      radius: 3,
    };
  }
  it("uses the ship taper without deleting inherited overspeed, and retains braking and steering", () => {
    const half = body(DRONE_ENGINE_LIMIT / 2);
    expect(engineImpulse(half, 0, 60, DRONE_ENGINE_LIMIT, STEP)).toBeCloseTo(
      0.5,
    );
    expect(half.vel.x).toBeCloseTo(DRONE_ENGINE_LIMIT / 2 + 0.5);
    const fast = body(350);
    expect(engineImpulse(fast, 0, 60, DRONE_ENGINE_LIMIT, STEP)).toBeCloseTo(0);
    expect(fast.vel.mag()).toBe(350);
    engineImpulse(fast, Math.PI / 2, 60, DRONE_ENGINE_LIMIT, STEP);
    expect(fast.vel.y).toBeGreaterThan(0);
    expect(fast.vel.mag()).toBeCloseTo(350);
    engineImpulse(fast, Math.PI, 60, DRONE_ENGINE_LIMIT, STEP);
    expect(fast.vel.mag()).toBeLessThan(350);
  });
  it("zero acceleration has finite state and no plume, retaining ballistic drift", () => {
    const samples = flight("Scout", 240, 0);
    for (const sample of samples) {
      expect(sample.output).toBe(0);
      expect(sample.vx).toBe(sample.onRail ? 90 : 160);
      expect(sample.vy).toBe(0);
      expect(Number.isFinite(sample.angle)).toBe(true);
    }
  });
});

it("preserves moving rail attachment and complete ballistic handoff before ignition for every style", () => {
  for (const style of FlightStyleSchema.options) {
    const drone: DroneFlight = { time: 1 };
    const reference = { time: 1 };
    let previous = carrier;
    for (let tick = 60; tick <= 87; tick++) {
      const time = tick * STEP;
      const pose = {
        ...carrier,
        x: time * 90,
        y: time * 10,
        angle: time * 0.7,
      };
      const expected = railLaunchSample(
        reference,
        previous,
        pose,
        time,
        STEP,
        rail,
        DEFAULT_FLIGHT,
      );
      const actual = stepDrone(drone, previous, pose, time, STEP, rail, {
        ...DEFAULT_FLIGHT,
        style,
      });
      const { distance: _distance, ...poseExpected } = expected;
      expect(actual).toMatchObject(poseExpected);
      expect(actual.output).toBe(0);
      expect(actual.angularVelocity).toBe(0);
      previous = pose;
    }
  }
});

it("coasts while Wasp turns, burns through Fighter and Scout turns, and reconstructs distinct trajectories", () => {
  const tracks = FlightStyleSchema.options.map((style) => flight(style));
  const turning = tracks.map((samples) => samples[45]); // 1.75 s, first left
  expect(turning[0].command).toBe("Left");
  expect(turning[0].output).toBe(0);
  expect(turning[0].vx).toBeCloseTo(tracks[0][35].vx);
  expect(turning[1].output).toBeGreaterThan(0);
  expect(turning[2].output).toBeGreaterThan(0);
  expect(Math.abs(turning[2].angularVelocity)).toBeGreaterThan(
    Math.abs(turning[1].angularVelocity),
  );
  const ends = tracks.map((track) => track.at(-1));
  expect(Math.abs((ends[0]?.y ?? 0) - (ends[1]?.y ?? 0))).toBeGreaterThan(1);
  expect(Math.abs((ends[1]?.y ?? 0) - (ends[2]?.y ?? 0))).toBeGreaterThan(1);
  for (const [index, style] of FlightStyleSchema.options.entries()) {
    flight(style, 120); // A prior, shorter inspection cannot leak into a replay.
    expect(flight(style)).toEqual(tracks[index]);
  }
});

it("starts left at ignition and switches L/F/R/F at every half-second boundary", () => {
  const sequence = ["Left", "Forward", "Right", "Forward", "Left", "Forward"];
  for (let i = 0; i < sequence.length; i++) {
    expect(flightCommand(i * 0.5).name).toBe(sequence[i]);
    expect(flightCommand(i * 0.5 + 0.25).name).toBe(sequence[i]);
    expect(flightCommand(i * 0.5 + 0.49999).name).toBe(sequence[i]);
  }
});

it("anchors both plume axes to the production Service and Light Ion sources", () => {
  for (const [size, id] of [
    [0, "service-ion"],
    [100, "ion"],
  ] as const) {
    const production = PARTS[id].ion?.beam;
    expect(droneBeam(size)).toMatchObject({
      length: production?.length,
      width: production?.width,
    });
  }
  expect(droneBeam(50).length).toBeCloseTo(
    (droneBeam(0).length + droneBeam(100).length) / 2,
  );
  expect(droneBeam(50).width).toBeCloseTo(
    (droneBeam(0).width + droneBeam(100).width) / 2,
  );
});

it("matches the stabilized production Fighter's turning, counter-burn and thrust direction", () => {
  const reference = {
    pos: new Vec2(0, 0),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: 0,
    radius: 3,
  };
  const motion = { velocity: 0 };
  let angle = 0,
    spin = 0;
  for (let tick = 0; tick < 360; tick++) {
    const turn = tick < 30 ? -1 : 0;
    reference.vel.set(0, 0); // Compare the un-tapered impulse, before drone scaling.
    applyBuildEngines(
      reference,
      defaultLoadout("fighter"),
      {
        leftThruster: turn >= 0,
        rightThruster: turn <= 0,
        fire: false,
      },
      STEP,
      true,
      {},
      1,
      motion,
    );
    const next = droneSteering(angle, spin, turn, STEP, "Fighter");
    expect(next.angle).toBeCloseTo(reference.rotation, 12);
    expect(next.angularVelocity).toBeCloseTo(motion.velocity, 12);
    expect(next.direction).toBeCloseTo(
      Math.atan2(reference.vel.y, reference.vel.x),
      12,
    );
    if (tick >= 30) {
      expect(next.angularVelocity).toBeLessThanOrEqual(0);
      expect(Math.abs(next.angularVelocity)).toBeLessThanOrEqual(
        Math.abs(spin),
      );
    }
    angle = next.angle;
    spin = next.angularVelocity;
  }
  expect(spin).toBe(0);
});

it("settles every style after turn release without reversing or relighting from braking alone", () => {
  for (const style of FlightStyleSchema.options) {
    let angle = 0,
      spin = 0;
    for (let tick = 0; tick < 360; tick++) {
      const next = droneSteering(angle, spin, tick < 30 ? 1 : 0, STEP, style);
      if (tick >= 30) {
        expect(next.angularVelocity).toBeGreaterThanOrEqual(0);
        expect(next.angularVelocity).toBeLessThanOrEqual(spin);
        expect(next.mainFraction).toBeCloseTo(1); // Forward pair, no stabilizer addition.
      }
      angle = next.angle;
      spin = next.angularVelocity;
    }
    expect(spin).toBe(0);
  }
});
