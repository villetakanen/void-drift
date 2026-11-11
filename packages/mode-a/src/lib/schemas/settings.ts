import { z } from "zod";

export const SettingsSchema = z.object({
  invertControls: z.boolean(),
});

export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  invertControls: true,
};

/** Player choice for exposing content outside the scored catalog. */
export const ExperimentalSettingSchema = z.enum(["Off", "On"]).default("Off");
export type ExperimentalSetting = z.infer<typeof ExperimentalSettingSchema>;
