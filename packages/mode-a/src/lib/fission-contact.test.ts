import { describe, expect, it } from "vitest";
import { buildMounts, buildNozzlePose } from "./build-renderer";
import { FissionFlight, sweepFissionFront } from "./fission-contact";
import type { SalvageBody } from "./salvage";
import { defaultLoadout } from "./schemas/loadout";
import { Simulation, STEP, stockSettings } from "./simulation";
import { PLAYER_BODY_ID } from "./targeting";

const idle = { leftThruster: false, rightThruster: false, fire: false };
const drive = { ...idle, leftThruster: true, rightThruster: true };
const ignition = {
  tick: 0,
  carrierId: PLAYER_BODY_ID,
  mountKey: "left",
  x: 0,
  y: 0,
  exhaustAngle: 0,
};

function target(id: number, x: number, y: number): SalvageBody {
  return {
    id,
    group: id,
    kind: "ship",
    x,
    y,
    previousX: x,
    previousY: y,
    vx: 0,
    vy: 0,
    radius: 2,
    hull: 20,
    rotation: 0,
  };
}

function setup(mode: "gauntlet" | "derelicts") {
  const loadout = {
    ...defaultLoadout("wasp"),
    side: "fusion" as const,
    stabilizers: false,
  };
  const sim = new Simulation({
    ...stockSettings("wasp"),
    loadout,
    mode,
    experimental: "On",
  });
  sim.planets.length = 0;
  sim.star.influenceRadius = 0;
  sim.ship.rotation = 0;
  const mount = buildMounts(loadout).find((mount) => mount.part === "fusion");
  if (!mount) throw new Error("Expected Fission mount");
  const nozzle = buildNozzlePose(loadout, mount);
  sim.start();
  expect(sim.toggleWeapons()).toBe(true);
  expect(sim.weaponsChoice).toBe("off");
  return { sim, x: sim.ship.pos.x + nozzle.x, y: sim.ship.pos.y + nozzle.y };
}

function fly(sim: Simulation) {
  sim.step(drive);
  const contacts = [...sim.fissionContacts];
  for (let i = 1; i < 33; i++) {
    sim.step(idle);
    contacts.push(...sim.fissionContacts);
  }
  return contacts;
}

describe("Fission contacts", () => {
  it("sweeps a fast crossing, respects extent at a fan edge, and leaves no filled cone behind", () => {
    const crossing = sweepFissionFront(80, -150, 0, 300, 2, 79, 82);
    expect(crossing?.t).toBeGreaterThan(0.4);
    expect(crossing?.t).toBeLessThan(0.5);
    // Center outside the fan, but its extent touches the outer corner.
    expect(sweepFissionFront(80, 24, 0, 0, 3, 81, 85)).not.toBeNull();
    expect(sweepFissionFront(80, 24, 0, 0, 1, 81, 85)).toBeNull();
    expect(sweepFissionFront(10, 0, 0, 0, 2, 79, 82)).toBeNull();
  });

  it("does not hit a ship whose arena wrap chord crosses the fan", () => {
    const flight = new FissionFlight();
    flight.launch(ignition, STEP);
    // Ship adapters keep the pre-wrap position and store the destination
    // separately. Both sides of the wrap are well outside the front's reach.
    const ship = {
      ...target(PLAYER_BODY_ID + 1, 800, 0),
      sweepEndX: -800,
      sweepEndY: 0,
    };
    flight.resolve(0.2, 0.2 + STEP / 4, [ship], (body, contact) => {
      body.hull -= contact.damage;
    });
    expect(flight.contacts).toEqual([]);
    expect(ship.hull).toBe(20);
  });

  it("uses the launch pose twice with Weapons Off against a Gauntlet hostile", () => {
    const { sim, x, y } = setup("gauntlet");
    const pirate = sim.opponent;
    if (!pirate) throw new Error("Expected hostile");
    pirate.ship.pos.set(x - 70, y);
    pirate.ship.vel.set(0, 0);
    const hull = pirate.resources.hull;
    const contacts = fly(sim);
    expect(contacts.map((contact) => contact.front)).toEqual([0, 1]);
    // The pirate moves between crossings, so the contact times need not
    // differ by exactly one tick even though the launch times do.
    expect(contacts[1].time).toBeGreaterThan(contacts[0].time);
    expect(contacts[0].ignition).toMatchObject({
      x,
      y,
      carrierId: PLAYER_BODY_ID,
    });
    expect(contacts[1].ignition).toEqual(contacts[0].ignition);
    expect(pirate.resources.hull).toBeCloseTo(hull - 6);
  });

  it("damages a derelict independent of camera settings and stops after a lethal front", () => {
    const run = (padding: number) => {
      const { sim, x, y } = setup("derelicts");
      sim.settings.camera.padding = padding;
      if (!sim.salvage) throw new Error("Expected salvage encounter");
      const wreck = {
        ...target(300, x - 75, y),
        kind: "wreck" as const,
        hull: 3,
      };
      sim.salvage.bodies.push(wreck);
      const contacts = fly(sim);
      expect(sim.salvage.playerKills).toBe(1);
      expect(
        contacts.map((contact) => [contact.targetId, contact.front]),
      ).toEqual([[wreck.id, 0]]);
      return contacts;
    };
    expect(run(40)).toEqual(run(320));
  });

  it("ignores the carrier and drones, and permits four contacts from two paid nozzles", () => {
    const flight = new FissionFlight();
    flight.launch(ignition, STEP);
    flight.launch({ ...ignition, mountKey: "right" }, STEP);
    const victim = target(PLAYER_BODY_ID + 1, 35, 0);
    const bodies = [
      target(PLAYER_BODY_ID, 35, 0),
      { ...target(5, 35, 0), carrierId: PLAYER_BODY_ID },
      { ...target(6, 35, 0), carrierId: PLAYER_BODY_ID + 1 },
      target(7, 170, 0),
      victim,
    ];
    for (let i = 0; i < 40; i++)
      flight.resolve(i * STEP, (i + 1) * STEP, bodies, (body, contact) => {
        body.hull -= contact.damage;
      });
    expect(
      flight.contacts.map((contact) => [contact.targetId, contact.front]),
    ).toEqual([
      [victim.id, 0],
      [victim.id, 0],
      [victim.id, 1],
      [victim.id, 1],
    ]);
    expect(flight.contacts[2].time - flight.contacts[0].time).toBeCloseTo(
      STEP,
      10,
    );
    expect(victim.hull).toBe(8);
    expect(flight.active).toBe(false);
  });
});
