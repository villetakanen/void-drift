import { defaultLoadout } from "@void-drift/mode-a";
import type { InstrumentConfig } from "./config";

const wasp = defaultLoadout("wasp");
const fighter = defaultLoadout("fighter");

/** The study's B2 fittings on live production parts, with no utility equipment. */
export const FISSION_COMPARISON = {
  version: 1,
  burn: "turn",
  paidIgnition: true,
  properties: {},
  vehicles: [
    { label: "Wasp ion", loadout: wasp },
    { label: "Wasp Fission", loadout: { ...wasp, side: "fusion" } },
    { label: "Fighter aft ion", loadout: { ...fighter, aft: ["ion", null] } },
    {
      label: "Fighter 1 aft Fission",
      loadout: { ...fighter, aft: ["fusion", null] },
    },
    {
      label: "Fighter 2 aft Fission",
      loadout: { ...fighter, aft: ["fusion", "fusion"] },
    },
    {
      label: "Fighter side Fission",
      loadout: { ...fighter, side: "fusion", aft: ["ion", null] },
    },
  ],
} satisfies InstrumentConfig;
