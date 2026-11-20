import {
  type GameObject,
  type Star,
  solarField,
  starPull,
} from "@void-drift/core";

/** Score a predicted state against a safe, productive orbit and its energy cost. */
export function scoreSolarRecovery(
  ship: GameObject,
  star: Star,
  powerSpent: number,
  minHazardClearance: number,
): number {
  const dx = ship.pos.x - star.pos.x;
  const dy = ship.pos.y - star.pos.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const nx = dx / distance,
    ny = dy / distance;
  const field = solarField(star);
  const damageReach = star.damageField?.reach ?? 0;
  const targetRadius = Math.max(
    star.radius + ship.radius + 35,
    damageReach + ship.radius + 15,
    field.reach * 0.7,
  );
  const targetPoint = { x: star.pos.x + targetRadius, y: star.pos.y };
  const pull = starPull(targetPoint, star, "inverse-square").mag();
  const orbitSpeed = Math.sqrt(pull * targetRadius);
  const radialSpeed = ship.vel.x * nx + ship.vel.y * ny;
  const tangentSpeed = -ship.vel.x * ny + ship.vel.y * nx;
  const direction = tangentSpeed < 0 ? -1 : 1;
  // Approach gradually; retaining angular momentum avoids a plunge at periapsis.
  const wantedRadial = Math.max(
    -100,
    Math.min(100, (targetRadius - distance) * 0.8),
  );
  const wantedTangent =
    direction * orbitSpeed * Math.min(1, targetRadius / distance);
  const deltaRadial = wantedRadial - radialSpeed;
  const deltaTangent = wantedTangent - tangentSpeed;
  const dvx = nx * deltaRadial - ny * deltaTangent;
  const dvy = ny * deltaRadial + nx * deltaTangent;
  const delta = Math.hypot(dvx, dvy);
  const headingError =
    delta > 8
      ? Math.abs(
          Math.atan2(
            Math.sin(Math.atan2(dvy, dvx) - ship.rotation),
            Math.cos(Math.atan2(dvy, dvx) - ship.rotation),
          ),
        )
      : 0;
  const outside = distance > field.reach;
  return (
    delta * (outside ? 2 : 1) +
    headingError * 20 +
    Math.abs(distance - targetRadius) * 0.05 +
    powerSpent * (outside ? 1 : 2) +
    Math.max(0, 45 - minHazardClearance) * 30
  );
}

/** Begin a return when the ship is stranded outside the collection field. */
export function recoveryDeparture(
  ship: GameObject,
  star: Star,
): { leftThruster: boolean; rightThruster: boolean; fire: false } | undefined {
  const dx = star.pos.x - ship.pos.x;
  const dy = star.pos.y - ship.pos.y;
  if (Math.hypot(dx, dy) <= solarField(star).reach || ship.vel.mag() >= 5)
    return undefined;
  const error = Math.atan2(
    Math.sin(Math.atan2(dy, dx) - ship.rotation),
    Math.cos(Math.atan2(dy, dx) - ship.rotation),
  );
  if (Math.abs(error) < 0.3)
    return { leftThruster: true, rightThruster: true, fire: false };
  return { leftThruster: error > 0, rightThruster: error < 0, fire: false };
}
