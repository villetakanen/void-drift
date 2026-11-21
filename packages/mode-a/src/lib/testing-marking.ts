import { COLOR } from "@void-drift/core";

type Point = readonly [number, number];

/**
 * The design system's testing-only marking on one part, read from the part's
 * SVG master: parallel lines at 45° in the brand colour, the gap twice the
 * line width, clipped to the part's body and to the band from `band.x`
 * forward and `band.y` outward on the part's +y side. Part units, +x forward.
 */
export interface TestingMarking {
  width: number;
  gap: number;
  outer: number;
  band: { x: number; y: number };
  body: readonly (readonly Point[])[];
}

/** The marking's lines, long enough to cross any part; clip them to draw. */
export function testingMarkingLines(marking: TestingMarking) {
  const lines: [number, number, number, number][] = [];
  const step = marking.width * (1 + marking.gap);
  for (let d = -20; d <= 20 + 1e-9; d += step) {
    const ox = d / Math.SQRT2,
      oy = -d / Math.SQRT2;
    lines.push([ox - 20, oy - 20, ox + 20, oy + 20]);
  }
  return lines;
}

function bounds(marking: TestingMarking) {
  const xs = marking.body.flatMap((face) => face.map((p) => p[0]));
  const ys = marking.body.flatMap((face) => face.map((p) => p[1]));
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };
}

const PIXELS_PER_UNIT = 24;
const stamps = new WeakMap<TestingMarking, HTMLCanvasElement>();

/** Stroke the marking once into a cached stamp; frames only draw the image. */
function stamp(marking: TestingMarking) {
  const cached = stamps.get(marking);
  if (cached) return cached;
  const box = bounds(marking);
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(box.w * PIXELS_PER_UNIT);
  canvas.height = Math.ceil(box.h * PIXELS_PER_UNIT);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Testing marking stamps require Canvas 2D");
  ctx.scale(PIXELS_PER_UNIT, PIXELS_PER_UNIT);
  ctx.translate(-box.x, -box.y);
  ctx.beginPath();
  for (const face of marking.body)
    for (const [i, [x, y]] of face.entries())
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
  ctx.clip();
  ctx.beginPath();
  ctx.rect(marking.band.x, marking.band.y, 40, 10);
  ctx.clip();
  ctx.strokeStyle = COLOR.brand;
  ctx.lineWidth = marking.width;
  ctx.beginPath();
  for (const [x1, y1, x2, y2] of testingMarkingLines(marking)) {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();
  stamps.set(marking, canvas);
  return canvas;
}

/** Draw the marking over a part already drawn in its own frame. */
export function drawTestingMarking(
  ctx: CanvasRenderingContext2D,
  marking: TestingMarking,
) {
  const box = bounds(marking);
  ctx.drawImage(stamp(marking), box.x, box.y, box.w, box.h);
}
