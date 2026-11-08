import {
  defaultLoadout,
  type Loadout,
  LoadoutSchema,
} from "@void-drift/mode-a";

// The four given ships (docs/specs/gravity-tuning.md, "The ships"): game
// loadouts with empty hulls; the bench offers no ship option.
function ship(chassis: Loadout["chassis"], aft: Loadout["aft"]): Loadout {
  return LoadoutSchema.parse({ ...defaultLoadout(chassis), aft });
}

export const GRAVITY_TUNING_SHIPS: { label: string; loadout: Loadout }[] = [
  { label: "Wasp", loadout: ship("wasp", []) },
  { label: "Fighter", loadout: ship("fighter", [null, null]) },
  { label: "Fighter, aft ions", loadout: ship("fighter", ["ion", "ion"]) },
  {
    label: "Corvette, aft ions",
    loadout: ship("corvette", ["ion", "ion", null]),
  },
];
