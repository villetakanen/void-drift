import { defaultLoadout } from "@void-drift/mode-a";
import type { z } from "astro/zod";
import type { FlightSceneDocumentSchema } from "./config";

// The default document, and the Lab reference: the starter Wasp with a Light
// Ion Cannon on its first hull mount, at the run start, with two wrecks placed
// ahead of it and a held one available.
const loadout = defaultLoadout("wasp");
loadout.stabilizers = true;
loadout.hull[0] = "light-ion-cannon";

export const STARTER_FLIGHT_SCENE = {
  loadout,
  start: { x: 460, y: 540, rotation: -Math.PI / 2 },
  targets: [
    { x: 460, y: 340 },
    { x: 520, y: 120 },
  ],
  held: { distance: 140, shardLife: 2 },
  follow: { near: 1.6, far: 4 },
  opening: { burn: "course", view: "follow", tick: 180 },
} satisfies z.input<typeof FlightSceneDocumentSchema>;
