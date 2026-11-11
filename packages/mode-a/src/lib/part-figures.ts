import { GRAVITY_COLLECTION } from "./gravity-collection";
import { PARTS, type PartId } from "./schemas/loadout";
import { ION_CANNON, POINT_DEFENCE, WEAPONS } from "./schemas/salvage";

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

export function partFigures(id: PartId): Figure[] {
  const part = PARTS[id];
  const mass: Figure = {
    icon: "mass",
    value: String(part.mass),
    label: "mass",
  };
  if (part.category === "E")
    return [
      mass,
      {
        icon: "thrust",
        value: Math.round(part.thrust).toLocaleString("en"),
        label: "thrust",
      },
      {
        icon: "energy",
        value: `${trim(part.draw)}/s`,
        label: "energy per second",
      },
      {
        icon: "cruise",
        value: `+${part.speedContribution}`,
        label: "units per second added to the cruise ceiling",
      },
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
