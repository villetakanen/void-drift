import { describe, expect, it } from "vitest";
import { GAME_GUTTER_PX } from "../../lib/game-screen";
import {
  hitPad,
  insidePolygon,
  type PadSide,
  padAssembly,
} from "./thrust-pads";

const WIDTH = GAME_GUTTER_PX.side;
const HEIGHT = WIDTH * 2;

describe("thrust pad hit areas", () => {
  it("split each assembly into disjoint panes with no dead spot", () => {
    for (const side of ["left", "right"] as PadSide[]) {
      const assembly = padAssembly(side, WIDTH, HEIGHT);
      const [turn, burn] = assembly.panes;
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
