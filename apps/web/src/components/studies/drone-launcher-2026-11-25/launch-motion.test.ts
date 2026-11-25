import { describe, expect, it } from "vitest";
import {
  DEFAULT_LAUNCH,
  launchSample,
  previewVisible,
  type RailLaunch,
  railLaunchSample,
} from "./launch-motion";

describe("drone ejection", () => {
  it("inherits the complete ship velocity and adds forward ejection", () => {
    const release = {
      x: 20,
      y: 40,
      vx: 120,
      vy: 35,
      angle: Math.PI / 2,
      time: 1,
    };
    const sample = launchSample(release, 1, DEFAULT_LAUNCH);
    expect(sample.vx).toBeCloseTo(120);
    expect(sample.vy).toBeCloseTo(105);
    expect(sample.x).toBe(20);
    expect(sample.y).toBe(40);
    expect(sample.powered).toBe(false);
  });
  it("ignites after relative clearance regardless of inherited speed and stays continuous", () => {
    const a = { x: 0, y: 0, vx: 0, vy: 0, angle: 0, time: 1 };
    const b = { ...a, vx: 400, vy: -90 };
    const ignition =
      1 + DEFAULT_LAUNCH.ignitionDistance / DEFAULT_LAUNCH.ejectSpeed;
    expect(launchSample(a, ignition - 1e-6, DEFAULT_LAUNCH).powered).toBe(
      false,
    );
    for (const release of [a, b]) {
      const sample = launchSample(release, ignition + 1e-8, DEFAULT_LAUNCH);
      expect(sample.powered).toBe(true);
      expect(sample.distance).toBeCloseTo(DEFAULT_LAUNCH.ignitionDistance);
      expect(sample.vx - release.vx).toBeCloseTo(DEFAULT_LAUNCH.ejectSpeed);
      expect(
        launchSample(release, ignition + 1, DEFAULT_LAUNCH).vx - release.vx,
      ).toBeCloseTo(DEFAULT_LAUNCH.ejectSpeed);
    }
  });
});

describe("moving launcher", () => {
  const rail = { x: 2, y: 3, angle: 0, length: 14 };
  const options = { ...DEFAULT_LAUNCH, ejectSpeed: 70 };
  const previous = { x: 0, y: 0, vx: 10, vy: 20, angle: 0 };
  it("only shows the seated drone during the last tenth-second", () => {
    for (const launch of [1, 3, 5]) {
      expect(previewVisible(launch - 0.11, launch)).toBe(false);
      expect(previewVisible(launch - 0.1, launch)).toBe(true);
      expect(previewVisible(launch - 0.01, launch)).toBe(true);
      expect(previewVisible(launch, launch)).toBe(false);
    }
  });
  it("keeps the centre on translating and rotating rails until the muzzle", () => {
    const carrier = { ...previous, x: 30, y: 40, angle: Math.PI / 2 };
    const launch = { time: 1 };
    const sample = railLaunchSample(
      launch,
      previous,
      carrier,
      1.1,
      0.1,
      rail,
      options,
    );
    expect(sample.x).toBeCloseTo(27);
    expect(sample.y).toBeCloseTo(49);
    expect(sample.angle).toBe(carrier.angle);
    expect(sample.onRail).toBe(true);
    expect(sample.powered).toBe(false);
  });
  it("hands off at the muzzle with its transverse velocity and keeps that heading", () => {
    const launch: RailLaunch = { time: 1 };
    const carrier = { ...previous, x: 1, y: 2, angle: 0.1 };
    const sample = railLaunchSample(
      launch,
      previous,
      carrier,
      1.2,
      0.1,
      rail,
      options,
    );
    const offsetX = 16 * Math.cos(0.1) - 3 * Math.sin(0.1);
    const offsetY = 16 * Math.sin(0.1) + 3 * Math.cos(0.1);
    expect(sample.onRail).toBe(false);
    expect(sample.x).toBeCloseTo(carrier.x + offsetX);
    expect(sample.y).toBeCloseTo(carrier.y + offsetY);
    expect(sample.vx).toBeCloseTo(10 - offsetY + 70 * Math.cos(0.1));
    expect(sample.vy).toBeCloseTo(20 + offsetX + 70 * Math.sin(0.1));
    const free = railLaunchSample(
      launch,
      carrier,
      { ...carrier, x: 500, angle: 2 },
      1.21,
      0.01,
      rail,
      options,
    );
    expect(free.x).toBeCloseTo(sample.x + sample.vx * 0.01);
    expect(free.y).toBeCloseTo(sample.y + sample.vy * 0.01);
    expect(free.angle).toBe(sample.angle);
    expect(free.ignitionTime).toBeCloseTo(1 + 32 / 70);
  });
  it("reconstructs sub-tick handoff identically and never ignites inside the gun", () => {
    const carrier = { ...previous, x: 1, y: 2, angle: 0.1 };
    const sample = () =>
      railLaunchSample({ time: 1 }, previous, carrier, 1.205, 0.01, rail, {
        ...options,
        ignitionDistance: 5,
      });
    const halfAngle = 0.05;
    const offsetX = 16 * Math.cos(halfAngle) - 3 * Math.sin(halfAngle);
    const offsetY = 16 * Math.sin(halfAngle) + 3 * Math.cos(halfAngle);
    const expectedVx = 10 - 10 * offsetY + 70 * Math.cos(halfAngle);
    expect(sample().x).toBeCloseTo(0.5 + offsetX + expectedVx * 0.005);
    expect(sample().distance).toBeGreaterThan(rail.length);
    expect(sample().powered).toBe(true);
    expect(sample().ignitionTime).toBeCloseTo(1.2);
  });
});
