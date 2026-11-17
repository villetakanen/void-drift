import type { FxPass } from "@void-drift/core";
import type { BuildMount, FlightPass, Simulation } from "@void-drift/mode-a";

/** Trusted local experiment code. The host supplies lifecycle, not its behaviour. */
export interface FlightExperiment {
  label: string;
  create(sim: Simulation): FlightExperimentRun;
}
export interface FlightExperimentRun {
  /** Shared build renderer callback: mount-local builder units, with real hull
   * occlusion. Return true to replace this occupied mount's artwork only. */
  fittingPainter?(ctx: CanvasRenderingContext2D, mount: BuildMount): boolean;
  /** Once after each production tick, only while the ship is alive. */
  step(sim: Simulation, tick: number): void;
  /**
   * Mount keys of the player's ship drawn empty, so a study can draw its own
   * fitting there with a pass. Flight, mass and plumes are unchanged.
   */
  hiddenMounts?: readonly string[];
  /** Extra native painters in the production frame's existing layers. */
  passes?: readonly (FlightPass & { layer: "world" | "lfx" })[];
  /** Fresh emission; the production persistent surface owns history and budgets. */
  fx?(ctx: CanvasRenderingContext2D, pass: FxPass): void;
}
