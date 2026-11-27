import { FissionExhaust, type FissionExhaustPose } from "@void-drift/core";
import { afterEach, expect, it, vi } from "vitest";
import { advanceRenderModelHeading } from "./render-model-fixture";
import {
  createMultiMountFixture,
  FISSION_CADENCE,
} from "./render-performance-fixture";

const step = 1 / 60;
const center = { x: 960, y: 540 };
const grid = Array.from({ length: 25 }, (_, i) => ({
  x: ((i % 5) + 0.5) * 384,
  y: (Math.floor(i / 5) + 0.5) * 216,
}));

afterEach(() => vi.restoreAllMocks());

it.each([
  { profile: "mixed", centers: [center], scale: 7.5, nozzles: 2 },
  { profile: "mixed", centers: grid, scale: 1.5, nozzles: 50 },
  { profile: "coincident", centers: [center], scale: 7.5, nozzles: 4 },
  { profile: "coincident", centers: grid, scale: 1.5, nozzles: 100 },
] as const)(
  "scripts $nozzles coincident $profile nozzles without refiring on a held tick",
  ({ profile, centers, scale, nozzles }) => {
    const fixture = createMultiMountFixture(profile, centers, scale);
    const headingAt = (tick: number) =>
      advanceRenderModelHeading(0, (tick - 1) * step);
    expect(fixture.advance(step, 0, step)).toBe(nozzles);
    expect(fixture.advance(step, 0, 0)).toBe(0);
    expect(
      fixture.advance(
        FISSION_CADENCE * step,
        headingAt(FISSION_CADENCE),
        (FISSION_CADENCE - 1) * step,
      ),
    ).toBe(0);
    const laterTick = FISSION_CADENCE + 4;
    expect(
      fixture.advance(laterTick * step, headingAt(laterTick), 4 * step),
    ).toBe(nozzles);
    expect(fixture.advance(laterTick * step, headingAt(laterTick), 0)).toBe(0);
  },
);

it("records the fitted outlet poses at ignition, not at the later callback heading", () => {
  const captured: FissionExhaustPose[][] = [];
  const capture = FissionExhaust.prototype.capture;
  vi.spyOn(FissionExhaust.prototype, "capture").mockImplementation(function (
    this: FissionExhaust,
    tick,
    poses,
  ) {
    if (poses.length) captured.push([...poses]);
    capture.call(this, tick, poses);
  });
  function run(skippedTicks: number) {
    const fixture = createMultiMountFixture("coincident", [center], 7.5);
    fixture.advance(step, 0, step);
    const advanceTicks = FISSION_CADENCE + skippedTicks;
    const dt = advanceTicks * step;
    fixture.advance(
      (advanceTicks + 1) * step,
      advanceRenderModelHeading(0, dt),
      dt,
    );
  }
  run(0);
  run(5);
  const [, exact, , skipped] = captured;
  expect(exact).toHaveLength(4);
  expect(new Set(exact.map(({ x, y }) => `${x},${y}`)).size).toBe(4);
  for (let i = 0; i < exact.length; i++) {
    expect(skipped[i].x).toBeCloseTo(exact[i].x, 10);
    expect(skipped[i].y).toBeCloseTo(exact[i].y, 10);
    expect(skipped[i].exhaustAngle).toBeCloseTo(exact[i].exhaustAngle, 10);
  }
});
