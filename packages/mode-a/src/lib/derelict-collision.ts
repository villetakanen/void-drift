import {
  DERELICT_ORIGIN,
  DERELICT_SCALE,
  DERELICT_SHARDS,
  DERELICT_SOURCE_PLANES,
} from "./derelict-geometry";

type Point = { x: number; y: number };
export type DerelictBodyShape = {
  kind: "wreck" | "fragment";
  x: number;
  y: number;
  rotation: number;
  shardIndex?: number;
  releasedMask?: number;
};
export type DerelictCastHit = {
  time: number;
  x: number;
  y: number;
  surfaceX: number;
  surfaceY: number;
};
const EPS = 1e-8;
const cross = (a: Point, b: Point, c: Point) =>
  (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
const area = (p: readonly Point[]) =>
  p.reduce(
    (s, a, i) =>
      s + a.x * p[(i + 1) % p.length].y - a.y * p[(i + 1) % p.length].x,
    0,
  ) / 2;

/** Parse the linear SVG fill paths; an open path is implicitly closed by SVG fill. */
function parsePath(d: string): Point[] {
  const tokens =
    d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi) ?? [];
  const points: Point[] = [];
  let i = 0,
    command = "",
    x = 0,
    y = 0;
  while (i < tokens.length) {
    if (/^[a-z]$/i.test(tokens[i])) command = tokens[i++];
    if (command.toLowerCase() === "z") break;
    const relative = command === command.toLowerCase(),
      op = command.toLowerCase();
    if (!["m", "l", "h", "v"].includes(op))
      throw new Error(`Unsupported derelict path command ${command}`);
    const a = Number(tokens[i++]);
    const b = op === "m" || op === "l" ? Number(tokens[i++]) : 0;
    if (!Number.isFinite(a) || !Number.isFinite(b))
      throw new Error("Invalid derelict path");
    if (op === "h") x = relative ? x + a : a;
    else if (op === "v") y = relative ? y + a : a;
    else {
      x = relative ? x + a : a;
      y = relative ? y + b : b;
    }
    points.push({ x, y });
    if (op === "m") command = relative ? "l" : "L";
  }
  return points.filter(
    (p, j) =>
      j === 0 || Math.hypot(p.x - points[j - 1].x, p.y - points[j - 1].y) > EPS,
  );
}
function triangulate(input: Point[]): Point[][] {
  if (input.length < 3 || Math.abs(area(input)) < EPS) return [];
  const p = area(input) > 0 ? [...input] : [...input].reverse();
  const out: Point[][] = [];
  while (p.length > 3) {
    let found = false;
    for (let i = 0; i < p.length; i++) {
      const a = p[(i + p.length - 1) % p.length],
        b = p[i],
        c = p[(i + 1) % p.length];
      if (cross(a, b, c) <= EPS) continue;
      if (
        p.some(
          (q, j) =>
            j !== i &&
            j !== (i + p.length - 1) % p.length &&
            j !== (i + 1) % p.length &&
            cross(a, b, q) >= -EPS &&
            cross(b, c, q) >= -EPS &&
            cross(c, a, q) >= -EPS,
        )
      )
        continue;
      out.push([a, b, c]);
      p.splice(i, 1);
      found = true;
      break;
    }
    if (!found) {
      const collinear = p.findIndex(
        (b, i) =>
          Math.abs(
            cross(p[(i + p.length - 1) % p.length], b, p[(i + 1) % p.length]),
          ) < EPS,
      );
      if (collinear < 0) throw new Error("Cannot triangulate derelict path");
      p.splice(collinear, 1);
    }
  }
  if (p.length === 3 && Math.abs(area(p)) > EPS) out.push(p);
  return out;
}
function clip(subject: Point[], boundary: readonly Point[]): Point[] {
  let out = subject;
  const sign = area(boundary) >= 0 ? 1 : -1;
  for (let i = 0; i < boundary.length && out.length; i++) {
    const a = boundary[i],
      b = boundary[(i + 1) % boundary.length],
      prev = out;
    out = [];
    for (let j = 0; j < prev.length; j++) {
      const p = prev[j],
        q = prev[(j + 1) % prev.length],
        dp = sign * cross(a, b, p),
        dq = sign * cross(a, b, q);
      if (dp >= -EPS) out.push(p);
      if ((dp > 0 && dq < 0) || (dp < 0 && dq > 0)) {
        const t = dp / (dp - dq);
        out.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
      }
    }
  }
  return out;
}
/** Convex source-space material pieces per shard. Overlapping fills remain overlapping. */
const triangles = DERELICT_SOURCE_PLANES.flatMap((plane) =>
  triangulate(parsePath(plane.d)),
);
export const DERELICT_COLLISION_PIECES: readonly (readonly (readonly Point[])[])[] =
  DERELICT_SHARDS.map((shard) =>
    triangles
      .map((t) => clip(t, shard.points))
      .filter((p) => p.length >= 3 && Math.abs(area(p)) > EPS),
  );
type Material = { polygons: Point[][]; radius: number };
function makeMaterial(indices: number[], fragment: boolean): Material {
  const polygons = indices.flatMap((i) =>
    DERELICT_COLLISION_PIECES[i].map((poly) =>
      poly.map((p) => ({
        x:
          (p.x - (fragment ? DERELICT_SHARDS[i].x : DERELICT_ORIGIN.x)) *
          DERELICT_SCALE,
        y:
          (p.y - (fragment ? DERELICT_SHARDS[i].y : DERELICT_ORIGIN.y)) *
          DERELICT_SCALE,
      })),
    ),
  );
  let radius = 0;
  for (const poly of polygons)
    for (const p of poly) radius = Math.max(radius, Math.hypot(p.x, p.y));
  return { polygons, radius };
}
const fragments = DERELICT_SHARDS.map((_, i) => makeMaterial([i], true));
// Cache each material region once; attached-mask variants share those vertices.
const attached = DERELICT_SHARDS.map((_, i) => makeMaterial([i], false));
const wrecks = new Map<number, Material>();
function materialFor(shape: DerelictBodyShape): Material {
  if (shape.kind === "fragment")
    return fragments[shape.shardIndex ?? 0] ?? { polygons: [], radius: 0 };
  const mask = (shape.releasedMask ?? 0) & 255;
  let material = wrecks.get(mask);
  if (!material) {
    const regions = attached.filter((_, index) => !(mask & (1 << index)));
    material = {
      polygons: regions.flatMap((region) => region.polygons),
      radius: Math.max(0, ...regions.map((region) => region.radius)),
    };
    wrecks.set(mask, material);
  }
  return material;
}
export function getDerelictRadius(shape: DerelictBodyShape): number {
  return materialFor(shape).radius;
}
export function getDerelictWorldPolygons(shape: DerelictBodyShape): Point[][] {
  const c = Math.cos(shape.rotation),
    s = Math.sin(shape.rotation);
  return materialFor(shape).polygons.map((poly) =>
    poly.map((p) => ({
      x: shape.x + p.x * c - p.y * s,
      y: shape.y + p.x * s + p.y * c,
    })),
  );
}
function distanceToPolygon(
  p: Point,
  poly: readonly Point[],
): { distance: number; point: Point } {
  let inside = true,
    best = Infinity,
    point = poly[0];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i],
      b = poly[(i + 1) % poly.length];
    if (cross(a, b, p) < -EPS) inside = false;
    const dx = b.x - a.x,
      dy = b.y - a.y,
      len = dx * dx + dy * dy,
      t = len
        ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len))
        : 0;
    const q = { x: a.x + t * dx, y: a.y + t * dy },
      d = Math.hypot(p.x - q.x, p.y - q.y);
    if (d < best) {
      best = d;
      point = q;
    }
  }
  return { distance: inside ? 0 : best, point };
}
function circleInterval(
  p: Point,
  v: Point,
  r: number,
): [number, number] | null {
  const a = v.x * v.x + v.y * v.y,
    b = p.x * v.x + p.y * v.y,
    c = p.x * p.x + p.y * p.y - r * r;
  if (a === 0) return c <= 0 ? [0, Infinity] : null;
  const d = b * b - a * c;
  if (d < 0) return null;
  const root = Math.sqrt(Math.max(0, d));
  return [(-b - root) / a, (-b + root) / a];
}
/** Exact linear cast against convex polygons expanded by a circular probe. */
function staticCast(
  polygons: readonly Point[][],
  p: Point,
  v: Point,
  radius: number,
  limit: number,
): { time: number; surface: Point } | null {
  let best = Infinity,
    surface: Point | undefined;
  for (const poly of polygons) {
    const initial = distanceToPolygon(p, poly);
    if (initial.distance <= radius + EPS)
      return { time: 0, surface: initial.point };
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i],
        b = poly[(i + 1) % poly.length],
        dx = b.x - a.x,
        dy = b.y - a.y,
        len = Math.hypot(dx, dy);
      if (len < EPS) continue;
      // The exterior lies to the right of each CCW edge.
      const nx = dy / len,
        ny = -dx / len,
        denom = v.x * nx + v.y * ny;
      if (denom < -EPS) {
        const t = (radius - ((p.x - a.x) * nx + (p.y - a.y) * ny)) / denom;
        if (t >= 0 && t <= limit && t < best) {
          const x = p.x + v.x * t - radius * nx,
            y = p.y + v.y * t - radius * ny,
            along = ((x - a.x) * dx + (y - a.y) * dy) / (len * len);
          if (along >= -EPS && along <= 1 + EPS) {
            best = t;
            surface = { x, y };
          }
        }
      }
      if (radius > 0) {
        const interval = circleInterval(
          { x: p.x - a.x, y: p.y - a.y },
          v,
          radius,
        );
        const t = interval?.[0];
        if (t !== undefined && t >= 0 && t <= limit && t < best) {
          best = t;
          surface = a;
        }
      }
    }
  }
  return surface ? { time: best, surface } : null;
}
/** Velocity is relative to body translation; surface coordinates use the stationary body origin. */
export function castDerelict(
  shape: DerelictBodyShape,
  point: Point,
  velocity: Point,
  radius: number,
  horizon: number,
  angularVelocity = 0,
): DerelictCastHit | null {
  const material = materialFor(shape);
  if (!material.polygons.length || horizon < 0) return null;
  const relative = { x: point.x - shape.x, y: point.y - shape.y };
  const interval = circleInterval(relative, velocity, material.radius + radius);
  if (!interval || interval[1] < 0 || interval[0] > horizon) return null;
  let t = Math.max(0, interval[0]);
  let end = Math.min(horizon, interval[1]);
  if (!Number.isFinite(end))
    end = angularVelocity ? t + (2 * Math.PI) / Math.abs(angularVelocity) : t;
  const speed =
    Math.hypot(velocity.x, velocity.y) +
    Math.abs(angularVelocity) * material.radius;
  const transform = (x: number, y: number, angle: number) => ({
    x: x * Math.cos(angle) + y * Math.sin(angle),
    y: -x * Math.sin(angle) + y * Math.cos(angle),
  });
  const hit = (
    time: number,
    surface: Point,
    angle: number,
  ): DerelictCastHit => ({
    time,
    x: point.x + velocity.x * time,
    y: point.y + velocity.y * time,
    surfaceX:
      shape.x + surface.x * Math.cos(angle) - surface.y * Math.sin(angle),
    surfaceY:
      shape.y + surface.x * Math.sin(angle) + surface.y * Math.cos(angle),
  });
  if (angularVelocity === 0) {
    const p = transform(relative.x, relative.y, shape.rotation),
      v = transform(velocity.x, velocity.y, shape.rotation),
      result = staticCast(material.polygons, p, v, radius, end);
    return result ? hit(result.time, result.surface, shape.rotation) : null;
  }
  while (t <= end) {
    const angle = shape.rotation + angularVelocity * t,
      local = transform(
        relative.x + velocity.x * t,
        relative.y + velocity.y * t,
        angle,
      );
    let best = Infinity,
      closest: Point | undefined;
    for (const poly of material.polygons) {
      const d = distanceToPolygon(local, poly);
      if (d.distance < best) {
        best = d.distance;
        closest = d.point;
      }
    }
    const gap = best - radius;
    if (gap <= 1e-6 && closest) return hit(t, closest, angle);
    if (speed === 0) return null;
    const step = gap / speed;
    if (step < 1e-5) {
      // Linearize the probe in the rotating frame. Its acceleration is bounded
      // throughout the broad-phase interval, so inflation covers the residual.
      const curvature =
        2 * Math.abs(angularVelocity) * Math.hypot(velocity.x, velocity.y) +
        angularVelocity ** 2 * (material.radius + radius);
      const window = Math.min(end - t, Math.sqrt(2e-4 / curvature));
      if (window <= 0) return null;
      const v = transform(velocity.x, velocity.y, angle);
      const localVelocity = {
        x: v.x + angularVelocity * local.y,
        y: v.y - angularVelocity * local.x,
      };
      const inflation = (curvature * window ** 2) / 2;
      const result = staticCast(
        material.polygons,
        local,
        localVelocity,
        radius + inflation,
        window,
      );
      if (result)
        return hit(
          t + result.time,
          result.surface,
          angle + angularVelocity * result.time,
        );
      t += window;
    } else t += step;
  }
  return null;
}

/** Actual material clipped to a heading-aligned forward acquisition rectangle. */
export function derelictForwardContacts(
  shape: DerelictBodyShape,
  x: number,
  y: number,
  angle: number,
  width: number,
  range: number,
): Point[] {
  const c = Math.cos(angle),
    s = Math.sin(angle);
  const boundary = [
    { x: 0, y: -width / 2 },
    { x: range, y: -width / 2 },
    { x: range, y: width / 2 },
    { x: 0, y: width / 2 },
  ];
  return getDerelictWorldPolygons(shape).flatMap((poly) => {
    const material = clip(
      poly.map((p) => ({
        x: (p.x - x) * c + (p.y - y) * s,
        y: -(p.x - x) * s + (p.y - y) * c,
      })),
      boundary,
    );
    if (!material.length) return [];
    const centre = material.reduce(
      (v, p) => ({
        x: v.x + p.x / material.length,
        y: v.y + p.y / material.length,
      }),
      { x: 0, y: 0 },
    );
    return [...material, centre].map((p) => ({
      x: x + p.x * c - p.y * s,
      y: y + p.x * s + p.y * c,
    }));
  });
}
