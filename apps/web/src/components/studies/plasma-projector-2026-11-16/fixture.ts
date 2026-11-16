import { buildStats, defaultLoadout } from "@void-drift/mode-a";
import { FlightSceneDocumentSchema } from "../../../lib/flight-scene";

const loadout = defaultLoadout("wasp");
loadout.stabilizers = true;
export const RELEASE = 156;
export const scene = FlightSceneDocumentSchema.parse({
  loadout,
  start: { x: 100, y: 1050, rotation: -Math.PI / 2 },
  targets: [],
  impulses: [
    { tick: RELEASE, backwardMomentum: buildStats(loadout).mass * 95 },
  ],
  follow: { near: 1.6, far: 4 },
  opening: { burn: "course", view: "follow", tick: 72 },
});

/** Proposed exhaust centreline, in ship-local world units. */
export function exhaustPoint(progress: number, side: number) {
  return { x: 20 + 170 * progress, y: side * (13 + 145 * progress * progress) };
}
