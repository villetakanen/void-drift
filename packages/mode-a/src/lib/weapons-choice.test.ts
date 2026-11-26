import { describe, expect, it } from "vitest";
import { liveShipBody, type SalvageBody } from "./salvage";
import { defaultLoadout, type Loadout } from "./schemas/loadout";
import { gameSettings, Simulation, stockSettings } from "./simulation";

const still = { leftThruster: false, rightThruster: false, fire: false };

describe("run-local weapons choice", () => {
  it("toggles in Practice, ignores commands in an emergency, and resets on retry", () => {
    const loadout = defaultLoadout("wasp");
    loadout.hull[0] = "plasma-rifle";
    const settings = { ...stockSettings("wasp"), mode: "practice", loadout };
    const sim = new Simulation(settings);
    expect(sim.toggleWeapons()).toBe(false);
    sim.start();
    expect(sim.weaponsChoice).toBe("auto");
    expect(sim.toggleWeapons()).toBe(true);
    sim.state.resources.power = 10;
    expect(sim.weaponsEnergyEmergency).toBe(true);
    expect(sim.toggleWeapons()).toBe(false);
    sim.state.resources.power = 11;
    expect(sim.weaponsEnergyEmergency).toBe(false);
    expect(sim.weaponsChoice).toBe("off");
    expect(sim.toggleWeapons()).toBe(true);
    expect(sim.toggleWeapons()).toBe(true);
    expect(sim.weaponsChoice).toBe("off");
    const retry = new Simulation(settings);
    retry.start();
    expect(retry.weaponsChoice).toBe("auto");
  });

  it.each([true, false])(
    "leaves Survival passive with encounters: %s",
    (encounters) => {
      const sim = new Simulation({
        ...gameSettings("wasp"),
        mode: "survival",
        encounters,
      });
      sim.start();
      expect(sim.toggleWeapons()).toBe(false);
      expect(sim.weaponsChoice).toBe("auto");
    },
  );

  it.each<[Loadout["hull"], boolean]>([
    [["plasma-rifle", null, "battery"], false],
    [["light-ion-cannon", null, "battery"], true],
    [["ion-point-defence", "light-ion-cannon", "battery"], false],
    [["plasma-rifle", "light-ion-cannon", "battery"], false],
    [["rail", null, "battery"], false],
  ])(
    "reports emergency from the cheapest next debit for %j",
    (hull, atReserve) => {
      const loadout = defaultLoadout("corvette");
      loadout.hull = hull;
      const sim = new Simulation({
        ...stockSettings("corvette"),
        mode: "practice",
        loadout,
      });
      sim.start();
      sim.state.resources.power = 10.15;
      expect(sim.weaponsEnergyEmergency).toBe(atReserve);
      sim.state.resources.power = 10;
      expect(sim.weaponsEnergyEmergency).toBe(hull[0] !== "rail");
    },
  );

  it.each(["ion-point-defence", "laser"] as const)(
    "locks Derelicts at entry and suppresses %s and cannon fire in Off while keeping the target",
    (kind) => {
      const loadout = defaultLoadout("wasp");
      loadout.hull = [kind, "light-ion-cannon"];
      const sim = new Simulation({
        ...stockSettings("wasp"),
        mode: "derelicts",
        arrival: true,
        loadout,
      });
      const combat = sim.salvage;
      if (!combat) throw new Error("Missing salvage system");
      sim.star.pos.set(10000, 10000);
      sim.planets.splice(0);
      combat.nextPass = Infinity;
      sim.ship.vel.set(0, 0);
      sim.ship.rotation = Math.PI;
      sim.ship.pos.set(2140, 540);
      const target: SalvageBody = {
        ...liveShipBody(1, sim.ship, 10000, () => {}),
        kind: "wreck",
        x: 2070,
        previousX: 2070,
        radius: 20,
      };
      combat.bodies.push(target);
      sim.start();
      expect(sim.toggleWeapons()).toBe(false);
      sim.step(still);
      expect(combat.energySpent).toBe(0);
      sim.ship.pos.set(2070, 540);
      target.x = 2000;
      target.previousX = 2000;
      sim.step(still);
      expect(combat.ionDischarges).toBeGreaterThan(0);
      expect(sim.toggleWeapons()).toBe(true);
      for (const weapon of combat.weapons) weapon.readyAt = 0;
      const spent = combat.energySpent;
      for (let i = 0; i < 40; i++) sim.step(still);
      expect(combat.energySpent).toBe(spent);
      expect(combat.weapons.map((weapon) => weapon.readyAt)).toEqual([0, 0]);
      expect(
        combat.weapons.find((weapon) => weapon.kind === kind)?.target,
      ).toBe(target.id);
      const turretShots = () =>
        kind === "laser" ? combat.laserPulses : combat.pointDefenceDischarges;
      const before = turretShots();
      const cannonShots = combat.ionDischarges;
      expect(sim.toggleWeapons()).toBe(true);
      sim.step(still);
      expect(turretShots()).toBeGreaterThan(before);
      expect(combat.ionDischarges).toBeGreaterThan(cannonShots);
    },
  );
});
