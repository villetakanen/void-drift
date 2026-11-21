import { gameSettings, Simulation } from "@void-drift/mode-a";
import { describe, expect, it } from "vitest";
import { enumerateFlightContacts } from "./flight-contacts";

describe("live flight contact roster", () => {
  it("keeps the Sun and live pirates, intact wrecks and free cells only", () => {
    const simulation = new Simulation({
      ...gameSettings("fighter"),
      mode: "gauntlet",
    });
    const actor = simulation.opponents[0];
    actor.lifecycle = "active";
    const salvage = simulation.salvage;
    if (!salvage) throw new Error("Expected Gauntlet salvage");
    const body = (
      id: number,
      kind: "wreck" | "fragment" | "cell",
      x: number,
      hull = 1,
    ) => ({
      id,
      group: id,
      kind,
      x,
      y: 2000,
      previousX: x,
      previousY: 2000,
      vx: 0,
      vy: 0,
      radius: 5,
      hull,
      life: 10,
      rotation: 0,
    });
    const wreck = body(101, "wreck", 2000);
    const fragment = body(102, "fragment", 2100);
    const cell = body(103, "cell", 2200);
    const destroyed = body(104, "wreck", 2300, 0);
    const depletedCell = body(105, "cell", 2400, 0);
    salvage.bodies.push(wreck, fragment, cell, destroyed, depletedCell);
    expect(
      enumerateFlightContacts(simulation).map(({ kind, id }) => [kind, id]),
    ).toEqual([
      ["sun", "sun"],
      ["pirate", actor.id],
      ["wreck", 101],
      ["cell", 103],
    ]);
    actor.lifecycle = "destroyed";
    salvage.bodies.splice(salvage.bodies.indexOf(wreck), 1);
    salvage.bodies.splice(salvage.bodies.indexOf(cell), 1);
    expect(enumerateFlightContacts(simulation).map(({ kind }) => kind)).toEqual(
      ["sun"],
    );
  });
});
