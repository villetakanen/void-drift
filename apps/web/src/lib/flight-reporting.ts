import {
  CHALLENGE,
  FlightModeSchema,
  ShipProfileIdSchema,
} from "@void-drift/mode-a";
import { z } from "zod";

export const FlightErrorContextSchema = z.object({
  mode: FlightModeSchema,
  ship: ShipProfileIdSchema,
  challenge: z.literal(CHALLENGE),
});
type FlightErrorContext = z.infer<typeof FlightErrorContextSchema>;

export const FlightEventSchema = z.enum([
  "launched",
  "paused",
  "resumed",
  "completed",
  "score-attempted",
  "retried",
  "left",
]);
type FlightEvent = z.infer<typeof FlightEventSchema>;

type FlightReporter = (event: FlightEvent, context: FlightErrorContext) => void;
let reporter: FlightReporter | undefined;

export function installFlightReporter(report: FlightReporter) {
  reporter = report;
}

export function reportFlightEvent(
  event: FlightEvent,
  mode: FlightErrorContext["mode"],
  ship: FlightErrorContext["ship"],
) {
  try {
    reporter?.(event, { mode, ship, challenge: CHALLENGE });
  } catch {
    // Reporting cannot interrupt the flight lifecycle.
  }
}
