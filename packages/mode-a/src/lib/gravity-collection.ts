import {
  type GameObject,
  getPlanetInfluenceRadius,
  type Planet,
} from "@void-drift/core";
import { z } from "zod";
import { fittedParts, type Loadout } from "./schemas/loadout";
export const GravityCollectionSchema = z.object({
  energyPerSecond: z.number().positive(),
  fadeSeconds: z.number().positive(),
});
export const GRAVITY_COLLECTION = GravityCollectionSchema.parse({
  energyPerSecond: 1,
  fadeSeconds: 0.25,
});
/** One field supplies every coil; overlapping wells never multiply collection. */
export function gravitySource(ship: GameObject, planets: readonly Planet[]) {
  let nearest: Planet | undefined;
  let distance = Infinity;
  for (const planet of planets) {
    const d = Math.hypot(ship.pos.x - planet.pos.x, ship.pos.y - planet.pos.y);
    if (d < getPlanetInfluenceRadius(planet) && d < distance) {
      nearest = planet;
      distance = d;
    }
  }
  return nearest;
}
export function gravityCollectionRate(loadout: Loadout) {
  return (
    fittedParts(loadout).filter((id) => id === "gravity-coil").length *
    GRAVITY_COLLECTION.energyPerSecond
  );
}
