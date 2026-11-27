import {
  buildDrain,
  buildStats,
  LIFE_SUPPORT_DRAIN,
  PARTS,
} from "@void-drift/mode-a";
import { describe, expect, it } from "vitest";
import { DT, TICK_RATE } from "./burns";
import { calculate } from "./calculate";
import { InstrumentConfig, serialize } from "./config";
import { FISSION_COMPARISON } from "./fission-comparison";
import { calculatePaidIgnition, REFERENCE_SUPPLY } from "./paid-ignition";

const [waspIon, waspFission, fighterIon, , aftPair, sideFission] =
  FISSION_COMPARISON.vehicles;
const replay = (vehicle: (typeof FISSION_COMPARISON.vehicles)[number]) =>
  calculatePaidIgnition(vehicle, "turn", "white");

describe("paid ignition in the Motion instrument", () => {
  it("exports an opt-in comparison, separate from the ordinary budget and pulse overrides", () => {
    const config = InstrumentConfig.parse(FISSION_COMPARISON);
    expect(InstrumentConfig.parse(JSON.parse(serialize(config)))).toEqual(
      config,
    );
    expect(config.vehicles).toHaveLength(6);
    expect(
      InstrumentConfig.safeParse({ ...config, energy: { fields: [] } }).success,
    ).toBe(false);
    expect(
      InstrumentConfig.safeParse({
        ...config,
        properties: { fusion: { pulseOn: 0.1 } },
      }).success,
    ).toBe(false);
  });

  it("marks the result sample of a paid Wasp kick, not the held ion command or the ordinary pulse", () => {
    const trace = replay(waspFission);
    const { mass, capacity } = buildStats(waspFission.loadout);
    const { impulse, energyPerIgnition, recoveryTicks } = PARTS.fusion;
    expect(trace.marks?.speed?.slice(0, 2)).toEqual([1, 1 + recoveryTicks]);
    expect(trace.marks?.turn).toEqual(trace.marks?.speed);
    expect(trace.marks?.battery).toEqual(trace.marks?.speed);
    expect(trace.traces.speed?.[0]).toBe(0);
    expect(trace.traces.speed?.[1]).toBeCloseTo(impulse / mass);
    expect(trace.traces.battery?.[0]).toBe(capacity);
    expect(trace.traces.battery?.[1]).toBeCloseTo(
      capacity -
        energyPerIgnition +
        (3 * (REFERENCE_SUPPLY - LIFE_SUPPORT_DRAIN) * DT) / 4,
    );
    expect(replay(waspIon).marks?.speed).toEqual([]);
    expect(calculate(waspFission, "turn")[1].vx).toBeLessThan(
      trace.samples[1].vx,
    );
  });

  it("shows a single linked purchase at the combined price, and side kicks through the B2 turn", () => {
    const linked = {
      ...aftPair,
      loadout: { ...aftPair.loadout, linkedEngines: true },
    };
    const pair = replay(linked);
    const both = { leftThruster: true, rightThruster: true, fire: false };
    const continuous = buildDrain(linked.loadout, both) - LIFE_SUPPORT_DRAIN;
    const { capacity } = buildStats(linked.loadout);
    expect(pair.marks?.battery?.[0]).toBe(1);
    expect(pair.traces.battery?.[1]).toBeCloseTo(
      capacity -
        2 * PARTS.fusion.energyPerIgnition -
        continuous * DT +
        (3 * (REFERENCE_SUPPLY - LIFE_SUPPORT_DRAIN) * DT) / 4,
    );
    const turn = 6 * TICK_RATE + 1;
    const side = replay(sideFission);
    expect(side.marks?.turn).toContain(turn);
    expect(side.samples[turn].spin).not.toBeCloseTo(
      replay(fighterIon).samples[turn].spin,
    );
    expect(
      replay(aftPair).marks?.turn?.some(
        (tick) => tick >= turn && tick <= 9 * TICK_RATE,
      ),
    ).toBe(false);
  });
});
