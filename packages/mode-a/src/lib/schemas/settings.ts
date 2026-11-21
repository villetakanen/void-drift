import { z } from "zod";

export const SettingsSchema = z.object({
  invertControls: z.boolean(),
  combatHud: z.boolean().default(true),
  speedCamera: z.boolean().default(false),
});

export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  invertControls: true,
  combatHud: true,
  speedCamera: false,
};

/** Player choice for exposing content outside the scored catalog. */
export const ExperimentalSettingSchema = z.enum(["Off", "On"]).default("Off");
export type ExperimentalSetting = z.infer<typeof ExperimentalSettingSchema>;
