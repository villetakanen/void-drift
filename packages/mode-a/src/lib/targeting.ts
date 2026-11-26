import type { GameObject, Planet, Star } from "@void-drift/core";
import { BUILD_FLIGHT_SCALE, weaponPose } from "./build-renderer";
import {
  derelictClosestPoint,
  derelictForwardContacts,
  getDerelictRadius,
} from "./derelict-collision";
import type {
  SalvageBody,
  SalvageSystem,
  TargetingMetrics,
  WeaponState,
} from "./salvage";
import { CHASSIS } from "./schemas/loadout";
import {
  DRONE_LAUNCHER,
  ION_CANNON,
  PLASMA_RIFLE,
  POINT_DEFENCE,
  WEAPONS,
} from "./schemas/salvage";

/** Immutable selections captured before any weapon in a combat substep fires. */
export interface WeaponAcquisition {
  cannon: boolean;
  targets: Map<
    WeaponState,
    { id: number; x: number; y: number; distance: number }
  >;
}
export const PLAYER_BODY_ID = 900000;
export function isDroneEnemyHull(carrierId: number, body: SalvageBody) {
  return (
    body.kind === "ship" &&
    body.carrierId === undefined &&
    body.hull > 0 &&
    (carrierId === PLAYER_BODY_ID) !== (body.id === PLAYER_BODY_ID)
  );
}
export interface DronePursuit {
  x: number;
  y: number;
  carrierId: number;
  target: number | null;
}
export interface AcquisitionShooter {
  system: SalvageSystem;
  ship: GameObject;
  shooterId?: number;
  aimId?: number;
  aimTargets?: readonly SalvageBody[];
}

type AcquisitionChoice = {
  id: number;
  x: number;
  y: number;
  distance: number;
  priority: number;
  order: number;
};
type AcquisitionRequest = {
  shooter: AcquisitionShooter;
  weapon?: WeaponState;
  linkedLaunchers?: WeaponState[];
  kind:
    | "cannon"
    | "laser"
    | "ion-point-defence"
    | "plasma-rifle"
    | "drone-launcher";
  forwardX?: number;
  forwardY?: number;
  x: number;
  y: number;
  best?: AcquisitionChoice;
  retained?: AcquisitionChoice;
  result: WeaponAcquisition;
  blocked: boolean;
};
const RIFLE_COS_HALF_ANGLE = Math.cos(PLASMA_RIFLE.halfAngle);
const requestSlots = new WeakMap<
  SalvageSystem,
  { cannon?: AcquisitionRequest; weapons: Map<WeaponState, AcquisitionRequest> }
>();

/** Register all requests first, then visit each encounter body once. */
export function acquireFleetTargets(
  roster: readonly SalvageBody[],
  shooters: readonly AcquisitionShooter[],
  star: Star,
  planets: readonly Planet[],
  dt: number,
  metrics?: TargetingMetrics,
  drones: readonly DronePursuit[] = [],
): Map<SalvageSystem, WeaponAcquisition> {
  const started = metrics ? performance.now() : 0;
  const results = new Map<SalvageSystem, WeaponAcquisition>();
  const requests: AcquisitionRequest[] = [];
  const blockedNear = (x: number, y: number, reach: number) => {
    const near = (world: { pos: { x: number; y: number }; radius: number }) => {
      const dx = world.pos.x - x,
        dy = world.pos.y - y,
        limit = reach + world.radius;
      return dx * dx + dy * dy <= limit * limit;
    };
    return near(star) || planets.some(near);
  };
  for (const shooter of shooters) {
    const result: WeaponAcquisition = { cannon: false, targets: new Map() };
    results.set(shooter.system, result);
    let slots = requestSlots.get(shooter.system);
    if (!slots) {
      slots = { weapons: new Map() };
      requestSlots.set(shooter.system, slots);
    }
    const cannonReady = shooter.system.weapons.some(
      (weapon) =>
        weapon.kind === "light-ion-cannon" &&
        shooter.system.time + dt + 1e-9 >= weapon.readyAt,
    );
    if (cannonReady) {
      const x = shooter.ship.pos.x,
        y = shooter.ship.pos.y;
      const request = slots.cannon ?? {
        shooter,
        kind: "cannon" as const,
        x,
        y,
        result,
        blocked: false,
      };
      Object.assign(request, {
        shooter,
        x,
        y,
        result,
        best: undefined,
        retained: undefined,
        blocked: blockedNear(
          x,
          y,
          Math.hypot(
            ION_CANNON.range,
            (CHASSIS[shooter.system.loadoutChassis].width *
              BUILD_FLIGHT_SCALE) /
              2,
          ),
        ),
      });
      slots.cannon = request;
      requests.push(request);
    }
    let launcher: AcquisitionRequest | undefined;
    for (const weapon of shooter.system.weapons) {
      if (
        weapon.kind !== "laser" &&
        weapon.kind !== "ion-point-defence" &&
        weapon.kind !== "plasma-rifle" &&
        !(
          weapon.kind === "drone-launcher" &&
          shooter.system.time + dt + 1e-9 >= weapon.readyAt
        )
      )
        continue;
      if (weapon.kind === "drone-launcher" && launcher) {
        launcher.linkedLaunchers ??= [];
        launcher.linkedLaunchers.push(weapon);
        continue;
      }
      const pose = weaponPose(shooter.ship, weapon.mount, weapon.angle);
      const x =
        weapon.kind === "drone-launcher"
          ? shooter.ship.pos.x
          : weapon.kind === "plasma-rifle"
            ? pose.muzzleX
            : pose.x;
      const y =
        weapon.kind === "drone-launcher"
          ? shooter.ship.pos.y
          : weapon.kind === "plasma-rifle"
            ? pose.muzzleY
            : pose.y;
      const request = slots.weapons.get(weapon) ?? {
        shooter,
        weapon,
        kind: weapon.kind,
        x,
        y,
        result,
        blocked: false,
      };
      Object.assign(request, {
        shooter,
        x,
        y,
        forwardX:
          weapon.kind === "plasma-rifle" ? Math.cos(pose.angle) : undefined,
        forwardY:
          weapon.kind === "plasma-rifle" ? Math.sin(pose.angle) : undefined,
        result,
        best: undefined,
        retained: undefined,
        blocked: blockedNear(
          x,
          y,
          weapon.kind === "laser"
            ? WEAPONS.laser.range
            : weapon.kind === "plasma-rifle"
              ? PLASMA_RIFLE.range
              : POINT_DEFENCE.trackingRange,
        ),
      });
      if (weapon.kind === "drone-launcher") {
        launcher = request;
        launcher.linkedLaunchers = undefined;
      }
      slots.weapons.set(weapon, request);
      requests.push(request);
    }
  }
  if (metrics)
    metrics.activeRequests =
      (metrics.activeRequests ?? 0) + requests.length + drones.length;
  if (!requests.length && !drones.length) return results;
  const pursuits = drones.map((drone) => ({
    drone,
    id: null as number | null,
    best: Infinity,
  }));
  const visible = (request: AcquisitionRequest, endX: number, endY: number) => {
    if (!request.blocked) return true;
    if (metrics) metrics.visibilityTests = (metrics.visibilityTests ?? 0) + 1;
    return request.shooter.system.lineClear(
      request.x,
      request.y,
      endX,
      endY,
      star,
      planets,
    );
  };
  for (const body of roster) {
    if (metrics) metrics.bodyVisits++;
    if (body.kind === "cell" || body.hull <= 0) continue;
    if (body.kind === "ship" && body.carrierId === undefined) {
      for (const pursuit of pursuits) {
        const drone = pursuit.drone;
        if (!isDroneEnemyHull(drone.carrierId, body)) continue;
        if (metrics) metrics.comparisons++;
        const distance = (drone.x - body.x) ** 2 + (drone.y - body.y) ** 2;
        if (distance >= 500 ** 2) continue;
        const order = body.id === drone.target ? -1 : distance;
        if (
          order < pursuit.best ||
          (order === pursuit.best && body.id < (pursuit.id ?? Infinity))
        ) {
          pursuit.best = order;
          pursuit.id = body.id;
        }
      }
    }
    for (const request of requests) {
      const { shooter, weapon } = request;
      if (
        body.id === shooter.shooterId ||
        (body.carrierId !== undefined &&
          (request.kind !== "ion-point-defence" ||
            ((shooter.shooterId ?? PLAYER_BODY_ID) === PLAYER_BODY_ID) ===
              (body.carrierId === PLAYER_BODY_ID))) ||
        (shooter.aimId !== undefined &&
          body.id !== shooter.aimId &&
          body.carrierId !== shooter.aimId) ||
        (shooter.aimTargets && !shooter.aimTargets.includes(body))
      )
        continue;
      if (metrics) metrics.comparisons++;
      const dx = body.x - request.x,
        dy = body.y - request.y;
      const centreSquared = dx * dx + dy * dy;
      if (request.kind === "cannon") {
        if (request.result.cannon) continue;
        const width =
          CHASSIS[shooter.system.loadoutChassis].width * BUILD_FLIGHT_SCALE;
        const forward =
          dx * Math.cos(shooter.ship.rotation) +
          dy * Math.sin(shooter.ship.rotation);
        const lateral = Math.abs(
          -dx * Math.sin(shooter.ship.rotation) +
            dy * Math.cos(shooter.ship.rotation),
        );
        const gapSquared =
          Math.max(0, -forward, forward - ION_CANNON.range) ** 2 +
          Math.max(0, lateral - width / 2) ** 2;
        const bound =
          body.kind === "ship"
            ? body.radius
            : getDerelictRadius({
                kind: body.kind,
                x: body.x,
                y: body.y,
                rotation: body.rotation,
                shardIndex: body.shardIndex ?? 0,
                releasedMask: body.releasedMask ?? 0,
              });
        if (gapSquared > bound * bound) continue;
        if (body.kind !== "ship" && metrics)
          metrics.materialTests = (metrics.materialTests ?? 0) + 1;
        const clampedForward = Math.max(0, Math.min(ION_CANNON.range, forward));
        const signedLateral =
          -dx * Math.sin(shooter.ship.rotation) +
          dy * Math.cos(shooter.ship.rotation);
        const clampedLateral = Math.max(
          -width / 2,
          Math.min(width / 2, signedLateral),
        );
        const witnessX =
          request.x +
          clampedForward * Math.cos(shooter.ship.rotation) -
          clampedLateral * Math.sin(shooter.ship.rotation);
        const witnessY =
          request.y +
          clampedForward * Math.sin(shooter.ship.rotation) +
          clampedLateral * Math.cos(shooter.ship.rotation);
        const hit =
          body.kind === "ship"
            ? visible(request, witnessX, witnessY)
            : derelictForwardContacts(
                { ...body, kind: body.kind },
                request.x,
                request.y,
                shooter.ship.rotation,
                width,
                ION_CANNON.range,
              ).some((point) => visible(request, point.x, point.y));
        if (hit) request.result.cannon = true;
        continue;
      }
      if (!weapon) continue;
      if (request.kind === "drone-launcher") {
        if (
          body.kind !== "ship" ||
          body.carrierId !== undefined ||
          centreSquared > DRONE_LAUNCHER.range ** 2
        )
          continue;
        const distance = Math.sqrt(centreSquared);
        if (
          !request.best ||
          distance < request.best.distance ||
          (distance === request.best.distance && body.id < request.best.id)
        )
          request.best = {
            id: body.id,
            x: body.x,
            y: body.y,
            distance,
            priority: 0,
            order: distance,
          };
        continue;
      }
      if (request.kind === "plasma-rifle") {
        if (body.kind !== "ship" && body.kind !== "wreck") continue;
        if (centreSquared > PLASMA_RIFLE.range ** 2 + 1e-9) continue;
        const distance = Math.sqrt(centreSquared);
        if (
          dx * (request.forwardX ?? 1) + dy * (request.forwardY ?? 0) + 1e-9 <
          distance * RIFLE_COS_HALF_ANGLE
        )
          continue;
        if (!visible(request, body.x, body.y)) continue;
        const candidate: AcquisitionChoice = {
          id: body.id,
          x: body.x,
          y: body.y,
          distance,
          priority: 0,
          order: distance,
        };
        if (body.id === weapon.target) request.retained = candidate;
        if (
          !request.best ||
          distance < request.best.distance ||
          (distance === request.best.distance && body.id < request.best.id)
        )
          request.best = candidate;
        continue;
      }
      const reach =
        request.kind === "laser"
          ? WEAPONS.laser.range
          : POINT_DEFENCE.trackingRange + body.radius;
      if (
        (request.kind === "laser" || body.kind === "ship") &&
        centreSquared > reach * reach
      )
        continue;
      const centre = Math.sqrt(centreSquared);
      let candidate: AcquisitionChoice;
      if (request.kind === "laser") {
        if (centre > WEAPONS.laser.range || !visible(request, body.x, body.y))
          continue;
        if (body.kind === "fragment" && metrics)
          metrics.materialTests = (metrics.materialTests ?? 0) + 1;
        const threat =
          body.kind === "fragment"
            ? shooter.system.cast(
                body,
                shooter.ship.pos.x,
                shooter.ship.pos.y,
                shooter.ship.vel.x - body.vx,
                shooter.ship.vel.y - body.vy,
                shooter.ship.radius,
                WEAPONS.laser.threatHorizon,
              )
            : Infinity;
        const priority = Number.isFinite(threat)
          ? 0
          : body.kind === "wreck"
            ? 1
            : 2;
        candidate = {
          id: body.id,
          x: body.x,
          y: body.y,
          distance: centre,
          priority,
          order: priority === 0 ? threat : centre,
        };
      } else {
        let closest: { x: number; y: number; distance: number } | null;
        if (body.kind === "ship") {
          const distance = Math.max(0, centre - body.radius);
          if (
            distance > POINT_DEFENCE.trackingRange ||
            (body.id !== weapon.target &&
              request.best &&
              (distance > request.best.distance ||
                (distance === request.best.distance &&
                  body.id > request.best.id)))
          )
            continue;
          const scale = centre > 0 ? distance / centre : 0;
          closest = {
            x: request.x + dx * scale,
            y: request.y + dy * scale,
            distance,
          };
        } else {
          const shape = {
            kind: body.kind,
            x: body.x,
            y: body.y,
            rotation: body.rotation,
            shardIndex: body.shardIndex ?? 0,
            releasedMask: body.releasedMask ?? 0,
          };
          const bound = Math.max(0, centre - getDerelictRadius(shape));
          const limit =
            body.id === weapon.target
              ? POINT_DEFENCE.trackingRange
              : Math.min(
                  POINT_DEFENCE.trackingRange,
                  request.best?.distance ?? POINT_DEFENCE.trackingRange,
                );
          if (bound > limit) continue;
          if (metrics) metrics.materialTests = (metrics.materialTests ?? 0) + 1;
          closest = derelictClosestPoint(
            shape,
            { x: request.x, y: request.y },
            limit,
          );
        }
        if (
          !closest ||
          closest.distance > POINT_DEFENCE.trackingRange ||
          !visible(request, closest.x, closest.y)
        )
          continue;
        candidate = {
          id: body.id,
          ...closest,
          priority: 0,
          order: closest.distance,
        };
      }
      if (candidate.id === weapon.target) request.retained = candidate;
      if (
        !request.best ||
        candidate.priority < request.best.priority ||
        (candidate.priority === request.best.priority &&
          (candidate.order < request.best.order ||
            (candidate.order === request.best.order &&
              candidate.id < request.best.id)))
      )
        request.best = candidate;
    }
  }
  for (const pursuit of pursuits) pursuit.drone.target = pursuit.id;
  for (const request of requests) {
    if (!request.weapon || !request.best) continue;
    const keep =
      request.retained &&
      (request.kind === "plasma-rifle"
        ? true
        : request.kind === "laser"
          ? request.retained.priority === request.best.priority
          : request.best.distance >
            request.retained.distance - POINT_DEFENCE.retention);
    if (request.linkedLaunchers)
      for (const mount of request.linkedLaunchers)
        request.result.targets.set(mount, request.best);
    results
      .get(request.shooter.system)
      ?.targets.set(
        request.weapon,
        keep && request.retained ? request.retained : request.best,
      );
  }
  if (metrics) metrics.acquisitionMs += performance.now() - started;
  return results;
}
