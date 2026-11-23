import { expect, it } from "vitest";
import { FlightSceneDocumentSchema } from "./config";
import type { FlightExperiment } from "./experiment";
import { FlightRun } from "./flight";
import { STARTER_FLIGHT_SCENE } from "./starter";

it("creates isolated experiment state and repeats its ticks on replay", () => {
  const traces: number[][] = [];
  const experiment: FlightExperiment = {
    label: "Lifecycle check",
    create() {
      const ticks: number[] = [];
      traces.push(ticks);
      return {
        step(_sim, tick) {
          ticks.push(tick);
        },
      };
    },
  };
  const doc = FlightSceneDocumentSchema.parse(STARTER_FLIGHT_SCENE);
  const run = new FlightRun(doc, "course", "none", [], {}, experiment);
  run.seek(20);
  const first = [...traces[0]];
  run.seek(20);
  expect(traces[0]).toEqual(first);
  run.seek(5);
  run.seek(20);
  expect(traces[1]).toEqual(first);
  const other = new FlightRun(doc, "course", "none", [], {}, experiment);
  other.seek(10);
  expect(traces[2]).toHaveLength(10);
  expect(traces[1]).toEqual(first);
});

it("refuses non-finite, non-positive or unregistered damage", () => {
  const run = new FlightRun(
    FlightSceneDocumentSchema.parse(STARTER_FLIGHT_SCENE),
    "course",
    "placed",
  );
  const salvage = run.sim.salvage;
  if (!salvage) throw new Error("Expected salvage simulation");
  const body = salvage.bodies[0];
  const hull = body.hull;
  for (const amount of [NaN, Infinity, 0, -1])
    expect(() => salvage.applyDamage(body, amount)).toThrow();
  expect(() => salvage.applyDamage({ ...body }, 1)).toThrow();
  expect(body.hull).toBe(hull);
});
