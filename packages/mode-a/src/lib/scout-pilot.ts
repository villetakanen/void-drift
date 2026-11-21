import {
  ARENA_RADIUS,
  antipodalWrap,
  type GameObject,
  type Planet,
  planetPull,
  type Star,
  solarCollectionRate,
  starPull,
  updatePlanetOrbit,
} from "@void-drift/core";
import { chooseEnemyAction, type EnemyObjective } from "./enemy-ai";
import {
  ASSEMBLED_ION_DEFAULTS,
  type AssembledIonSettings,
} from "./schemas/ion";
import { LIFE_SUPPORT_DRAIN, type Loadout } from "./schemas/loadout";
import {
  applyScoutTableImpulse,
  interpolateScoutEntry,
  SCOUT_PREDICTOR_COMMANDS,
  SCOUT_PREDICTOR_STEP,
  scoutFlightProfile,
} from "./scout-predictor";
import { recoveryDeparture, scoreSolarRecovery } from "./scout-solar-recovery";

interface ScoutPilotState {
  ship: GameObject;
  loadout: Loadout;
  resources: { power: number };
  angularMotion: { velocity: number };
  objective: EnemyObjective;
}

function angleDifference(a: number, b: number) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

// Each first command can be followed by sustained coasting or forward thrust.
const CANDIDATE_SEQUENCES = [
  [0, 0],
  [0, 3],
  [1, 0],
  [1, 3],
  [2, 0],
  [2, 3],
  [3, 0],
  [3, 3],
] as const;

function sweptClearance(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  radius: number,
) {
  const dx = bx - ax,
    dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared
    ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lengthSquared))
    : 0;
  return Math.hypot(ax + dx * t, ay + dy * t) - radius;
}

/** Preserve the flight remaining after an arena crossing in a coarse prediction step. */
function wrapFlightSegment(
  x: number,
  y: number,
  endX: number,
  endY: number,
  dt: number,
) {
  if (!antipodalWrap(endX, endY, 960, 540)) return undefined;
  const dx = endX - x,
    dy = endY - y;
  const rx = x - 960,
    ry = y - 540;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return antipodalWrap(endX, endY, 960, 540) ?? undefined;
  const dot = rx * dx + ry * dy;
  const distanceError = rx * rx + ry * ry - ARENA_RADIUS * ARENA_RADIUS;
  const crossing =
    (-dot + Math.sqrt(Math.max(0, dot * dot - lengthSquared * distanceError))) /
    lengthSquared;
  // Live flight checks the boundary at the end of each 240 Hz substep.
  const substeps = Math.round(dt * 240);
  const fraction = Math.min(
    1,
    Math.max(0, Math.floor(crossing * substeps) + 1) / substeps,
  );
  const wrapped = antipodalWrap(x + dx * fraction, y + dy * fraction, 960, 540);
  return (
    wrapped && {
      x: wrapped.x + dx * (1 - fraction),
      y: wrapped.y + dy * (1 - fraction),
    }
  );
}

/** Coarse deterministic dynamics prediction; only the first command is executed. */
export function planScout(
  actor: ScoutPilotState,
  target: GameObject,
  star: Star,
  planets: Planet[],
  ion: AssembledIonSettings = ASSEMBLED_ION_DEFAULTS,
) {
  const predictionHorizon = 1.2;
  const steps = 12;
  const dt = SCOUT_PREDICTOR_STEP;
  const flightProfile = scoutFlightProfile(actor.loadout, ion);
  const { stats } = flightProfile;
  // Each time slice is read by every candidate. The live planets keep their phase.
  const ephemeris = [planets];
  for (let step = 0; step < steps; step++) {
    ephemeris.push(
      ephemeris[step].map((planet) => {
        const next = { ...planet, pos: planet.pos.clone() };
        updatePlanetOrbit(next, dt);
        return next;
      }),
    );
  }
  const targetEnd = {
    x: target.pos.x + target.vel.x * predictionHorizon,
    y: target.pos.y + target.vel.y * predictionHorizon,
  };
  const departure =
    actor.objective === "recover"
      ? recoveryDeparture(actor.ship, star)
      : undefined;
  const first = departure
    ? Number(departure.leftThruster) + 2 * Number(departure.rightThruster)
    : undefined;
  const candidates = CANDIDATE_SEQUENCES;
  return chooseEnemyAction(candidates, ([firstCommand, secondCommand]) => {
    const ship = {
      ...actor.ship,
      pos: actor.ship.pos.clone(),
      vel: actor.ship.vel.clone(),
    };
    let spin = actor.angularMotion.velocity;
    let power = actor.resources.power;
    const path = [{ x: ship.pos.x, y: ship.pos.y }];
    let minHazardClearance = Infinity;
    for (let step = 0; step < steps; step++) {
      const entry = interpolateScoutEntry(
        flightProfile,
        step < 3 ? firstCommand : secondCommand,
        spin,
      );
      const beforeX = ship.pos.x,
        beforeY = ship.pos.y;
      const sunlight = solarCollectionRate(
        Math.hypot(beforeX - star.pos.x, beforeY - star.pos.y),
        star,
        stats.coils,
      );
      const available = Math.max(
        0,
        Math.min(stats.capacity, power + (sunlight - LIFE_SUPPORT_DRAIN) * dt),
      );
      const cost = -entry.energy;
      const spent = Math.min(cost, available);
      const fraction = cost > 0 ? spent / cost : 1;
      power = available - spent;
      applyScoutTableImpulse(
        ship,
        entry.dx * fraction,
        entry.dy * fraction,
        flightProfile.speedLimit,
      );
      ship.rotation += entry.heading * fraction + spin * dt * (1 - fraction);
      spin += (entry.spin - spin) * fraction;
      const gravity = starPull(ship.pos, star, "inverse-square");
      for (const planet of ephemeris[step]) {
        const pull = planetPull(ship.pos, ship.radius, planet);
        gravity.x += pull.x;
        gravity.y += pull.y;
      }
      const afterX = beforeX + (ship.vel.x + (gravity.x * dt) / 2) * dt;
      const afterY = beforeY + (ship.vel.y + (gravity.y * dt) / 2) * dt;
      ship.vel.x += gravity.x * dt;
      ship.vel.y += gravity.y * dt;
      const wrapped = wrapFlightSegment(beforeX, beforeY, afterX, afterY, dt);
      ship.pos.set(wrapped?.x ?? afterX, wrapped?.y ?? afterY);
      if (step % 2 === 1) path.push({ x: ship.pos.x, y: ship.pos.y });

      minHazardClearance = Math.min(
        minHazardClearance,
        sweptClearance(
          beforeX - star.pos.x,
          beforeY - star.pos.y,
          afterX - star.pos.x,
          afterY - star.pos.y,
          star.radius + ship.radius,
        ),
      );
      for (const [index, planet] of ephemeris[step + 1].entries()) {
        const initial = ephemeris[step][index];
        minHazardClearance = Math.min(
          minHazardClearance,
          sweptClearance(
            beforeX - initial.pos.x,
            beforeY - initial.pos.y,
            afterX - planet.pos.x,
            afterY - planet.pos.y,
            planet.radius + ship.radius,
          ),
        );
        if (wrapped)
          minHazardClearance = Math.min(
            minHazardClearance,
            Math.hypot(wrapped.x - planet.pos.x, wrapped.y - planet.pos.y) -
              planet.radius -
              ship.radius,
          );
      }
    }
    const dx = targetEnd.x - ship.pos.x;
    const dy = targetEnd.y - ship.pos.y;
    const distance = Math.hypot(dx, dy);
    const bearing = Math.atan2(dy, dx);
    const alignment = Math.abs(angleDifference(bearing, ship.rotation));
    const relativeSpeed = Math.hypot(
      ship.vel.x - target.vel.x,
      ship.vel.y - target.vel.y,
    );
    const pursuitScore =
      distance +
      Math.max(0, 145 - distance) * 3 +
      alignment * 60 +
      Math.max(0, 55 - minHazardClearance) * 12 +
      relativeSpeed * 0.15 +
      (actor.resources.power - power) * 0.4;
    const score =
      actor.objective === "recover"
        ? scoreSolarRecovery(
            ship,
            star,
            actor.resources.power - power,
            minHazardClearance,
          )
        : pursuitScore;
    return {
      command: SCOUT_PREDICTOR_COMMANDS[firstCommand],
      horizonSeconds: predictionHorizon,
      candidateCount: candidates.length,
      score:
        actor.objective === "recover"
          ? Math.max(
              -100_000,
              Math.min(
                100_000,
                score +
                  Number(firstCommand !== secondCommand) * 2 +
                  (first !== undefined && firstCommand !== first ? 10_000 : 0),
              ),
            ) + (minHazardClearance <= 0 ? 1_000_000 : 0)
          : score + Number(firstCommand !== secondCommand) * 2,
      path,
    };
  });
}
