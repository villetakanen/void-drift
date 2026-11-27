import { buildStats, PARTS } from "@void-drift/mode-a";
import { describe, expect, it } from "vitest";
import { DT } from "./burns";
import { calculate } from "./calculate";
import { InstrumentConfig } from "./config";
import { EnergyAnalysis, energyTraces } from "./energy";
import { FISSION_COMPARISON } from "./fission-comparison";

const wasp = FISSION_COMPARISON.vehicles[1];

describe("ordinary Fission motion and energy", () => {
  it("uses fitted mass, ignition recovery and the configured event cost", () => {
    const properties = {
      fusion: { impulse: 3000, recoveryTicks: 20, energyPerIgnition: 2 },
    };
    const samples = calculate(wasp, "turn", {}, properties);
    expect(samples[1].vx).toBeCloseTo(3000 / buildStats(wasp.loadout).mass);
    expect(samples[1].ignitionEnergy).toBe(2);
    expect(samples[20].ignitionEnergy).toBe(0);
    expect(samples[21].ignitionEnergy).toBe(2);
    const energy = energyTraces(
      samples,
      wasp,
      "turn",
      EnergyAnalysis.parse({ fields: [] }),
      properties,
    );
    expect(energy.consumption[1] - energy.consumption[2]).toBeCloseTo(2 / DT);
    expect(energy.batteryChange[1]).toBeCloseTo(-energy.consumption[1] * DT);
  });

  it("stops charging ignition events at the cruise ceiling", () => {
    const samples = calculate(wasp, "turn");
    expect(samples[1].ignitionEnergy).toBe(PARTS.fusion.energyPerIgnition);
    expect(samples[360].ignitionEnergy).toBe(0);
    expect(
      InstrumentConfig.safeParse({
        version: 1,
        vehicles: [wasp],
        properties: { fusion: { pulseOn: 0.18 } },
      }).success,
    ).toBe(false);
  });
});
