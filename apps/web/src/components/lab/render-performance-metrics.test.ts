import { FxBudget } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import {
  addStamps,
  emptyMetrics,
  MAX_SAMPLES,
  pushSample,
  summarize,
  WARMUP_SECONDS,
} from "./render-performance-metrics";

describe("render performance timing summaries", () => {
  it("excludes the initial two seconds and preserves un-clamped slow intervals", () => {
    const metrics = emptyMetrics();
    let warmupFrames = 0;
    while (!pushSample(metrics, 1 / 60, 2)) warmupFrames++;
    expect(warmupFrames).toBeGreaterThanOrEqual(WARMUP_SECONDS * 60);
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
    // A 25-cell flash requests 75 plume + 75 dispersal stamps on the same
    // budget, more than its reserved shared allowance.
    const attempted = 150;
    const budget = new FxBudget();
    for (let index = 0; index < attempted; index++) budget.take(true);
    const accepted = budget.essential + budget.decoration;
    addStamps(metrics, accepted, budget.dropped);
    expect(metrics.stamps).toEqual({
      attempted,
      accepted: Math.min(attempted, FxBudget.ESSENTIAL),
      dropped: Math.max(0, attempted - FxBudget.ESSENTIAL),
    });
  });
});
