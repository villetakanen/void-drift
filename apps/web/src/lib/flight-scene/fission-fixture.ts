import { defaultLoadout } from "@void-drift/mode-a";
import type { z } from "zod";
import type { FlightSceneDocumentSchema } from "./config";

export const FISSION_REST_TICKS = 12;
/** Display tick of the second front's first crossing, for both fittings. */
export const FISSION_CONTACT_TICK = 25;

/** Same encounter, hull and side engines. Only the second aft mount changes. */
export const FISSION_SCENES = ["Single aft", "Paired aft"].map(
  (label, index) => ({
    label,
    document: {
      loadout: {
        ...defaultLoadout("fighter"),
        aft: ["fusion", index === 0 ? null : "fusion"],
      },
      start: { x: 460, y: 540, rotation: 0 },
      targets: [{ x: 355, y: 540 }],
      wreckSpin: 0,
      encounter: { restTicks: FISSION_REST_TICKS },
      opening: { burn: "course", view: "2x", tick: FISSION_REST_TICKS + 1 },
    } satisfies z.input<typeof FlightSceneDocumentSchema>,
  }),
);
