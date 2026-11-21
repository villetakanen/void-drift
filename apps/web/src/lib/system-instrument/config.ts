import { SolarSystemGenerationSchema } from "@void-drift/mode-a";

export const SystemInstrumentDocumentSchema = SolarSystemGenerationSchema.pick({
  seed: true,
});
export const DEFAULT_SYSTEM_SEED = 2026;
const MAX_SEED = 2147483647;

/** Choose an input seed only; production owns every derived world property. */
export function randomSystemSeed(current: number, draft?: number): number {
  const value = crypto.getRandomValues(new Uint32Array(1))[0];
  let seed = (value % MAX_SEED) + 1;
  while (seed === current || seed === draft) seed = (seed % MAX_SEED) + 1;
  return seed;
}
