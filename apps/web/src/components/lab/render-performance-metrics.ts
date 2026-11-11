export type TimingSample = { time: number; interval: number; js: number };
export type StampCounts = {
  attempted: number;
  accepted: number;
  dropped: number;
};
export type BenchMetrics = {
  samples: TimingSample[];
  elapsed: number;
  stamps: StampCounts;
  warmup: number;
};

export const WARMUP_SECONDS = 2;
export const WINDOW_SECONDS = 10;
export const MAX_SAMPLES = 12000;

export function emptyMetrics(): BenchMetrics {
  return {
    samples: [],
    elapsed: 0,
    stamps: { attempted: 0, accepted: 0, dropped: 0 },
    warmup: 0,
  };
}

export function pushSample(
  metrics: BenchMetrics,
  interval: number,
  js: number,
) {
  if (metrics.warmup < WARMUP_SECONDS) {
    metrics.warmup += interval;
    return false;
  }
  metrics.elapsed += interval;
  const time = metrics.elapsed;
  metrics.samples.push({ time, interval, js });
  const oldest = metrics.elapsed - WINDOW_SECONDS;
  while (metrics.samples.length > 1 && metrics.samples[0].time < oldest)
    metrics.samples.shift();
  while (metrics.samples.length > MAX_SAMPLES) metrics.samples.shift();
  return true;
}

export function addStamps(
  metrics: BenchMetrics,
  accepted: number,
  dropped: number,
) {
  metrics.stamps.accepted += accepted;
  metrics.stamps.dropped += dropped;
  metrics.stamps.attempted += accepted + dropped;
}

export function percentile(values: number[], fraction: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(fraction * sorted.length) - 1] ?? sorted.at(-1) ?? 0;
}

export function summarize(metrics: BenchMetrics) {
  const intervals = metrics.samples.map((sample) => sample.interval);
  const submissions = metrics.samples.map((sample) => sample.js);
  const mean = intervals.length
    ? intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
    : 0;
  return {
    fps: mean ? 1 / mean : 0,
    intervalMedian: percentile(intervals, 0.5),
    intervalP95: percentile(intervals, 0.95),
    jsMedian: percentile(submissions, 0.5),
    jsP95: percentile(submissions, 0.95),
  };
}
