import { ENGINE_ART, type EngineFace } from "@void-drift/mode-a";

// Study maintenance-drive-2026-11-17, accepted 17 November 2026: the Service
// ion's accepted geometry, plume and marking, kept as the reference for
// implementation. Study drawing only; the game's parts and artwork are
// unchanged, and nothing in the game imports this file.

/** 02.1's accepted plume: the light ion beam at 0.7 × 0.7, in its mint. */
export const ACCEPTED_PLUME = {
  length: 0.7,
  width: 0.7,
  ink: "112,255,226",
} as const;

/** 02.2's form A: the light ion's faces at 0.7 × 0.7, following the plume. */
export const FORM_A = { length: 0.7, width: 0.7 } as const;

type Point = readonly [number, number];
type Face = { points: readonly Point[]; color: string };
// The ion engines' own colours (engine-art.ts): the lit side faces −y, the
// shaded side +y.
const LIT = "rgb(82,87,95)",
  HALF = "rgb(61,65,71)",
  SHADE = "rgb(27,29,31)";

/** A part drawn on both sides of the engine: lit on −y, shaded on +y. */
function sides(lit: readonly Face[]): Face[] {
  return [
    ...lit,
    ...lit.map((face) => ({
      color: face.color === LIT || face.color === HALF ? SHADE : face.color,
      points: face.points.map(([x, y]) => [x, -y] as const),
    })),
  ];
}
const quad = (points: readonly Point[], color: string): Face => ({
  points,
  color,
});

export interface Addition {
  key: string;
  label: string;
  reading: string;
  /** Faces under the engine, in engine units; +x forward. */
  under: readonly Face[];
  /** Faces over the engine. */
  over: readonly Face[];
}

/** Side rails' size and position, in engine units (+x forward). */
export interface Rails {
  /** Rail length. */
  length: number;
  /** Rail centre along the engine's axis; 0 is the engine mount. */
  centre: number;
  /** Rail inner edge's distance from the axis. */
  offset: number;
  thickness: number;
}

/** 02.4's accepted rails, set on 17 November 2026. */
export const RAILS_024: Rails = {
  length: 8.4,
  centre: 0.8,
  offset: 2.5,
  thickness: 0.85,
};

/** 02.4: the whole drive sits 1 u aft of the engine slot's middle on the Wasp. */
export const DRIVE_AFT_OFFSET = -1;

/** Form A's half width, where the struts meet the body. */
const BODY_EDGE = 1.4;

/** The rails as one part: two faceted rails on two angled struts each. */
export function railsAddition(rails: Rails): Addition {
  const back = rails.centre - rails.length / 2;
  const front = rails.centre + rails.length / 2;
  const inner = rails.offset;
  const outer = rails.offset + rails.thickness;
  const middle = (inner + outer) / 2;
  const strut = (at: number): Face =>
    quad(
      [
        [at - 0.4, -BODY_EDGE],
        [at + 0.4, -inner],
        [at + 1.2, -inner],
        [at + 0.4, -BODY_EDGE],
      ],
      HALF,
    );
  const span = front - back;
  return {
    key: "rails",
    label: "Side rails",
    reading: "",
    under: sides([
      strut(back + span * 0.2),
      strut(back + span * 0.65),
      quad(
        [
          [back, -inner],
          [front - 0.8, -inner],
          [front, -middle],
          [back, -middle],
        ],
        HALF,
      ),
      quad(
        [
          [back, -middle],
          [front, -middle],
          [front - 0.8, -outer],
          [back, -outer],
        ],
        LIT,
      ),
    ]),
    over: [],
  };
}

/** The light ion's faces in a pose, stretched to form A. */
export function formFaces(pose: 0 | 3): EngineFace[] {
  return ENGINE_ART.ion[pose].map((face) => ({
    color: face.color,
    points: face.points.map(
      ([x, y]) => [x * FORM_A.length, y * FORM_A.width] as const,
    ),
  }));
}

export function fillFaces(
  ctx: CanvasRenderingContext2D,
  faces: readonly Face[],
) {
  for (const face of faces) {
    ctx.fillStyle = face.color;
    ctx.beginPath();
    face.points.forEach(([x, y], i) => {
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
  }
}

/** The drive as one drawing: under, form A, over. */
export function drawDrive(
  ctx: CanvasRenderingContext2D,
  addition: Addition,
  pose: 0 | 3,
) {
  fillFaces(ctx, addition.under);
  fillFaces(ctx, formFaces(pose));
  fillFaces(ctx, addition.over);
}

/** The nozzle, the minimum x of a form; the plume starts there. */
export function nozzleOf(faces: readonly Face[]) {
  return Math.min(...faces.flatMap((face) => face.points.map((p) => p[0])));
}

/**
 * The accepted plume, drawn once at full output with the light ion beam's
 * construction (packages/core ion-beam.ts) at the accepted proportions.
 */
export function paintAcceptedPlume(ctx: CanvasRenderingContext2D) {
  const length = 48 * ACCEPTED_PLUME.length;
  const width = ACCEPTED_PLUME.width;
  const ink = ACCEPTED_PLUME.ink;
  for (const [band, alpha, color] of [
    [10, 0.035, ink],
    [6, 0.1, ink],
    [3, 0.3, ink],
    [1.6, 1, ink],
    [0.6, 1, "234,255,249"],
  ] as const) {
    const fade = ctx.createLinearGradient(-length, 0, 0, 0);
    fade.addColorStop(0, `rgba(${color},0)`);
    fade.addColorStop(0.3, `rgba(${color},${alpha * 0.2})`);
    fade.addColorStop(0.75, `rgba(${color},${alpha})`);
    fade.addColorStop(1, `rgba(${color},${alpha})`);
    ctx.fillStyle = fade;
    ctx.fillRect(-length, (-band * width) / 2, length, band * width);
  }
}

/** 02.6's accepted marking, set on 17 November 2026. */
export const SERVICE_MARKING = { width: 0.3, gap: 2, outer: 0.5 } as const;

/**
 * Extra 02.6: the Playground band's diagonal marking on the right half of form
 * A's body (not the rails, not the nozzle), in the brand colour. Lines run at
 * 45° on a nose-up ship, as the band's do. Width in engine units; the gap is a
 * multiple of the width (the band's is 2×).
 */
export function paintServiceMarking(
  ctx: CanvasRenderingContext2D,
  pose: 0 | 3,
  width: number,
  gap: number,
  color: string,
  /** Where the marking starts across the right side: 0 at the axis, 1 at the edge. */
  outer = 0,
) {
  if (!(width > 0)) return;
  const faces = formFaces(pose);
  // The body ends where the nozzle's recess begins.
  const recess = faces.filter((face) => face.color === "#12171e");
  const bodyEnd = Math.max(
    ...recess.flatMap((face) => face.points.map((p) => p[0])),
  );
  ctx.save();
  ctx.beginPath();
  for (const face of faces)
    face.points.forEach(([x, y], i) => {
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
  ctx.clip();
  // The right side on a nose-up ship is the engine's +y side; the marking
  // covers its outer half, from half the body's width to its edge.
  const edge = Math.max(
    ...faces.flatMap((face) => face.points.map((p) => p[1])),
  );
  ctx.beginPath();
  ctx.rect(bodyEnd, edge * outer, 40, 10);
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  const repeat = width * (1 + gap);
  ctx.beginPath();
  for (let d = -20; d <= 20; d += repeat) {
    // Lines along (1, 1), offset along the normal (1, −1)/√2.
    const ox = d / Math.SQRT2,
      oy = -d / Math.SQRT2;
    ctx.moveTo(ox - 20, oy - 20);
    ctx.lineTo(ox + 20, oy + 20);
  }
  ctx.stroke();
  ctx.restore();
}
