import { DRONE_RADIATION_DAMAGE, DRONE_WAVE_DAMAGE } from "./drone-flight";
import { GRAVITY_COLLECTION } from "./gravity-collection";
import { PARTS, type PaidIgnitionPart, type PartId } from "./schemas/loadout";
import {
  DRONE_LAUNCHER,
  ION_CANNON,
  POINT_DEFENCE,
  WEAPONS,
} from "./schemas/salvage";

export type FigureIcon =
  | "mass"
  | "thrust"
  | "energy"
  | "cruise"
  | "damage"
  | "reach"
  | "store";
export type Figure = { icon: FigureIcon; value: string; label: string };

const trim = (n: number) => String(Math.round(n * 100) / 100);
const perSecond = (bands: readonly number[], cooldown: number) =>
  `${Math.round(Math.min(...bands) / cooldown)}–${Math.round(Math.max(...bands) / cooldown)}/s`;
const weapon = (damage: string, energy: number, reach: number): Figure[] => [
  { icon: "damage", value: damage, label: "damage per second" },
  {
    icon: "energy",
    value: `${trim(energy)}/s`,
    label: "energy per second while firing",
  },
  { icon: "reach", value: String(reach), label: "reach in units" },
];

export function partFigures(partOrId: PartId | PaidIgnitionPart): Figure[] {
  const part = typeof partOrId === "string" ? PARTS[partOrId] : partOrId;
  const { id } = part;
  const mass: Figure = {
    icon: "mass",
    value: String(part.mass),
    label: "mass",
  };
  if (part.category === "E") {
    const paid = part.response === "paid-ignition";
    return [
      mass,
      {
        icon: "thrust",
        value: Math.round(paid ? part.impulse : part.thrust).toLocaleString(
          "en",
        ),
        label: paid ? "impulse per ignition per nozzle" : "thrust",
      },
      {
        icon: "energy",
        value: paid
          ? `${trim(part.energyPerIgnition)} E/ign`
          : `${trim(part.draw)}/s`,
        label: paid ? "energy per ignition per nozzle" : "energy per second",
      },
      {
        icon: "cruise",
        value: `+${part.speedContribution}`,
        label: "units per second added to the cruise ceiling",
      },
    ];
  }
  if (id === "drone-launcher")
    return [
      mass,
      ...weapon(
        `${trim(DRONE_WAVE_DAMAGE / DRONE_LAUNCHER.cooldown)}–${trim((DRONE_RADIATION_DAMAGE + DRONE_WAVE_DAMAGE) / DRONE_LAUNCHER.cooldown)}/s`,
        DRONE_LAUNCHER.energy / DRONE_LAUNCHER.cooldown,
        DRONE_LAUNCHER.range,
      ),
    ];
  if (id === "light-ion-cannon")
    return [
      mass,
      ...weapon(
        perSecond(ION_CANNON.bands, ION_CANNON.cooldown),
        ION_CANNON.energy / ION_CANNON.cooldown,
        ION_CANNON.range,
      ),
    ];
  if (id === "ion-point-defence")
    return [
      mass,
      ...weapon(
        perSecond(POINT_DEFENCE.bands, POINT_DEFENCE.cooldown),
        POINT_DEFENCE.energy / POINT_DEFENCE.cooldown,
        POINT_DEFENCE.reach,
      ),
    ];
  if (id === "rail" || id === "laser") {
    const shot = WEAPONS[id];
    return [
      mass,
      ...weapon(
        `${Math.round(shot.damage / shot.cooldown)}/s`,
        shot.energy / shot.cooldown,
        shot.range,
      ),
    ];
  }
  if (part.capacity > 0)
    return [
      mass,
      { icon: "store", value: `+${part.capacity}`, label: "energy capacity" },
    ];
  if (id === "gravity-coil")
    return [
      mass,
      {
        icon: "energy",
        value: `${trim(GRAVITY_COLLECTION.energyPerSecond)}/s`,
        label: "energy per second inside a planet’s gravity well",
      },
    ];
  if (part.solarMultiplier > 0)
    return [
      mass,
      {
        icon: "energy",
        value: `+${part.solarMultiplier}×`,
        label: "solar charging multiplier",
      },
    ];
  return [mass];
}
