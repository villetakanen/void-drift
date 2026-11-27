import type { FissionIgnitionEvent } from "./build-flight";
import { positionAt } from "./drone-contact";
import type { SalvageBody } from "./salvage";
import { isDroneEnemyHull } from "./targeting";

export const FISSION_FRONT = {
  speed: 340,
  reach: 50 + 115,
  thickness: 1,
  halfAngle: (16 * Math.PI) / 180,
  damage: 3,
} as const;

export interface FissionContact {
  readonly ignition: FissionIgnitionEvent;
  readonly front: 0 | 1;
  readonly targetId: number;
  /** Absolute simulation seconds, including the time within the substep. */
  readonly time: number;
  readonly x: number;
  readonly y: number;
  readonly damage: number;
}

function roots(a: number, b: number, c: number, visit: (t: number) => void) {
  if (Math.abs(a) < 1e-12) {
    if (b !== 0) visit(-c / b);
    return;
  }
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return;
  const q = -0.5 * (b + (b < 0 ? -1 : 1) * Math.sqrt(discriminant));
  visit(q / a);
  if (q !== 0) visit(c / q);
}

const edgeX = Math.cos(FISSION_FRONT.halfAngle);
const edgeY = Math.sin(FISSION_FRONT.halfAngle);

/** First contact of a moving circle with a moving annular sector, in nozzle-local coordinates. */
export function sweepFissionFront(
  x: number,
  y: number,
  dx: number,
  dy: number,
  radius: number,
  outerStart: number,
  outerEnd: number,
) {
  if (
    Math.min(x, x + dx) > outerEnd + radius ||
    Math.max(x, x + dx) < -radius ||
    Math.min(y, y + dy) > edgeY * outerEnd + radius ||
    Math.max(y, y + dy) < -edgeY * outerEnd - radius
  )
    return null;

  const growth = outerEnd - outerStart;
  const hit = { t: Infinity, x: 0, y: 0 };
  const test = (t: number) => {
    if (t < 0 || t > 1 || t >= hit.t) return;
    const px = x + dx * t;
    const py = y + dy * t;
    const length = Math.hypot(px, py);
    const inside = px >= 0 && Math.abs(py) * edgeX <= px * edgeY;
    const ux = inside && length > 0 ? px / length : edgeX;
    const uy = inside && length > 0 ? py / length : Math.sign(py || 1) * edgeY;
    const outer = outerStart + growth * t;
    const r = Math.max(
      0,
      outer - FISSION_FRONT.thickness,
      Math.min(outer, px * ux + py * uy),
    );
    const qx = r * ux;
    const qy = r * uy;
    if (Math.hypot(px - qx, py - qy) > radius + 1e-9) return;
    hit.t = t;
    hit.x = qx;
    hit.y = qy;
  };
  test(0);
  if (hit.t === 0) return hit;

  // First touch must lie on a circular arc, a straight edge, or one of their
  // corners. Solve those boundary equations in time, then validate against
  // the actual sector (rather than accepting extensions of its boundaries).
  const circle = (
    px: number,
    py: number,
    vx: number,
    vy: number,
    r: number,
    dr: number,
  ) =>
    roots(
      vx * vx + vy * vy - dr * dr,
      2 * (px * vx + py * vy - r * dr),
      px * px + py * py - r * r,
      test,
    );
  const innerStart = outerStart - FISSION_FRONT.thickness;
  circle(x, y, dx, dy, outerStart + radius, growth);
  circle(x, y, dx, dy, innerStart - radius, growth);
  if (innerStart < 0) circle(x, y, dx, dy, radius, 0);
  for (const uy of [-edgeY, edgeY]) {
    const offset = x * uy - y * edgeX;
    const drift = dx * uy - dy * edgeX;
    if (drift !== 0) {
      test((radius - offset) / drift);
      test((-radius - offset) / drift);
    }
    for (const r of [outerStart, innerStart]) {
      circle(
        x - r * edgeX,
        y - r * uy,
        dx - growth * edgeX,
        dy - growth * uy,
        radius,
        0,
      );
    }
  }
  test(1);
  return Number.isFinite(hit.t) ? hit : null;
}

interface Front {
  ignition: FissionIgnitionEvent;
  index: 0 | 1;
  launch: number;
  cos: number;
  sin: number;
  hits: Set<number>;
}

export class FissionFlight {
  private fronts: Front[] = [];
  private readonly tickContacts: FissionContact[] = [];
  get contacts(): readonly FissionContact[] {
    return this.tickContacts;
  }
  get active() {
    return this.fronts.length > 0;
  }
  beginTick() {
    this.tickContacts.length = 0;
  }
  launch(ignition: FissionIgnitionEvent, step: number) {
    for (const index of [0, 1] as const) {
      this.fronts.push({
        ignition,
        index,
        launch: (ignition.tick + index) * step,
        cos: Math.cos(ignition.exhaustAngle),
        sin: Math.sin(ignition.exhaustAngle),
        hits: new Set(),
      });
    }
  }
  resolve(
    start: number,
    end: number,
    bodies: readonly SalvageBody[],
    damage: (body: SalvageBody, contact: FissionContact) => void,
  ) {
    const pending: {
      front: Front;
      body: SalvageBody;
      contact: FissionContact;
    }[] = [];
    for (const front of this.fronts) {
      const expiry = front.launch + FISSION_FRONT.reach / FISSION_FRONT.speed;
      const from = Math.max(start, front.launch);
      const to = Math.min(end, expiry);
      if (to - from <= 1e-12) continue;
      const phase = (from - start) / (end - start);
      const duration = (to - from) / (end - start);
      const { ignition, cos, sin } = front;
      for (const body of bodies) {
        if (
          body.hull <= 0 ||
          front.hits.has(body.id) ||
          !(body.kind === "wreck" || isDroneEnemyHull(ignition.carrierId, body))
        )
          continue;
        // The shared contact pose uses the destination at both ends of a ship wrap.
        const startPose = positionAt(body, 0);
        const dx = (body.sweepEndX ?? body.x) - startPose.x;
        const dy = (body.sweepEndY ?? body.y) - startPose.y;
        const x = startPose.x - ignition.x + dx * phase;
        const y = startPose.y - ignition.y + dy * phase;
        const hit = sweepFissionFront(
          x * cos + y * sin,
          -x * sin + y * cos,
          (dx * cos + dy * sin) * duration,
          (-dx * sin + dy * cos) * duration,
          body.radius,
          (from - front.launch) * FISSION_FRONT.speed,
          (to - front.launch) * FISSION_FRONT.speed,
        );
        if (hit)
          pending.push({
            front,
            body,
            contact: {
              ignition,
              front: front.index,
              targetId: body.id,
              time: from + hit.t * (to - from),
              x: ignition.x + hit.x * cos - hit.y * sin,
              y: ignition.y + hit.x * sin + hit.y * cos,
              damage: FISSION_FRONT.damage,
            },
          });
      }
    }
    pending.sort((a, b) => a.contact.time - b.contact.time);
    for (const { front, body, contact } of pending) {
      if (body.hull <= 0 || front.hits.has(body.id)) continue;
      front.hits.add(body.id);
      damage(body, contact);
      this.tickContacts.push(contact);
    }
    this.fronts = this.fronts.filter(
      (front) => end < front.launch + FISSION_FRONT.reach / FISSION_FRONT.speed,
    );
  }
}
