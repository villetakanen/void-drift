import {
  initializePlanets,
  solarField,
  starPull,
  updateHull,
} from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { updateEnemyObjectiveForCapacity } from "./enemy-ai";
import { createStar } from "./game-loop";
import {
  createPirate,
  NO_PILOT_COMMAND,
  planPirate,
  stepGauntletActor,
} from "./gauntlet";
import { buildStats } from "./schemas/loadout";
import { GRAVITY_TUNING } from "./tuning";
import { applyYellowFamilyProfile } from "./yellow-star-family";

function flyRecovery(
  radius: number,
  start: "orbit" | "outward" | "rest" | "rest-side",
) {
  const star = createStar("G", 960, 540);
  applyYellowFamilyProfile(star, radius, GRAVITY_TUNING);
  const actor = createPirate(0);
  actor.lifecycle = "active";
  actor.objective = "recover";
  const capacity = buildStats(actor.loadout).capacity;
  actor.resources.power = capacity * 0.19;
  const target = createPirate(1).ship;
  target.pos.set(1200, 540);
  target.vel.set(0, 0);
  const field = solarField(star);
  const orbitRadius = Math.max(
    star.radius + actor.ship.radius + 35,
    (star.damageField?.reach ?? 0) + actor.ship.radius + 15,
    field.reach * 0.7,
  );
  const distance = start === "orbit" ? orbitRadius : field.reach + 10;
  actor.ship.pos.set(star.pos.x + distance, star.pos.y);
  const circularSpeed = Math.sqrt(
    starPull(actor.ship.pos, star, "inverse-square").mag() * distance,
  );
  actor.ship.vel.set(
    start === "outward" ? 20 : 0,
    start === "orbit" ? circularSpeed : 0,
  );
  actor.ship.rotation =
    start === "orbit" || start === "rest-side" ? Math.PI / 2 : Math.PI;
  let command = NO_PILOT_COMMAND;
  let minClearance = Infinity;
  let enteredField = start === "orbit";
  for (let tick = 0; tick < 60 * 180 && actor.objective === "recover"; tick++) {
    if (tick % 8 === 0) command = planPirate(actor, target, star, []).command;
    for (let substep = 0; substep < 4; substep++)
      stepGauntletActor(actor, command, 1 / 240, star, []);
    const r = Math.hypot(
      actor.ship.pos.x - star.pos.x,
      actor.ship.pos.y - star.pos.y,
    );
    enteredField ||= r < field.reach;
    minClearance = Math.min(minClearance, r - star.radius - actor.ship.radius);
    updateHull(actor.resources, r, star, 1 / 60);
    if (
      minClearance <= 0 ||
      actor.resources.hull <= 0 ||
      actor.resources.power <= 0
    )
      break;
    updateEnemyObjectiveForCapacity(actor, capacity, true);
  }
  const recoveredPower = actor.resources.power;
  const resumed = recoveredPower >= capacity * 0.8;
  for (let tick = 0; resumed && tick < 120; tick++) {
    if (tick % 8 === 0) command = planPirate(actor, target, star, []).command;
    for (let substep = 0; substep < 4; substep++)
      stepGauntletActor(actor, command, 1 / 240, star, []);
    const r = Math.hypot(
      actor.ship.pos.x - star.pos.x,
      actor.ship.pos.y - star.pos.y,
    );
    minClearance = Math.min(minClearance, r - star.radius - actor.ship.radius);
    updateHull(actor.resources, r, star, 1 / 60);
    if (minClearance <= 0 || actor.resources.hull <= 0) break;
  }
  return { actor, capacity, recoveredPower, minClearance, enteredField };
}

describe("solar recovery in mounted flight", () => {
  for (const radius of [36, 140]) {
    for (const start of ["orbit", "outward", "rest", "rest-side"] as const) {
      it(`charges and resumes from ${start} at radius ${radius}`, () => {
        const { actor, capacity, recoveredPower, minClearance, enteredField } =
          flyRecovery(radius, start);
        expect(enteredField).toBe(true);
        expect(minClearance).toBeGreaterThan(0);
        expect(actor.resources.hull).toBeGreaterThan(0);
        expect(recoveredPower).toBeGreaterThanOrEqual(capacity * 0.8);
        expect(actor.objective).toBe("pursue");
      });
    }
  }
});

it("prefers a clear departure when a planet blocks forward thrust", () => {
  const star = createStar("G", 960, 540);
  applyYellowFamilyProfile(star, 36, GRAVITY_TUNING);
  const actor = createPirate(0);
  actor.objective = "recover";
  actor.resources.power = 19;
  actor.ship.pos.set(star.pos.x + solarField(star).reach + 10, star.pos.y);
  actor.ship.vel.set(0, 0);
  actor.ship.rotation = Math.PI;
  const target = createPirate(1).ship;
  const planet = initializePlanets(960, 540)[0];
  planet.radius = 3;
  planet.mass = 0;
  planet.massWell = undefined;
  planet.well = undefined;
  planet.orbitCenter.set(actor.ship.pos.x - 30, actor.ship.pos.y);
  planet.orbitRadius = 0;
  planet.orbitSpeed = 0;
  planet.pos.set(planet.orbitCenter.x, planet.orbitCenter.y);
  const clear = planPirate(actor, target, star, []);
  const blocked = planPirate(actor, target, star, [planet]);
  expect(clear.command.leftThruster && clear.command.rightThruster).toBe(true);
  expect(blocked.command.leftThruster && blocked.command.rightThruster).toBe(
    false,
  );
  expect(
    Math.min(
      ...blocked.path.map((p) =>
        Math.hypot(p.x - planet.pos.x, p.y - planet.pos.y),
      ),
    ),
  ).toBeGreaterThan(planet.radius + actor.ship.radius);
});
