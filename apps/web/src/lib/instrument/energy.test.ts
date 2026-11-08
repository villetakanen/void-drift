import { defaultLoadout } from "@void-drift/mode-a";
import { describe, expect, it } from "vitest";
import { GravityTuningConfig } from "../gravity-tuning/config";
import { calculate } from "./calculate";
import { InstrumentConfig } from "./config";
import { EnergyAnalysis, energyTraces } from "./energy";

const vehicle = { label: "Wasp", loadout: defaultLoadout("wasp") };
const field = {
  x: 400,
  y: 0,
  reach: 324,
  shoulder: 55,
  peak: 7.5,
  outerFraction: 0.1,
};
describe("shared Path energy fields", () => {
  it("validates geometry and round-trips the same independent fields with motion and gravity", () => {
    const energy = EnergyAnalysis.parse({ fields: [field] });
    const doc = InstrumentConfig.parse({
      version: 1,
      vehicles: [vehicle],
      energy,
    });
    expect(InstrumentConfig.parse(JSON.parse(JSON.stringify(doc)))).toEqual(
      doc,
    );
    expect(GravityTuningConfig.parse({ version: 1, energy }).energy).toEqual(
      energy,
    );
    for (const bad of [
      { reach: 0 },
      { shoulder: 324 },
      { outerFraction: 1.1 },
      { peak: -1 },
      { reach: Infinity },
    ])
      expect(
        EnergyAnalysis.safeParse({ fields: [{ ...field, ...bad }] }).success,
      ).toBe(false);
    expect(
      EnergyAnalysis.safeParse({ fields: [field], feedback: "enabled" })
        .success,
    ).toBe(false);
  });
  it("preserves motion and synchronized signed power integration across budget edits", () => {
    const samples = calculate(vehicle, "course");
    const before = structuredClone(samples);
    const energy = EnergyAnalysis.parse({ fields: [field] });
    const a = energyTraces(samples, vehicle, "course", energy);
    const b = energyTraces(samples, vehicle, "course", {
      ...energy,
      fields: [{ ...field, peak: 15 }],
      lifeSupport: 1.8,
    });
    expect(samples).toEqual(before);
    let total = 0;
    a.netPower.forEach((net, tick) => {
      expect(net).toBeCloseTo(a.collection[tick] - a.consumption[tick]);
      if (tick) total += net / 60;
      expect(a.batteryChange[tick]).toBeCloseTo(total);
      expect(b.collection[tick]).toBeCloseTo(a.collection[tick] * 2);
      expect(b.consumption[tick]).toBeCloseTo(a.consumption[tick] + 1);
    });
  });
  it("scales inherent and fitted collectors additively and leaves non-ion draw alone", () => {
    const samples = calculate(vehicle, "course");
    const energy = EnergyAnalysis.parse({
      fields: [{ ...field, reach: 10000 }],
    });
    const bare = energyTraces(samples, vehicle, "course", energy);
    const fitted = structuredClone(vehicle);
    fitted.loadout.hull[0] = "coil";
    const added = energyTraces(samples, fitted, "course", energy);
    bare.collection.forEach((v, i) => {
      expect(added.collection[i]).toBeCloseTo(2 * v);
    });
    const fission = { label: "Fission", loadout: defaultLoadout("fighter") };
    fission.loadout.side = "fusion";
    fission.loadout.stabilizers = false;
    expect(
      energyTraces(samples, fission, "course", { ...energy, ionDraw: 0 })
        .consumption,
    ).toEqual(energyTraces(samples, fission, "course", energy).consumption);
  });
});
