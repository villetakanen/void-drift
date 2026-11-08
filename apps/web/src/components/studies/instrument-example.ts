import type { BurnId } from "./burns";
import { calculate, InstrumentConfig } from "./lab-instrument-config";
import type { PathSeries } from "./path-instrument";

// Study fixture shared by the component examples (02.8 onwards): the 02.7
// document on B1. Each vehicle keeps its colour across every diagram.
const COLORS = ["#5ce5e7", "#ffbd69", "#ff7aa8"];
const fighter = (aft: [string | null, string | null]) => ({
  version: 2,
  chassis: "fighter",
  side: "ion",
  stabilizers: true,
  hull: [null, null],
  aft,
});
const doc = InstrumentConfig.parse({
  version: 1,
  vehicles: [
    { label: "Ion aft", loadout: fighter(["ion", "ion"]) },
    { label: "Plasma aft", loadout: fighter(["plasma", "plasma"]) },
    {
      label: "Plasma aft, more thrust",
      loadout: fighter(["plasma", "plasma"]),
      changes: { plasma: { thrust: 46000 } },
    },
  ],
});
/** The example vehicles calculated on one burn. */
export function seriesFor(burn: BurnId): PathSeries[] {
  return doc.vehicles.map((v, i) => ({
    label: v.label,
    color: COLORS[i],
    samples: calculate(v, burn),
  }));
}
export const exampleSeries: PathSeries[] = seriesFor(doc.burn);
/** The examples' time marker: 7 s. */
export const exampleTick = 7 * 60;
/** The instrument's logical screen; the examples scale to it like the instrument. */
export const SCREEN = { w: 1440, h: 900 };
