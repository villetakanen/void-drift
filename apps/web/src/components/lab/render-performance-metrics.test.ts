import { FxBudget } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import {
  addStamps,
  emptyMetrics,
  MAX_SAMPLES,
  pushSample,
  summarize,
} from "./render-performance-metrics";

describe("render performance timing summaries", () => {
  it("excludes the initial two seconds and preserves un-clamped slow intervals", () => {
    const metrics = emptyMetrics();
    let warmupFrames = 0;
    while (!pushSample(metrics, 1 / 60, 2)) warmupFrames++;
    expect(warmupFrames).toBeGreaterThanOrEqual(120);
    expect(pushSample(metrics, 11, 9)).toBe(true);
    expect(metrics.samples.at(-1)?.interval).toBe(11);
    expect(summarize(metrics).intervalP95).toBeGreaterThan(1);
  });

  it("bounds sample storage while retaining a current slow callback", () => {
    const metrics = emptyMetrics();
    metrics.warmup = 2;
    for (let index = 0; index < MAX_SAMPLES + 50; index++)
      pushSample(metrics, 0.0005, 1);
    expect(metrics.samples).toHaveLength(MAX_SAMPLES);
    pushSample(metrics, 15, 20);
    expect(metrics.samples).toHaveLength(1);
    expect(metrics.samples[0].interval).toBe(15);
  });

  it("reports shared budget accounting with attempted equal to accepted plus dropped", () => {
    const metrics = emptyMetrics();
    // Production's reserved shared allowance is 128; a 25-cell flash requests
    // 75 plume + 75 dispersal stamps on the same budget.
    const budget = new FxBudget();
    for (let index = 0; index < 150; index++) budget.take(true);
    const accepted = budget.essential + budget.decoration;
    addStamps(metrics, accepted, budget.dropped);
    expect(metrics.stamps).toEqual({
      attempted: 150,
      accepted: 128,
      dropped: 22,
    });
  });
});
