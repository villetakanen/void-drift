import { describe, expect, it } from "vitest";
import { GAME_GUTTER_PX } from "../../lib/game-screen";
import {
  hitPad,
  insidePolygon,
  type PadSide,
  type Point,
  padAssembly,
} from "./thrust-pads";

const WIDTH = GAME_GUTTER_PX.side;
const HEIGHT = WIDTH * 2;

function area(points: readonly Point[]) {
  let sum = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++)
    sum += points[j][0] * points[i][1] - points[i][0] * points[j][1];
  return Math.abs(sum) / 2;
}

describe("thrust pad hit areas", () => {
  it("split each assembly into disjoint panes with no dead spot", () => {
    for (const side of ["left", "right"] as PadSide[]) {
      const assembly = padAssembly(side, WIDTH, HEIGHT);
      const [turn, burn] = assembly.panes;
      expect(area(turn.points) + area(burn.points)).toBeCloseTo(
        area(assembly.outline),
        6,
      );
      // Sample off the edges so no point sits on a shared boundary.
      for (let x = 0.37; x < WIDTH; x += 3.1)
        for (let y = 0.29; y < HEIGHT; y += 3.3) {
          const inTurn = insidePolygon(turn.points, x, y);
          const inBurn = insidePolygon(burn.points, x, y);
          expect(inTurn && inBurn).toBe(false);
          expect(inTurn || inBurn).toBe(insidePolygon(assembly.outline, x, y));
        }
      // The central fly area beside the gutter is no pad.
      const flyArea = side === "left" ? WIDTH + 1 : -1;
      expect(hitPad(assembly, flyArea, HEIGHT / 2)).toBeNull();
    }
  });
});
