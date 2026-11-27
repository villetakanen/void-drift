export type TimingSample = {
  time: number;
  interval: number;
  js: number;
  ignitions: number;
  afterIgnition: boolean;
};
export type StampCounts = {
  attempted: number;
  accepted: number;
  dropped: number;
};
export type BenchMetrics = {
  samples: TimingSample[];
  elapsed: number;
  stamps: StampCounts;
  liveStamps: StampCounts;
  ignitions: number;
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
    liveStamps: { attempted: 0, accepted: 0, dropped: 0 },
    ignitions: 0,
    warmup: 0,
  };
}

export function pushSample(
  metrics: BenchMetrics,
  interval: number,
  js: number,
  ignitions: number,
  afterIgnition: boolean,
) {
  if (metrics.warmup < WARMUP_SECONDS) {
    metrics.warmup += interval;
    return false;
  }
  metrics.elapsed += interval;
  const time = metrics.elapsed;
  metrics.samples.push({ time, interval, js, ignitions, afterIgnition });
  metrics.ignitions += ignitions;
  const oldest = metrics.elapsed - WINDOW_SECONDS;
  while (metrics.samples.length > 1 && metrics.samples[0].time < oldest)
    metrics.samples.shift();
  while (metrics.samples.length > MAX_SAMPLES) metrics.samples.shift();
  return true;
}

export function addStamps(
  counts: StampCounts,
  accepted: number,
  dropped: number,
) {
  counts.accepted += accepted;
  counts.dropped += dropped;
  counts.attempted += accepted + dropped;
}

export function percentile(values: number[], fraction: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(fraction * sorted.length) - 1] ?? sorted.at(-1) ?? 0;
}

export function summarize(metrics: BenchMetrics) {
  const intervals = metrics.samples.map((sample) => sample.interval);
  const submissions = metrics.samples.map((sample) => sample.js);
  const ignitionSubmissions = metrics.samples.flatMap((sample) =>
    sample.ignitions ? [sample.js] : [],
  );
  const followingIntervals = metrics.samples.flatMap((sample) =>
    sample.afterIgnition ? [sample.interval] : [],
  );
  const mean = intervals.length
    ? intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
    : 0;
  return {
    fps: mean ? 1 / mean : 0,
    intervalMedian: percentile(intervals, 0.5),
    intervalP95: percentile(intervals, 0.95),
    jsMedian: percentile(submissions, 0.5),
    jsP95: percentile(submissions, 0.95),
    intervalMax: Math.max(0, ...intervals),
    jsMax: Math.max(0, ...submissions),
    ignitionCallbacks: ignitionSubmissions.length,
    ignitionJsP95: percentile(ignitionSubmissions, 0.95),
    ignitionJsMax: Math.max(0, ...ignitionSubmissions),
    followingCallbacks: followingIntervals.length,
    followingIntervalP95: percentile(followingIntervals, 0.95),
    followingIntervalMax: Math.max(0, ...followingIntervals),
  };
}
