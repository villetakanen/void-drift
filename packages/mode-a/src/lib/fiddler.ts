import { FIDDLER_DRAFT_FACES, fiddlerDraftPoint } from "./fiddler-form";
import { WASP } from "./wasp";

type Point = readonly [number, number];
export interface FiddlerWindow {
  x: number;
  y: number;
  scale: number;
}
export const FIDDLER_WINDOW = { x: 0, y: 0.5, scale: 1 } as const;
const [left, right] = WASP.facets.slice(-2);
const xs = [...left.points, ...right.points].map((p) => p[0]);
const mid = (Math.max(...xs) + Math.min(...xs)) / 2;
export const FIDDLER_WINDOW_OUTLINE: readonly Point[] = [
  ...right.points,
  left.points[2],
  left.points[1],
].map(([x, y]) => [y, mid - x]);
export function fiddlerWindowOutline(window: FiddlerWindow): readonly Point[] {
  return FIDDLER_WINDOW_OUTLINE.map(([x, y]) => [
    x * window.scale + window.x,
    y * window.scale + window.y,
  ]);
}
/** Upright study faces, also consumed by the integrated hull. */
export function fiddlerUprightFaces(window: FiddlerWindow = FIDDLER_WINDOW) {
  const glass = fiddlerWindowOutline(window);
  const oldGlass = FIDDLER_DRAFT_FACES[FIDDLER_DRAFT_FACES.length - 1].points;
  const replacements = new Map<string, Point>(
    oldGlass.map((p, i) => [p.join(","), glass[i]]),
  );
  for (const [key, endpoint] of [
    ["187,357", 5],
    ["203,357", 1],
  ] as const) {
    const t = 17 / 50;
    replacements.set(key, [
      glass[0][0] + (glass[endpoint][0] - glass[0][0]) * t,
      glass[0][1] + (glass[endpoint][1] - glass[0][1]) * t,
    ]);
  }
  return FIDDLER_DRAFT_FACES.map((face) => ({
    ...face,
    points: face.points.map(
      (p) => replacements.get(p.join(",")) ?? fiddlerDraftPoint(p, 1.35),
    ),
  }));
}
const facets = fiddlerUprightFaces().map((face) => ({
  ...face,
  points: face.points.map(([x, y]): Point => [-y, x]),
}));
const points = facets.flatMap((face) => face.points);
const nose = Math.max(...points.map((p) => p[0]));
const stern = Math.min(...points.map((p) => p[0]));
const width = 2 * Math.max(...points.map((p) => Math.abs(p[1])));
function stabilizer(x: number, y: number, angle: number) {
  const rad = (angle * Math.PI) / 180;
  return { x, y, angle, fx: -Math.sin(rad), fy: Math.cos(rad) };
}
const front = stabilizer(43, 24, 8.5);
const rear = stabilizer(-33, 14.5, -16.5);
/** Ship 05, accepted for flight trials 2026-11-03. Coordinates are +x forward. */
export const FIDDLER = {
  facets,
  mass: 187,
  length: nose,
  fullLength: nose - stern,
  width,
  arm: 23.5,
  sideX: -1,
  angle: 0,
  turnResponse: 1,
  rootEngines: [
    [-1, -23.5],
    [-1, 23.5],
  ] as const,
  rearEngines: [
    [-39, -8],
    [-39, 8],
  ] as const,
  hullMounts: [
    [52, -15.5],
    [52, 15.5],
    [29, -15.5],
    [29, 15.5],
    [-20, 0],
  ] as const,
  stabilizers: {
    front,
    rear,
    coupledLever:
      front.x * front.fy -
      front.y * front.fx -
      rear.x * rear.fy +
      rear.y * rear.fx,
    inertiaPerMass:
      ((nose - stern) ** 2 + width ** 2) / 12 + ((nose + stern) / 2) ** 2,
  },
} as const;
