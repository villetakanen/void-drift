import {
  SKY_BANK,
  SKY_TILE_PERIOD,
  type SkyMaterial,
  SOL_DUST_SEED,
} from "@void-drift/core";
import { SolarSystemGenerationSchema } from "./schemas/solar-system";

export interface SkySightline extends SkyMaterial {
  heading: number;
  scale: number;
  /** Bank position relative to stage centre, in logical pixels at the reference pose. */
  offsetX: number;
  offsetY: number;
}
export const SOL_SKY: Readonly<SkySightline> = {
  reach: 0.5,
  dustSeed: SOL_DUST_SEED,
  heading: 10,
  scale: 1,
  // Reference tile bank (0.37, 0.394), 02.12 origin (715, 995), stage 1728 × 1080.
  offsetX: SKY_BANK.x * SKY_TILE_PERIOD - 715 - 864,
  offsetY: SKY_BANK.y * SKY_TILE_PERIOD - 995 - 540,
};

/** Each channel is independently keyed; selecting a sky consumes no gameplay randomness. */
export function systemSky(seed: number): SkySightline {
  SolarSystemGenerationSchema.shape.seed.parse(seed);
  const channel = (index: number) => {
    let n = seed ^ Math.imul(index, 0x9e3779b9);
    n = Math.imul(n ^ (n >>> 16), 0x21f0aaad);
    n = Math.imul(n ^ (n >>> 15), 0x735a2d97);
    return ((n ^ (n >>> 15)) >>> 0) / 4294967296;
  };
  return {
    reach: channel(1),
    dustSeed: 1 + Math.floor(channel(2) * 2147483647),
    heading: channel(3) * 360,
    scale: 0.8 + channel(4) * 0.4,
    offsetX: (channel(5) - 0.5) * 720,
    offsetY: (channel(6) - 0.5) * 400,
  };
}
