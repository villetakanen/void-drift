export const TURBULENT_BLOOM_DEFAULTS = {
  glowSize: 12,
  distortion: 16,
  strength: 90,
} as const;

export type TurbulentBloomSettings = {
  glowSize: number;
  distortion: number;
  strength: number;
};
