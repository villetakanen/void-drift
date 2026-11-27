import { PARTS, PartSchema } from "@void-drift/mode-a";

/** Pre-ignition model retained for the historical studies and continuous-motion instrument. */
export const LEGACY_FISSION = PartSchema.parse({
  id: "fusion",
  releaseClass: "preview",
  name: "Fission",
  description: "+17 u/s to ship cruise ceiling.",
  category: "E",
  mass: 16,
  thrust: 48000,
  speedContribution: 17,
  limit: 550,
  draw: 3,
  response: "pulse",
});
export const LEGACY_PARTS = { ...PARTS, fusion: LEGACY_FISSION };
