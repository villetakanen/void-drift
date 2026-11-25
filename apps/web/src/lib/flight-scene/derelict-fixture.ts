import { STARTER_FLIGHT_SCENE } from "./starter";

export const DERELICT_INSTRUMENT_SCENE = {
  ...STARTER_FLIGHT_SCENE,
  loadout: {
    ...STARTER_FLIGHT_SCENE.loadout,
    hull: ["ion-point-defence", ...STARTER_FLIGHT_SCENE.loadout.hull.slice(1)],
  },
  start: { x: 960, y: -360, rotation: -Math.PI / 2 },
  targets: [{ x: 960, y: -440 }],
  encounter: { restTicks: 840 },
  opening: { burn: "course", view: "2x", tick: 0 },
};
