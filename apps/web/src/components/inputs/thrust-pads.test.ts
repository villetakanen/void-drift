import { describe, expect, it } from "vitest";
import { GAME_GUTTER_PX } from "../../lib/game-screen";
import {
  BURN_HEIGHT_RATIO,
  BURN_WIDTH_RATIO,
  hitPad,
  insidePolygon,
  MARK_INSET_PX,
  PAD_IDS,
  type PadSide,
  type Point,
  padAssembly,
  SEAM_SLOPE_DEG,
} from "./thrust-pads";

const WIDTH = GAME_GUTTER_PX.side;
const HEIGHT = WIDTH * 2;
const SIDES: PadSide[] = ["left", "right"];

function area(points: readonly Point[]) {
  let sum = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++)
    sum += points[j][0] * points[i][1] - points[i][0] * points[j][1];
  return Math.abs(sum) / 2;
}

/** Distance in from the bezel for a point on `side`. */
const inward = (side: PadSide, x: number) => (side === "left" ? x : WIDTH - x);
const fromBezel = (side: PadSide, u: number) =>
  side === "left" ? u : WIDTH - u;

describe("thrust pad geometry", () => {
  for (const side of SIDES) {
    const assembly = padAssembly(side, WIDTH, HEIGHT);
    const [turn, burn] = assembly.panes;

    it(`${side}: panes are disjoint and together cover the assembly`, () => {
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
    });

    it(`${side}: a point just above the seam is the turn pad, just below the burn pad`, () => {
      const [seamStart, seamEnd] = [burn.points[0], burn.points[1]];
      const x = (seamStart[0] + seamEnd[0]) / 2;
      const y = (seamStart[1] + seamEnd[1]) / 2;
      expect(hitPad(assembly, x, y - 1)).toBe(PAD_IDS[side].turn);
      expect(hitPad(assembly, x, y + 1)).toBe(PAD_IDS[side].burn);
    });

    it(`${side}: the inner rim beside the burn pad belongs to the turn pad`, () => {
      const rimU = (WIDTH * (1 + BURN_WIDTH_RATIO)) / 2;
      expect(hitPad(assembly, fromBezel(side, rimU), HEIGHT - 1)).toBe(
        PAD_IDS[side].turn,
      );
    });

    it(`${side}: above the sloped top and outside the box is no pad`, () => {
      const inner = fromBezel(side, WIDTH - 1);
      const innerTop = Math.max(...turn.points.map(([, y]) => y).slice(0, 2));
      expect(hitPad(assembly, inner, innerTop / 2)).toBeNull();
      expect(hitPad(assembly, WIDTH + 1, HEIGHT / 2)).toBeNull();
      expect(hitPad(assembly, -1, HEIGHT / 2)).toBeNull();
      expect(hitPad(assembly, WIDTH / 2, HEIGHT + 1)).toBeNull();
    });

    it(`${side}: burn pad proportions and seam angle derive from the named constants`, () => {
      const us = burn.points.map(([x]) => inward(side, x));
      expect(Math.max(...us) - Math.min(...us)).toBeCloseTo(
        WIDTH * BURN_WIDTH_RATIO,
      );
      const bezelYs = burn.points
        .filter(([x]) => inward(side, x) === 0)
        .map(([, y]) => y);
      expect(Math.max(...bezelYs) - Math.min(...bezelYs)).toBeCloseTo(
        HEIGHT * BURN_HEIGHT_RATIO,
      );
      const [a, b] = [burn.points[0], burn.points[1]];
      const angle =
        (Math.atan2(b[1] - a[1], Math.abs(b[0] - a[0])) * 180) / Math.PI;
      expect(angle).toBeCloseTo(SEAM_SLOPE_DEG);
    });

    it(`${side}: both markings sit the same distance from the screen edge`, () => {
      expect(inward(side, turn.mark[0])).toBe(inward(side, burn.mark[0]));
      expect(inward(side, turn.mark[0])).toBe(MARK_INSET_PX);
      expect(hitPad(assembly, ...turn.mark)).toBe(turn.pad);
      expect(hitPad(assembly, ...burn.mark)).toBe(burn.pad);
    });
  }

  it("right is the mirror of left", () => {
    const left = padAssembly("left", WIDTH, HEIGHT);
    const right = padAssembly("right", WIDTH, HEIGHT);
    const mirror = { leftUpper: "rightUpper", leftLower: "rightLower" };
    for (let x = 0.37; x < WIDTH; x += 5.3)
      for (let y = 0.29; y < HEIGHT; y += 5.9) {
        const pad = hitPad(left, x, y);
        expect(hitPad(right, WIDTH - x, y)).toBe(
          pad === null ? null : mirror[pad as keyof typeof mirror],
        );
      }
  });
});
