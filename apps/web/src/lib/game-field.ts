import {
  drawFlightFrame,
  FLIGHT_PASSES,
  type FlightFrame,
  type FlightFrameOptions,
} from "@void-drift/mode-a";

/** One policy controls both the browser surface and the frame's background. */
export type FieldBackground =
  | {
      kind: "production";
      source:
        | { kind: "practice" }
        | { kind: "system"; seed: number }
        | { kind: "pending" };
    }
  | { kind: "historical" }
  | {
      kind: "experimental";
      draw: (frame: FlightFrame, ctx: CanvasRenderingContext2D) => void;
    };
export const PRACTICE_BACKGROUND: FieldBackground = {
  kind: "production",
  source: { kind: "practice" },
};
export const PENDING_BACKGROUND: FieldBackground = {
  kind: "production",
  source: { kind: "pending" },
};
export const HISTORICAL_BACKGROUND: FieldBackground = { kind: "historical" };
export const systemBackground = (seed: number): FieldBackground => ({
  kind: "production",
  source: { kind: "system", seed },
});
export function showsFieldSky(background: FieldBackground) {
  return background.kind === "production";
}

/** Compose the World consistently with the browser surface selected by the host. */
export function drawGameField(
  frame: FlightFrame,
  background: FieldBackground,
  options: FlightFrameOptions = {},
) {
  const passes =
    background.kind === "experimental"
      ? (options.passes ?? FLIGHT_PASSES).map((pass) =>
          pass.id === "starfield"
            ? { ...pass, space: "screen" as const, draw: background.draw }
            : pass,
        )
      : options.passes;
  drawFlightFrame(frame, {
    ...options,
    passes,
    preparedSky: showsFieldSky(background),
  });
}
