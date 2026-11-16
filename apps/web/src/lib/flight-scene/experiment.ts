import type { FxPass } from "@void-drift/core";
import type { FlightPass, Simulation } from "@void-drift/mode-a";

/** Trusted local experiment code. The host supplies lifecycle, not its behaviour. */
export interface FlightExperiment {
  label: string;
  create(sim: Simulation): FlightExperimentRun;
}
export interface FlightExperimentRun {
  /** Once after each production tick, only while the ship is alive. */
  step(sim: Simulation, tick: number): void;
  /** Extra native painters in the production frame's existing layers. */
  passes?: readonly (FlightPass & { layer: "world" | "lfx" })[];
  /** Fresh emission; the production persistent surface owns history and budgets. */
  fx?(ctx: CanvasRenderingContext2D, pass: FxPass): void;
}
