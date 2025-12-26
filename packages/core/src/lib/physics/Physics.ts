export class Vec2 {
  constructor(
    public x: number,
    public y: number,
  ) { }

  add(v: Vec2): Vec2 {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v: Vec2): Vec2 {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  mult(s: number): Vec2 {
    this.x *= s;
    this.y *= s;
    return this;
  }

  mag(): number {
    return Math.hypot(this.x, this.y);
  }

  normalize(): Vec2 {
    const m = this.mag();
    if (m > 0) {
      this.mult(1 / m);
    }
    return this;
  }

  clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  set(x: number, y: number): Vec2 {
    this.x = x;
    this.y = y;
    return this;
  }
}

export interface GameObject {
  pos: Vec2;
  vel: Vec2;
  acc: Vec2;
  rotation: number; // Radians
  radius: number;
}

export interface Star {
  pos: Vec2;
  radius: number; // Physical radius
  influenceRadius: number; // Gravity well radius
  mass: number; // Gravity strength factor
  color: string;
}

export interface Planet {
  pos: Vec2; // Current position (calculated from orbit)
  orbitCenter: Vec2; // Center of orbit (usually star)
  orbitRadius: number; // Distance from center
  orbitSpeed: number; // Radians per second
  orbitAngle: number; // Current angle
  radius: number; // Physical size
  mass: number; // Gravity strength
  color: string; // Hex color
}

import { CONFIG, SURVIVAL_CONFIG } from "../config";
import type { InputState } from "../entities/Input";
import type { Resources } from "../schemas/common";

export function updatePower(
  resources: Resources,
  distanceToSun: number,
  deltaTime: number,
  thrustState: { left: boolean; right: boolean } = {
    left: false,
    right: false,
  },
): void {
  const dt = deltaTime; // Already in seconds

  // Consumption - varies based on thrust
  let consumptionRate: number = SURVIVAL_CONFIG.POWER_CONSUMPTION_RATE;
  if (thrustState.left && thrustState.right) {
    consumptionRate = SURVIVAL_CONFIG.POWER_CONSUMPTION_DUAL_THRUST;
  } else if (thrustState.left || thrustState.right) {
    consumptionRate = SURVIVAL_CONFIG.POWER_CONSUMPTION_SINGLE_THRUST;
  }
  resources.power -= consumptionRate * dt;

  // Regeneration (sun proximity)
  let regenRate = 0;
  if (distanceToSun < SURVIVAL_CONFIG.POWER_ZONE_1_RADIUS) {
    regenRate = SURVIVAL_CONFIG.POWER_REGEN_ZONE_1;
  } else if (distanceToSun < SURVIVAL_CONFIG.POWER_ZONE_2_RADIUS) {
    regenRate = SURVIVAL_CONFIG.POWER_REGEN_ZONE_2;
  } else if (distanceToSun < SURVIVAL_CONFIG.POWER_ZONE_3_RADIUS) {
    regenRate = SURVIVAL_CONFIG.POWER_REGEN_ZONE_3;
  }

  resources.power += regenRate * dt;

  // Clamp
  resources.power = Math.max(0, Math.min(100, resources.power));
}

export function updateHull(
  resources: Resources,
  distanceToSun: number,
  sunRadius: number,
  deltaTime: number,
): void {
  const dt = deltaTime;

  // Star contact = instant death
  if (distanceToSun < sunRadius) {
    resources.hull = 0;
    return;
  }

  // Sun proximity burn
  let burnRate = 0;
  if (distanceToSun < SURVIVAL_CONFIG.POWER_ZONE_1_RADIUS) {
    burnRate = SURVIVAL_CONFIG.HULL_BURN_ZONE_1;
  } else if (distanceToSun < SURVIVAL_CONFIG.POWER_ZONE_2_RADIUS) {
    burnRate = SURVIVAL_CONFIG.HULL_BURN_ZONE_2;
  } else if (distanceToSun < SURVIVAL_CONFIG.POWER_ZONE_3_RADIUS) {
    burnRate = SURVIVAL_CONFIG.HULL_BURN_ZONE_3;
  }

  resources.hull -= burnRate * dt;

  // Clamp
  resources.hull = Math.max(0, Math.min(100, resources.hull));
}

export function applyPlanetCollisionDamage(resources: Resources): void {
  resources.hull -= SURVIVAL_CONFIG.PLANET_COLLISION_DAMAGE;
  resources.hull = Math.max(0, resources.hull);
}

export function updateShip(
  ship: GameObject,
  input: InputState,
  dt: number,
  width: number,
  height: number,
  star?: Star,
  planets: Planet[] = [],
  resources?: Resources,
) {
  // 1. Rotation & Variable Thrust (Differential)
  // Left Engine -> Rotate Right + 50% Thrust
  // Right Engine -> Rotate Left + 50% Thrust
  // Both -> 100% Thrust, No Rotate (impulses cancel out rotation)

  let thrustMultiplier = 0.0;
  let isThrusting = false;

  if (input.leftThruster && input.rightThruster) {
    // Both active: Standard thrust, no rotation
    thrustMultiplier = 1.0;
    isThrusting = true;
  } else if (input.leftThruster) {
    // Left only: Rotate + Double Thrust (was 0.5)
    ship.rotation += CONFIG.ROTATION_SPEED * dt;
    thrustMultiplier = 1.0;
    isThrusting = true;
  } else if (input.rightThruster) {
    // Right only: Rotate + Double Thrust (was 0.5)
    ship.rotation -= CONFIG.ROTATION_SPEED * dt;
    thrustMultiplier = 1.0;
    isThrusting = true;
  }

  // Apply Thrust
  if (thrustMultiplier > 0) {
    const thrustX =
      Math.cos(ship.rotation) * CONFIG.THRUST_FORCE * thrustMultiplier;
    const thrustY =
      Math.sin(ship.rotation) * CONFIG.THRUST_FORCE * thrustMultiplier;
    ship.acc.x += thrustX;
    ship.acc.y += thrustY;
  }

  // 2. Gravity Well (Star)
  // Apply force if within influence radius
  if (star) {
    const distVec = star.pos.clone().sub(ship.pos);
    const dist = distVec.mag();

    if (dist < star.influenceRadius && dist > star.radius) {
      // Normalize direction
      distVec.normalize();

      // Simple Gravity: Force = Mass / Dist (Linear-ish feel for game)
      // Or Inverse Square: Force = Mass / (Dist * Dist)
      // Let's try a tuned linear pull that gets stronger closer in.
      // Normalized Dist (0 at star, 1 at edge)
      const normalizedDist = dist / star.influenceRadius;
      const strength = star.mass * (1 - normalizedDist);

      ship.acc.add(distVec.mult(strength));
    }
  }

  // 3. Planet Interaction (Gravity + Collision)
  for (const planet of planets) {
    // Update Planet Position (Orbit)
    planet.orbitAngle += planet.orbitSpeed * dt;
    planet.pos.x =
      planet.orbitCenter.x + Math.cos(planet.orbitAngle) * planet.orbitRadius;
    planet.pos.y =
      planet.orbitCenter.y + Math.sin(planet.orbitAngle) * planet.orbitRadius;

    const dx = planet.pos.x - ship.pos.x;
    const dy = planet.pos.y - ship.pos.y;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq);

    // Gravity (Weaker than star, but constant pull nearby)
    // Influence radius approx 16x planet radius
    const influenceRadius = planet.radius * 16;

    if (dist < influenceRadius && dist > planet.radius + ship.radius) {
      const strength = (planet.mass / distSq) * 1000; // Inverse square approximation
      const gravityX = (dx / dist) * strength;
      const gravityY = (dy / dist) * strength;
      ship.acc.x += gravityX;
      ship.acc.y += gravityY;
    }

    // Collision (Elastic Bounce)
    const minDist = planet.radius + ship.radius;
    if (dist < minDist) {
      // Resolve overlap
      const overlap = minDist - dist;
      const nx = dx / dist; // Vector pointing towards planet
      const ny = dy / dist;

      // Push ship out
      ship.pos.x -= nx * overlap;
      ship.pos.y -= ny * overlap;

      // Reflect Velocity
      // V' = V - 2(V . N)N
      // We want N to be the normal of the reflection surface (pointing OUT from planet)
      // So normal = -n
      const normalX = -nx;
      const normalY = -ny;

      const dot = ship.vel.x * normalX + ship.vel.y * normalY;

      // Restitution (bounciness)
      const restitution = 0.8;

      ship.vel.x = (ship.vel.x - 2 * dot * normalX) * restitution;
      ship.vel.y = (ship.vel.y - 2 * dot * normalY) * restitution;

      if (resources) {
        applyPlanetCollisionDamage(resources);
      }
    }
  }

  // 4. Integration
  // vel += acc * dt

  const dVel = ship.acc.clone().mult(dt);
  ship.vel.add(dVel);

  // 5. Inertia Damping (Drag)
  // Approx nonlinear drag: vel -= vel * DRAG * dt
  // Or VEL *= (1 - DRAG * dt)
  const dragFactor = 1 - CONFIG.SHIP_DRAG * dt;
  ship.vel.mult(Math.max(0, dragFactor)); // Prevent negative reversal if low FPS

  // 6. Max Speed Cap
  if (ship.vel.mag() > CONFIG.MAX_SPEED) {
    ship.vel.normalize().mult(CONFIG.MAX_SPEED);
  }

  // pos += vel * dt
  const dPos = ship.vel.clone().mult(dt);
  ship.pos.add(dPos);

  ship.acc.set(0, 0);

  // 7. Wrapping (Circular Arena - R=1200)
  const centerX = width / 2;
  const centerY = height / 2;
  const dx = ship.pos.x - centerX;
  const dy = ship.pos.y - centerY;
  const distSq = dx * dx + dy * dy;
  const radiusSq = 1200 * 1200;

  if (distSq > radiusSq) {
    // Antipodal Wrap: Teleport to opposite side
    // Preserve velocity (so it points inward from the other side)

    // To prevent getting stuck in a loop due to floating point precision,
    // wrap slightly inside the circle (0.99)
    ship.pos.x = centerX - dx * 0.99;
    ship.pos.y = centerY - dy * 0.99;
  }
}
