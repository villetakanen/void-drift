import { drawFlightFrame, type FlightFrame } from "@void-drift/mode-a";
import { describe, expect, it, vi } from "vitest";
import {
  drawGameField,
  HISTORICAL_BACKGROUND,
  PENDING_BACKGROUND,
  PRACTICE_BACKGROUND,
  showsFieldSky,
  systemBackground,
} from "./game-field";

vi.mock("@void-drift/mode-a", () => ({
  drawFlightFrame: vi.fn(),
  FLIGHT_PASSES: [
    { id: "void" },
    { id: "starfield", space: "world", draw: () => {} },
  ],
}));

describe("field background policy", () => {
  it("couples browser sky and transparent world for every production source", () => {
    for (const background of [
      PRACTICE_BACKGROUND,
      PENDING_BACKGROUND,
      systemBackground(2026),
    ]) {
      expect(showsFieldSky(background)).toBe(true);
      drawGameField({} as FlightFrame, background);
      expect(vi.mocked(drawFlightFrame).mock.lastCall?.[1]?.preparedSky).toBe(
        true,
      );
    }
  });
  it("keeps the historical Canvas passes without a browser sky", () => {
    expect(showsFieldSky(HISTORICAL_BACKGROUND)).toBe(false);
    drawGameField({} as FlightFrame, HISTORICAL_BACKGROUND);
    expect(vi.mocked(drawFlightFrame).mock.lastCall?.[1]?.preparedSky).toBe(
      false,
    );
    expect(
      vi.mocked(drawFlightFrame).mock.lastCall?.[1]?.passes,
    ).toBeUndefined();
  });
  it("replaces the Canvas starfield for an experiment without mounting the browser sky", () => {
    const draw = vi.fn();
    const background = { kind: "experimental" as const, draw };
    expect(showsFieldSky(background)).toBe(false);
    drawGameField({} as FlightFrame, background);
    const options = vi.mocked(drawFlightFrame).mock.lastCall?.[1];
    expect(options?.preparedSky).toBe(false);
    expect(
      options?.passes?.find((pass) => pass.id === "starfield"),
    ).toMatchObject({ space: "screen", draw });
  });
});
