// Sanctioned copy comes from the catalog; unsanctioned drafts remain study-local.
import { PARTS, type PartId } from "@void-drift/mode-a";

export const PART_PROSE: Record<PartId, string> = {
  "light-ion-cannon": PARTS["light-ion-cannon"].fluff,
  "ion-point-defence": PARTS["ion-point-defence"].fluff,
  rail: "Heavy slug down the barrel line. Kicks the ship back.",
  laser: "Fast turret. Burns incoming debris before wrecks.",
  battery: PARTS.battery.fluff,
  "heavy-well": PARTS["heavy-well"].fluff,
  coil: "Draws more charge from sunlight.",
  "gravity-coil": PARTS["gravity-coil"].fluff,
  ion: PARTS.ion.fluff,
  "heavy-ion": PARTS["heavy-ion"].fluff,
  fusion: "Thrust in hard pulses. Fast, and never smooth.",
  plasma: "Charges, then holds a strong burn. Commit first.",
};
