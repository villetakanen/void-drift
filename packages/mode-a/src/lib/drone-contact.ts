import {
  distanceToPolygon,
  getDerelictRadius,
  getDerelictWorldPolygons,
} from "./derelict-collision";
import type { SalvageBody } from "./salvage";

type Point = { x: number; y: number };
export function positionAt(body: SalvageBody, t: number) {
  const x = body.sweepEndX ?? body.x,
    y = body.sweepEndY ?? body.y;
  // A world wrap does not sweep the ship through the whole arena.
  if (
    Math.hypot(x - body.previousX, y - body.previousY) > 1200 &&
    body.kind === "ship"
  )
    return { x, y };
  return {
    x: body.previousX + (x - body.previousX) * t,
    y: body.previousY + (y - body.previousY) * t,
  };
}

/** Distance between the front and the nearest piece of physical material.
 * Each convex piece spans a continuous interval of radii from the blast. */
function frontGap(
  body: SalvageBody,
  origin: Point,
  t: number,
  radius: number,
  filled: boolean,
) {
  const centre = positionAt(body, t);
  const dx = centre.x - origin.x,
    dy = centre.y - origin.y,
    range = Math.hypot(dx, dy);
  if (body.kind === "ship") {
    const near = Math.max(0, range - body.radius),
      far = range + body.radius;
    const witness = filled ? near : Math.max(near, Math.min(radius, far));
    return {
      gap: Math.max(0, near - radius, filled ? 0 : radius - far),
      x: origin.x + (dx / (range || 1)) * witness,
      y: origin.y + (dy / (range || 1)) * witness,
    };
  }
  if (body.kind === "cell") return { gap: Infinity, ...centre };
  const rotation = body.previousRotation ?? body.rotation;
  const shape = {
    ...body,
    ...centre,
    kind: body.kind,
    rotation: rotation + (body.rotation - rotation) * t,
  };
  const bound = getDerelictRadius(shape);
  const broad = Math.max(
    range - bound - radius,
    filled ? 0 : radius - range - bound,
  );
  if (broad > 1e-5) return { gap: broad, ...centre };
  let best = { gap: Infinity, ...centre };
  for (const polygon of getDerelictWorldPolygons(shape)) {
    const closest = distanceToPolygon(origin, polygon);
    let farthest = polygon[0],
      far = 0;
    for (const v of polygon) {
      const distance = Math.hypot(v.x - origin.x, v.y - origin.y);
      if (distance > far) {
        far = distance;
        farthest = v;
      }
    }
    const gap = Math.max(
      0,
      closest.distance - radius,
      filled ? 0 : radius - far,
    );
    if (gap >= best.gap) continue;
    // Find the point on the segment from nearest material to its farthest vertex.
    const near = closest.distance === 0 ? origin : closest.point;
    let lo = 0,
      hi = 1;
    if (!filled)
      for (let i = 0; i < 18; i++) {
        const f = (lo + hi) / 2;
        if (
          Math.hypot(
            near.x + (farthest.x - near.x) * f - origin.x,
            near.y + (farthest.y - near.y) * f - origin.y,
          ) < radius
        )
          lo = f;
        else hi = f;
      }
    best = {
      gap,
      x: near.x + (farthest.x - near.x) * lo,
      y: near.y + (farthest.y - near.y) * lo,
    };
    if (!gap) break;
  }
  return best;
}

/** Conservative advancement with a bound for translation, angular sweep and
 * expansion. Fast bodies can cross both sides between the two tick endpoints. */
export function sweptFront(
  body: SalvageBody,
  origin: Point,
  from: number,
  to: number,
  startRadius: number,
  endRadius: number,
  filled = false,
) {
  const a = positionAt(body, from),
    b = positionAt(body, to);
  const bound =
    body.kind === "wreck" || body.kind === "fragment"
      ? getDerelictRadius({ ...body, kind: body.kind })
      : body.radius;
  const travel =
    Math.hypot(b.x - a.x, b.y - a.y) +
    Math.abs(body.rotation - (body.previousRotation ?? body.rotation)) *
      bound *
      (to - from) +
    Math.abs(endRadius - startRadius);
  for (let u = 0; u <= 1; ) {
    const t = from + (to - from) * u;
    const hit = frontGap(
      body,
      origin,
      t,
      startRadius + (endRadius - startRadius) * u,
      filled,
    );
    if (hit.gap <= 1e-6) return { x: hit.x, y: hit.y, t };
    if (!travel || u === 1 || hit.gap > travel * (1 - u) + 1e-6) return;
    u = Math.min(1, u + hit.gap / travel);
  }
}
