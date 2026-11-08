import { FIGHTER, WASP } from "@void-drift/mode-a";
import { type Point3, type SideFace, WASP_SIDE } from "./wasp-side";

export type BladeStage = "Faces" | "Wall" | "Root";
export interface BladeFace extends SideFace {
  kind: "source" | "wall" | "root" | "underside" | "joint";
}
const subtract = (a: Point3, b: Point3): Point3 => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
];
export function normal(points: readonly Point3[]): Point3 {
  const a = subtract(points[1], points[0]);
  const b = subtract(points[2], points[0]);
  const cross: Point3 = [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const size = Math.hypot(...cross) || 1;
  return [cross[0] / size, cross[1] / size, cross[2] / size];
}
function shade(points: readonly Point3[]): string {
  const n = normal(points);
  const intensity =
    (n[0] * -0.65 + n[1] * -0.2 + n[2]) / Math.hypot(0.65, 0.2, 1);
  const [light, top, left, dark, right, mid] = FIGHTER.facets;
  return intensity > 0.9
    ? light
    : intensity > 0.7
      ? top
      : intensity > 0.35
        ? mid
        : intensity > 0.15
          ? left
          : intensity > 0
            ? right
            : dark;
}
function upward(points: readonly Point3[]): readonly Point3[] {
  return normal(points)[2] < 0 ? [...points].reverse() : points;
}
const source = WASP_SIDE.map((face) => ({ ...face, kind: "source" as const }));
const [nose, side] = WASP_SIDE;
const rootInner: Point3 = [4, 43, side.points[3][2]];
const rootOuter: Point3 = [-7.4, 45, 0];
const rootFaces: readonly Point3[][] = [
  [side.points[2], side.points[3], rootInner],
  [side.points[3], rootOuter, rootInner],
  [side.points[3], side.points[4], rootOuter],
];

export function bladeAssembly(
  stage: BladeStage,
  mirrored = false,
  offset = 0,
  { walls = true }: { walls?: boolean } = {},
): BladeFace[] {
  const tops: BladeFace[] = [...source];
  if (stage === "Root")
    for (const triangle of rootFaces) {
      const points = upward(triangle);
      tops.push({ points, color: shade(points), kind: "root" });
    }
  const boundary: readonly Point3[] =
    stage === "Root"
      ? [
          nose.points[0],
          nose.points[1],
          nose.points[2],
          nose.points[3],
          side.points[2],
          rootInner,
          rootOuter,
          side.points[4],
          side.points[0],
        ]
      : [
          nose.points[0],
          nose.points[1],
          nose.points[2],
          nose.points[3],
          side.points[2],
          side.points[3],
          side.points[4],
          side.points[0],
        ];
  const result = [...tops];
  if (stage !== "Faces" && walls) {
    // A common extrusion vector makes each return wall planar, while retaining
    // the entire original cut contour as the upper edge of that wall.
    const lower = ([x, y, z]: Point3): Point3 => [x + 1.8, y, z - 2.2];
    for (const face of tops) {
      const points = face.points.map(lower).reverse();
      result.push({ points, color: shade(points), kind: "underside" });
    }
    for (let i = 0; i < boundary.length; i++) {
      const a = boundary[i],
        b = boundary[(i + 1) % boundary.length];
      const points = [b, a, lower(a), lower(b)];
      result.push({ points, color: shade(points), kind: "wall" });
    }
  }
  return result.map((face) => {
    const points = face.points.map(
      ([x, y, z]): Point3 => [(mirrored ? -x : x) + offset, y, z],
    );
    if (mirrored) points.reverse();
    return {
      ...face,
      points,
      color:
        face.kind === "source"
          ? mirrored
            ? WASP.facets[1].color
            : face.color
          : shade(points),
    };
  });
}

export function hullJoint(): BladeFace[] {
  const outline: Point3[] = [
    [-20, 45, 0],
    [-8, 40, 0],
    [8, 40, 0],
    [20, 45, 0],
    [20, 52, 0],
    [-20, 52, 0],
  ];
  const faces: BladeFace[] = [
    { points: outline, color: shade(outline), kind: "joint" },
  ];
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i],
      b = outline[(i + 1) % outline.length];
    const points: Point3[] = [b, a, [a[0], a[1], -2.2], [b[0], b[1], -2.2]];
    faces.push({ points, color: shade(points), kind: "joint" });
  }
  return faces;
}
