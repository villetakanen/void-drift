import {
  getDerelictRadius,
  getDerelictWorldPolygons,
} from "./derelict-collision";
import type { SalvageBody } from "./salvage";
import { PLASMA_RIFLE, type PlasmaVentEvent } from "./schemas/salvage";

type Point = { x: number; y: number };
type Pose = Point & { rotation: number };
type Ports = PlasmaVentEvent["outlets"];
type Port = Ports[number];
type Segment = { a: Point; b: Point };
type Interval = { lo: number; hi: number };
type Bounds = { minX: number; maxX: number; minY: number; maxY: number };
type Span = {
  start: number;
  end: number;
  from: Ports;
  to: Ports;
  mergeError: number;
};
type Cloud = { spans: Span[]; inside: Set<number | SalvageBody> };

const LIFE = PLASMA_RIFLE.ventLifetime;
const RADIUS = PLASMA_RIFLE.ventDamageRadius;
const EPS = 1e-9;
// Bound the uncertainty of a grazing contact to a hundredth of a world unit.
const CONTACT_TOLERANCE = 0.01;

function birthPort(from: Port, to: Port, f: number): Port {
  return {
    x: from.x + (to.x - from.x) * f,
    y: from.y + (to.y - from.y) * f,
    vx: from.vx + (to.vx - from.vx) * f,
    vy: from.vy + (to.vy - from.vy) * f,
  };
}
// Position error at birth plus velocity error over the whole visible lifetime.
function driftError(a: Port, b: Port) {
  return (
    Math.hypot(a.x - b.x, a.y - b.y) +
    LIFE * Math.hypot(a.vx - b.vx, a.vy - b.vy)
  );
}

function appendSpan(
  spans: Span[],
  start: number,
  end: number,
  from: Ports,
  to: Ports,
) {
  const prior = spans.at(-1);
  if (
    prior &&
    Math.abs(prior.end - start) < EPS &&
    end - prior.start <= 1 / 30 + EPS
  ) {
    const fraction = (start - prior.start) / (end - prior.start);
    let error = 0;
    for (const side of [0, 1]) {
      const mid = birthPort(prior.from[side], to[side], fraction);
      const chordError =
        (Math.hypot(
          to[side].vx - prior.from[side].vx,
          to[side].vy - prior.from[side].vy,
        ) *
          (end - prior.start)) /
        4;
      error = Math.max(
        error,
        prior.mergeError + driftError(mid, prior.to[side]),
        driftError(mid, from[side]),
      );
      // Cap the additional spatial error of the merged ballistic chord.
      if (error + chordError > 0.25) break;
      if (side === 1) {
        prior.end = end;
        prior.to = to;
        prior.mergeError = error;
        return;
      }
    }
  }
  spans.push({ start, end, from, to, mergeError: 0 });
}

function section(span: Span, side: number, time: number): Segment {
  const edge = (birth: number) => {
    const f = (birth - span.start) / (span.end - span.start);
    const port = birthPort(span.from[side], span.to[side], f);
    return {
      x: port.x + port.vx * (time - birth),
      y: port.y + port.vy * (time - birth),
    };
  };
  return {
    a: edge(Math.max(span.start, time - LIFE)),
    b: edge(Math.min(span.end, time)),
  };
}
function pointDistance(p: Point, a: Point, b: Point) {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const length2 = dx * dx + dy * dy;
  const t = length2
    ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length2))
    : 0;
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}
function cross(a: Point, b: Point, p: Point) {
  return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
}
// Derelict material consists of counterclockwise convex polygons.
function materialDistance(line: Segment, polygons: Point[][]) {
  let best = Infinity;
  for (const poly of polygons) {
    let inside = true;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i],
        b = poly[(i + 1) % poly.length];
      const u = cross(a, b, line.a),
        v = cross(a, b, line.b);
      if (u < 0) inside = false;
      if (u * v < 0 && cross(line.a, line.b, a) * cross(line.a, line.b, b) < 0)
        return 0;
      best = Math.min(
        best,
        pointDistance(a, line.a, line.b),
        pointDistance(line.a, a, b),
        pointDistance(line.b, a, b),
      );
    }
    if (inside) return 0;
  }
  return best;
}
function bounds(a: Point, b: Point, pad: number): Bounds {
  return {
    minX: Math.min(a.x, b.x) - pad,
    maxX: Math.max(a.x, b.x) + pad,
    minY: Math.min(a.y, b.y) - pad,
    maxY: Math.max(a.y, b.y) + pad,
  };
}
function overlaps(a: Bounds, b: Bounds) {
  return (
    a.minX <= b.maxX && b.minX <= a.maxX && a.minY <= b.maxY && b.minY <= a.maxY
  );
}
function makeSweep(span: Span, side: number, start: number, dt: number) {
  const lo = Math.max(0, span.start - start),
    hi = Math.min(dt, span.end + LIFE - start);
  if (hi < lo) return;
  const a = span.from[side],
    b = span.to[side],
    duration = span.end - span.start;
  // A fixed birth travels at its ejection velocity. A clipped edge at birth
  // or expiry follows the moving port, plus its velocity gradient at age LIFE.
  const speed = Math.max(
    Math.hypot(a.vx, a.vy),
    Math.hypot(b.vx, b.vy),
    (Math.hypot(b.x - a.x, b.y - a.y) +
      LIFE * Math.hypot(b.vx - a.vx, b.vy - a.vy)) /
      duration,
  );
  const mid = section(span, side, start + (hi + lo) / 2);
  return {
    span,
    side,
    lo,
    hi,
    speed,
    box: bounds(
      mid.a,
      mid.b,
      RADIUS + CONTACT_TOLERANCE + (speed * (hi - lo)) / 2,
    ),
  };
}
function contactIntervals(
  lo: number,
  hi: number,
  speed: number,
  distance: (t: number) => number,
  out: Interval[],
) {
  const mid = (lo + hi) / 2,
    d = distance(mid),
    travel = (speed * (hi - lo)) / 2;
  if (d > travel + EPS) return;
  if (d <= -travel || travel <= CONTACT_TOLERANCE || hi - lo < 1e-9) {
    out.push({ lo, hi });
    return;
  }
  contactIntervals(lo, mid, speed, distance, out);
  contactIntervals(mid, hi, speed, distance, out);
}

/** One short curved track per outlet. Knots describe drifting gas, independent of FX stamps. */
export class PlasmaVentArea {
  private readonly clouds = new Map<string, Cloud>();
  get active() {
    return this.clouds.size > 0;
  }

  emit(
    mountKey: string,
    start: number,
    duration: number,
    from: Ports,
    to: Ports,
  ) {
    if (duration <= EPS) return;
    let cloud = this.clouds.get(mountKey);
    if (!cloud) {
      cloud = { spans: [], inside: new Set() };
      this.clouds.set(mountKey, cloud);
    }
    // Within an emission interval the
    // birth-time velocity gradient bends the drifting centreline away from its
    // chord by at most |delta velocity| * duration / 4, divided by n² for n spans.
    const velocityChange = Math.max(
      Math.hypot(to[0].vx - from[0].vx, to[0].vy - from[0].vy),
      Math.hypot(to[1].vx - from[1].vx, to[1].vy - from[1].vy),
    );
    const parts = Math.max(
      1,
      Math.ceil(
        Math.sqrt((velocityChange * duration) / (4 * CONTACT_TOLERANCE)),
      ),
    );
    let initial = from;
    for (let part = 0; part < parts; part++) {
      const next = (part + 1) / parts;
      const final = next === 1 ? to : this.interpolate(from, to, next);
      appendSpan(
        cloud.spans,
        start + (duration * part) / parts,
        start + duration * next,
        initial,
        final,
      );
      initial = final;
    }
  }
  private interpolate(a: Ports, b: Ports, f: number): Ports {
    return [birthPort(a[0], b[0], f), birthPort(a[1], b[1], f)];
  }
  sweep(
    start: number,
    dt: number,
    bodies: readonly SalvageBody[],
    shooterId: number | undefined,
    onEntry: (
      body: SalvageBody,
      offset: number,
      registerNewborn: (body: SalvageBody) => void,
    ) => void,
    poseAt: (body: SalvageBody, offset: number) => Pose = (body, t) => ({
      x: body.previousX + body.vx * t,
      y: body.previousY + body.vy * t,
      rotation: body.rotation,
    }),
    lifetime?: (body: SalvageBody) => { birth: number; end: number },
  ) {
    if (!this.active || dt <= 0) return;
    const entries: { body: SalvageBody; time: number; cloud: Cloud }[] = [];
    const probes: ((body: SalvageBody, after?: number) => void)[] = [];
    for (const cloud of this.clouds.values()) {
      const sweeps: NonNullable<ReturnType<typeof makeSweep>>[] = [];
      const box: Bounds = {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
      };
      for (const span of cloud.spans)
        for (const side of [0, 1]) {
          const swept = makeSweep(span, side, start, dt);
          if (!swept) continue;
          sweeps.push(swept);
          box.minX = Math.min(box.minX, swept.box.minX);
          box.maxX = Math.max(box.maxX, swept.box.maxX);
          box.minY = Math.min(box.minY, swept.box.minY);
          box.maxY = Math.max(box.maxY, swept.box.maxY);
        }
      const nextInside = new Set<number | SalvageBody>();
      const previousInside = cloud.inside;
      const probe = (body: SalvageBody, after = -Infinity) => {
        const id = body.kind === "ship" ? body.id : body;
        nextInside.delete(id);
        if (body.id === shooterId || body.hull <= 0 || body.kind === "cell")
          return;
        const kind = body.kind;
        const radius =
          kind === "ship" ? body.radius : getDerelictRadius({ ...body, kind });
        const window = lifetime?.(body);
        const lo = Math.max(0, window?.birth ?? 0),
          hi = Math.min(dt, window?.end ?? dt);
        if (hi <= lo) return;
        const a = poseAt(body, lo),
          b = poseAt(body, hi);
        const bodyBox = bounds(a, b, radius);
        if (!overlaps(bodyBox, box)) return;
        const speed =
          (Math.hypot(b.x - a.x, b.y - a.y) +
            radius * Math.abs(b.rotation - a.rotation)) /
          (hi - lo);
        const intervals: Interval[] = [];
        for (const sw of sweeps) {
          if (!overlaps(bodyBox, sw.box)) continue;
          const from = Math.max(lo, sw.lo),
            to = Math.min(hi, sw.hi);
          if (to <= from) continue;
          contactIntervals(
            from,
            to,
            speed + sw.speed,
            (t) => {
              const line = section(sw.span, sw.side, start + t),
                p = poseAt(body, t);
              if (kind === "ship")
                return pointDistance(p, line.a, line.b) - radius - RADIUS;
              return (
                materialDistance(
                  line,
                  getDerelictWorldPolygons({ ...body, ...p, kind }),
                ) - RADIUS
              );
            },
            intervals,
          );
        }
        intervals.sort((a, b) => a.lo - b.lo);
        let exit = previousInside.has(id) && lo === 0 ? 0 : -Infinity;
        for (const interval of intervals) {
          if (interval.lo > exit + EPS && interval.lo >= after - EPS)
            entries.push({ body, time: interval.lo, cloud });
          exit = Math.max(exit, interval.hi);
        }
        if (exit >= dt - EPS) nextInside.add(id);
      };
      for (const body of bodies) probe(body);
      probes.push(probe);
      cloud.inside = nextInside;
    }
    const byTime = (a: (typeof entries)[number], b: (typeof entries)[number]) =>
      b.time - a.time || b.body.id - a.body.id;
    entries.sort(byTime);
    const registerNewborn = (body: SalvageBody) => {
      const previous = entries.length;
      for (const probe of probes) probe(body);
      if (entries.length !== previous) entries.sort(byTime);
    };
    // Removing a shard changes which material later sprays can reach in this step.
    const delivered = new Map<SalvageBody, Map<Cloud, number>>();
    while (entries.length) {
      const entry = entries.pop();
      if (!entry || entry.body.hull <= 0) continue;
      const { body, cloud, time } = entry;
      const mask = body.releasedMask;
      if (body.kind === "wreck") {
        let seen = delivered.get(body);
        if (!seen) {
          seen = new Map();
          delivered.set(body, seen);
        }
        if (Math.abs((seen.get(cloud) ?? -Infinity) - time) <= EPS) continue;
        seen.set(cloud, time);
      }
      onEntry(body, time, registerNewborn);
      if (body.hull > 0 && body.releasedMask !== mask) {
        for (let i = entries.length - 1; i >= 0; i--)
          if (entries[i].body === body) entries.splice(i, 1);
        for (const probe of probes) probe(body, time);
        entries.sort(byTime);
      }
    }
    for (const [key, cloud] of this.clouds) {
      while (
        cloud.spans.length &&
        cloud.spans[0].end + LIFE <= start + dt + EPS
      )
        cloud.spans.shift();
      if (!cloud.spans.length) this.clouds.delete(key);
    }
  }
}
