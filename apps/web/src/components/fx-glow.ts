import { FX_GLOW_BACKING_DIVISOR } from "@void-drift/mode-a";

export const FX_GLOW_BLEND = "screen";
export const FX_GLOW_OPACITY = 0.9;

export const DEFAULT_FX_GLOW = {
  value: "low-res-css-glow",
  label: "Low-res CSS glow",
  filter: "blur(12px)",
} as const;

export const FX_GLOW_TREATMENTS = [
  { value: "low-res-glow", label: "Low-res glow", filter: "none" },
  DEFAULT_FX_GLOW,
] as const;

export type FxGlowTreatment = (typeof FX_GLOW_TREATMENTS)[number];

export function fxGlowTreatment(value: string) {
  return FX_GLOW_TREATMENTS.find((treatment) => treatment.value === value);
}

export function describeFxGlow(treatment: FxGlowTreatment) {
  return `1/${FX_GLOW_BACKING_DIVISOR} backing per axis, Screen blend, ${Math.round(FX_GLOW_OPACITY * 100)}% opacity, glow CSS filter ${treatment.filter}`;
}
