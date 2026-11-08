import type { PathSeries } from "./path-instrument";
import { simulateRotation } from "./rotation-bench";

// Fixture: the existing free-rotation calculation, "2 aft + 2 side" variant,
// on the shared 14-second input. Studies differ only in the varied setting.
const COLORS = ["#5ce5e7", "#ffbd69", "#c8fa64"];
function run(settings: { acceleration: number; maxSpeed: number }) {
  return simulateRotation({ ...settings, rotationMode: "free" })[3].map(
    (s) => ({
      x: s.x,
      y: s.y,
      vx: s.vx ?? 0,
      vy: s.vy ?? 0,
      spin: s.spin ?? 0,
    }),
  );
}
export const thrustStudy: PathSeries[] = [100, 175, 250].map(
  (acceleration, i) => ({
    label: `Acceleration ${acceleration} u/s²`,
    color: COLORS[i],
    samples: run({ acceleration, maxSpeed: 250 }),
  }),
);
export const speedCeilingStudy: PathSeries[] = [150, 250, 400].map(
  (maxSpeed, i) => ({
    label: `Speed ceiling ${maxSpeed} u/s`,
    color: COLORS[i],
    samples: run({ acceleration: 175, maxSpeed }),
  }),
);
