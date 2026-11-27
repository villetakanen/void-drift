import { describe, expect, it } from "vitest";
import { partFigures } from "./part-figures";
import {
  FISSION_PAID_IGNITION,
  PARTS,
  PaidIgnitionPartSchema,
} from "./schemas/loadout";

const fission = FISSION_PAID_IGNITION;

describe("paid Fission catalogue foundation", () => {
  it("keeps the preview save key and carries the approved per-nozzle tuning", () => {
    expect(fission).toMatchObject({
      id: PARTS.fusion.id,
      releaseClass: "preview",
      category: "E",
      response: "paid-ignition",
      mass: 17,
      speedContribution: 42,
      impulse: 5928,
      recoveryTicks: 16,
      energyPerIgnition: 0.5,
    });
  });

  it.each([
    { response: "pulse" },
    { releaseClass: "scored" },
    { category: "U" },
    { impulse: Infinity },
    { recoveryTicks: 0 },
    { recoveryTicks: 1.5 },
    { energyPerIgnition: 0 },
    { draw: 3 },
    { pulseOn: 0.18 },
  ])("rejects a mixed or invalid paid response: %j", (override) => {
    expect(
      PaidIgnitionPartSchema.safeParse({ ...fission, ...override }).success,
    ).toBe(false);
  });

  it("distinguishes ignition figures from continuous draw", () => {
    expect(partFigures(fission)).toEqual([
      { icon: "mass", value: "17", label: "mass" },
      {
        icon: "thrust",
        value: "5,928",
        label: "impulse per ignition per nozzle",
      },
      {
        icon: "energy",
        value: "0.5 E/ign",
        label: "energy per ignition per nozzle",
      },
      {
        icon: "cruise",
        value: "+42",
        label: "units per second added to the cruise ceiling",
      },
    ]);
    expect(
      partFigures("ion").find(({ icon }) => icon === "energy")?.label,
    ).toBe("energy per second");
  });
});
