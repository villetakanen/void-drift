import { expect, it } from "vitest";
import { stockSettings } from "../simulation";
import { FlightSettingsSchema } from "./flight";

it("normalizes legacy test flight settings and gives explicit modes precedence", () => {
  const { mode: _mode, testFlight: _testFlight, ...legacy } = stockSettings();
  expect(FlightSettingsSchema.parse(legacy).mode).toBe("survival");
  expect(FlightSettingsSchema.parse({ ...legacy, testFlight: true }).mode).toBe(
    "practice",
  );
  expect(
    FlightSettingsSchema.parse({
      ...legacy,
      mode: "survival",
      testFlight: true,
    }).mode,
  ).toBe("survival");
  expect(
    FlightSettingsSchema.safeParse({ ...legacy, mode: "invalid" }).success,
  ).toBe(false);
});
