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
  opening: { burn: "course", view: "1x", tick: 30 },
});

// Same atmosphere and ship: change approach clearance only for the heat study.
export const HEAT_APPROACHES = ["Outside", "Skim", "Deeper", "02.15 pass"];
export function heatStart(approach: string) {
  const offset =
    approach === "Outside"
      ? 88
      : approach === "Skim"
        ? 84
        : approach === "Deeper"
          ? 80
          : 82;
  if (!ROCK_ATMOSPHERE_SCENE.start) throw new Error("Atmosphere start missing");
  return {
    ...ROCK_ATMOSPHERE_SCENE.start,
    x: 960 + PRACTICE_VENUS_ORBIT - offset,
  };
}
export const ROCK_HEAT_SCENE = FlightSceneDocumentSchema.parse({
  ...ROCK_ATMOSPHERE_SCENE,
  start: heatStart("Skim"),
  opening: { ...ROCK_ATMOSPHERE_SCENE.opening, tick: 27 },
});
