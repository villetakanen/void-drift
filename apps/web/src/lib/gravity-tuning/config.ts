import { massWellReach } from "@void-drift/core";
import { z } from "astro/zod";
import { BURN_IDS } from "../instrument/burns";
import { EnergyAnalysis } from "../instrument/energy";

// The Gravity tuning bench's document (docs/specs/gravity-tuning.md): the burn
// drawn and the bench's four settings. Ships and burns are not settings.
export const GravityWell = z
  .object({
    x: z.number().finite().min(-10000).max(10000).default(1000),
    y: z.number().finite().min(-10000).max(10000).default(150),
    strength: z.number().finite().positive().max(100000).default(2400),
    cutoff: z.number().finite().positive().max(10000).default(50),
    falloff: z.enum(["inverse-square", "inverse"]).default("inverse-square"),
    radius: z.number().finite().positive().max(10000).default(40),
  })
  .strict()
  .refine(
    (well) =>
      well.radius < massWellReach(well.strength, well.cutoff, well.falloff),
    {
      message: "The body radius must be smaller than the reach",
      path: ["radius"],
    },
  );
export type GravityWell = z.infer<typeof GravityWell>;

export const GravityTuningConfig = z
  .object({
    version: z.literal(1),
    burn: z.enum(BURN_IDS).default("course"),
    startSpeed: z.number().finite().min(0).max(1000).default(0),
    well: GravityWell.default({}),
    energy: EnergyAnalysis.optional(),
  })
  .strict();
export type GravityTuningConfig = z.infer<typeof GravityTuningConfig>;

/** The bench's opening document. */
export const DEFAULT_DOCUMENT = GravityTuningConfig.parse({ version: 1 });

/** Applies an edit to a copy; keeps it only if the result is a valid document. */
export function editGravityTuning(
  doc: GravityTuningConfig,
  edit: (draft: GravityTuningConfig) => void,
): { ok: true; doc: GravityTuningConfig } | { ok: false; message: string } {
  const draft = structuredClone(doc);
  edit(draft);
  const parsed = GravityTuningConfig.safeParse(draft);
  return parsed.success
    ? { ok: true, doc: parsed.data }
    : {
        ok: false,
        message: parsed.error.issues.map((i) => i.message).join("; "),
      };
}

/** The bench's settings, in the pane's order, with their document paths. */
export const SETTINGS = [
  { key: "startSpeed", label: "Starting speed", unit: "u/s along +x" },
  { key: "well.strength", label: "Well strength", unit: "mass" },
  {
    key: "well.cutoff",
    label: "Cut-off pull",
    unit: "u/s², the reach ends here",
  },
  { key: "well.radius", label: "Body radius", unit: "u" },
  { key: "well.x", label: "Well x", unit: "u" },
  { key: "well.y", label: "Well y", unit: "u" },
] as const;
export type SettingKey = (typeof SETTINGS)[number]["key"];
type NumericWellKey = Exclude<keyof GravityWell, "falloff">;
export function settingValue(doc: GravityTuningConfig, key: SettingKey) {
  return key === "startSpeed"
    ? doc.startSpeed
    : doc.well[key.slice(5) as NumericWellKey];
}
export function setSetting(
  doc: GravityTuningConfig,
  key: SettingKey,
  value: number,
) {
  if (key === "startSpeed") doc.startSpeed = value;
  else doc.well[key.slice(5) as NumericWellKey] = value;
}
