import type { Simulation } from "@void-drift/mode-a";
export type FlightContactKind = "pirate" | "sun" | "wreck" | "cell";
export interface FlightContactCue {
  kind: FlightContactKind;
  id: string | number;
  name: string;
  x: number;
  y: number;
  centerX: number;
  centerY: number;
  angle: number;
  radius: number;
  arcLength: number;
}

export interface WorldFlightContact {
  readonly kind: FlightContactKind;
  readonly id: string | number;
  readonly name: string;
  readonly x: number;
  readonly y: number;
}

/** Read-only live roster; transient fragments and contained/non-free salvage are excluded. */
export function enumerateFlightContacts(
  simulation: Simulation,
): readonly WorldFlightContact[] {
  const contacts: WorldFlightContact[] = [
    {
      kind: "sun",
      id: "sun",
      name: "Sun",
      x: simulation.star.pos.x,
      y: simulation.star.pos.y,
    },
  ];
  for (const actor of simulation.opponents) {
    if (actor.lifecycle !== "destroyed")
      contacts.push({
        kind: "pirate",
        id: actor.id,
        name: "Pirate",
        x: actor.ship.pos.x,
        y: actor.ship.pos.y,
      });
  }
  for (const body of simulation.salvage?.bodies ?? []) {
    if (body.kind === "wreck" && body.hull > 0)
      contacts.push({
        kind: "wreck",
        id: body.id,
        name: "Wreck",
        x: body.x,
        y: body.y,
      });
    else if (body.kind === "cell" && body.hull > 0)
      contacts.push({
        kind: "cell",
        id: body.id,
        name: "Energy cell",
        x: body.x,
        y: body.y,
      });
  }
  return contacts;
}

export function projectFlightContacts(
  simulation: Simulation,
  project: (
    x: number,
    y: number,
    distance: number,
  ) => Omit<FlightContactCue, "kind" | "id" | "name"> | null,
): readonly FlightContactCue[] {
  const cues: FlightContactCue[] = [];
  for (const contact of enumerateFlightContacts(simulation)) {
    const distance = Math.hypot(
      contact.x - simulation.ship.pos.x,
      contact.y - simulation.ship.pos.y,
    );
    const placement = project(contact.x, contact.y, distance);
    if (placement) cues.push({ ...contact, ...placement });
  }
  return cues;
}
