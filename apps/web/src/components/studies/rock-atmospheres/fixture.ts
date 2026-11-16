import {
  PRACTICE_VENUS_ORBIT,
  PRACTICE_VENUS_TRAVEL_SPEED,
  starterLoadout,
} from "@void-drift/mode-a";
import { FlightSceneDocumentSchema } from "../../../lib/flight-scene/config";
import { AIR_DEPTH, DRAG_RATE } from "./atmosphere";

/** Shared with the replay check so it exercises the study's actual approach. */
export const ROCK_ATMOSPHERE_SCENE = FlightSceneDocumentSchema.parse({
  loadout: starterLoadout("wasp"),
  planet: {
    reference: "practice-venus",
    orbitAngle: 0,
    atmosphere: { depth: AIR_DEPTH, dragRate: DRAG_RATE },
  },
  start: {
    x: 960 + PRACTICE_VENUS_ORBIT - 82,
    y: 440,
    rotation: Math.PI / 2,
    velocity: { x: 0, y: 230 + PRACTICE_VENUS_TRAVEL_SPEED },
  },
  follow: { near: 0.8, far: 4 },
  opening: { burn: "course", view: "follow", tick: 30 },
});
