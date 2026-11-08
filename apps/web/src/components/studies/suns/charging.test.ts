import { solarCollectionRate } from "@void-drift/core";
import { gameSettings, Simulation } from "@void-drift/mode-a";
import { describe, expect, it } from "vitest";
import {
  breakEven,
  chargingRuns,
  coastDrain,
  collection,
  initialIonDraw,
  initialPeak,
  poweredDrain,
  radius,
  reach,
} from "./charging";

describe("sun charging study", () => {
  it("retains selected-shoulder parity with the implemented standard Sun", () => {
    const star = new Simulation(gameSettings("wasp")).star;
    for (const d of [35, 55, 80, 100, 200, reach, reach + 1])
      expect(collection(d, 7.5, "shoulder")).toBeCloseTo(
        solarCollectionRate(d, star),
      );
  });
  it("has an exact zero at the gravity boundary and a coasting break-even inside it", () => {
    expect(collection(reach, initialPeak)).toBe(0);
    expect(collection(reach + 100, initialPeak)).toBe(0);
    expect(collection(radius, initialPeak)).toBe(initialPeak);
    const d = breakEven(coastDrain, initialPeak);
    expect(d).not.toBeNull();
    if (d === null) throw new Error("Missing coast break-even");
    expect(collection(d, initialPeak)).toBeCloseTo(coastDrain);
    const powered = breakEven(poweredDrain, initialPeak);
    if (powered === null) throw new Error("Missing powered break-even");
    expect(powered).toBeLessThan(d);
    expect(collection(powered, initialPeak)).toBeCloseTo(poweredDrain);
  });
  it("changing collection cannot change the flight paths or consumption", () => {
    for (const burn of ["course", "turn", "weave"] as const) {
      const a = chargingRuns(burn, 4),
        b = chargingRuns(burn, 8);
      a.forEach((track, i) => {
        expect(track.samples).toEqual(b[i].samples);
        expect(track.traces.consumption).toEqual(b[i].traces.consumption);
        track.traces.collection?.forEach((gross, t) => {
          expect(b[i].traces.collection?.[t]).toBeCloseTo(gross * 2);
          expect(track.traces.netPower?.[t]).toBeCloseTo(
            gross - (track.traces.consumption?.[t] ?? 0),
          );
        });
        if (track.contacts?.length)
          expect(track.contacts[0]).toBe(track.samples.length - 1);
      });
    }
  });
  it("isolates all budget edits from motion and integrates net power from zero", () => {
    for (const burn of ["course", "turn", "weave"] as const) {
      const baseline = chargingRuns(burn, initialPeak);
      const free = chargingRuns(burn, initialPeak, 0, 0);
      const life = chargingRuns(
        burn,
        initialPeak,
        coastDrain + 1,
        initialIonDraw,
      );
      const ion = chargingRuns(
        burn,
        initialPeak,
        coastDrain,
        initialIonDraw * 2,
      );
      baseline.forEach((track, i) => {
        for (const edited of [free[i], life[i], ion[i]])
          expect(edited.samples).toEqual(track.samples);
        expect(free[i].traces.consumption?.every((v) => v === 0)).toBe(true);
        let total = 0;
        track.traces.netPower?.forEach((net, t) => {
          if (t > 0) total += net / 60;
          expect(track.traces.batteryChange?.[t]).toBeCloseTo(total);
          const draw = track.traces.consumption?.[t] ?? 0;
          expect(life[i].traces.consumption?.[t]).toBeCloseTo(draw + 1);
          expect(ion[i].traces.consumption?.[t]).toBeCloseTo(
            coastDrain + 2 * (draw - coastDrain),
          );
        });
      });
    }
  });
  it("compares edge and shoulder profiles without changing motion", () => {
    expect(collection(reach, 7.5, "edge")).toBeCloseTo(0.75);
    expect(collection(reach + 0.001, 7.5, "edge")).toBe(0);
    expect(collection(radius + 20, 7.5, "shoulder")).toBeCloseTo(7.5);
    for (const profile of ["edge", "shoulder"] as const) {
      const crossing = breakEven(0.8, 7.5, profile);
      if (crossing === null) throw Error("Missing crossing");
      expect(collection(crossing, 7.5, profile)).toBeCloseTo(0.8);
      const a = chargingRuns("course", 7.5, 0.8, 1),
        b = chargingRuns("course", 7.5, 0.8, 1, profile);
      a.forEach((t, i) => {
        expect(b[i].samples).toEqual(t.samples);
        expect(b[i].traces.consumption).toEqual(t.traces.consumption);
      });
    }
  });
});
