import { z } from "astro/zod";
import { GAME_GUTTER_PX } from "../../../lib/game-screen";
import { BURN_WIDTH_RATIO } from "../../controls/thrust-pads";

export const palette = {
  Surface: "--color-elev-3",
  Selected: "--color-selected",
  Warning: "--color-resource-warning",
  Alert: "--color-alert",
  Caution: "--color-caution-tape",
  Hull: "--color-resource-hull",
  Text: "--color-text",
  Muted: "--color-text-muted",
  Void: "--color-void",
} as const;
const color = z.enum([
  "Surface",
  "Selected",
  "Warning",
  "Alert",
  "Caution",
  "Hull",
  "Text",
  "Muted",
  "Void",
]);
export const AppearanceSchema = z.object({
  tint: color,
  opacity: z.number().min(0).max(100),
  border: color,
  borderWidth: z.number().min(0).max(4),
  borderOpacity: z.number().min(0).max(100),
  borderStyle: z.enum(["Solid", "Dashed"]),
  stripeSide: z.enum(["None", "Left", "Right", "Both", "Full"]),
  stripeColor: color,
  stripeOpacity: z.number().min(0).max(100),
  stripeWidth: z.number().min(4).max(36),
  stripeSpacing: z.number().min(4).max(20),
  stripeWeight: z.number().min(1).max(6),
  stripeDirection: z.enum(["/", "\\"]),
  textColor: color,
  line1: z.string().max(32),
  line2: z.string().max(32),
});
export const FlapConfigSchema = z.object({
  version: z.literal(1),
  width: z
    .number()
    .min(GAME_GUTTER_PX.side * BURN_WIDTH_RATIO)
    .max(GAME_GUTTER_PX.side),
  height: z.number().min(44).max(160),
  gap: z.number().min(0).max(48),
  inset: z.number().min(0).max(32),
  topAngle: z.number().min(0).max(30),
  textSize: z.number().min(10).max(20),
  lineGap: z.number().min(12).max(28),
  textInset: z.number().min(30).max(110),
  textOffset: z.number().min(-24).max(24),
  alignment: z.enum(["start", "middle", "end"]),
  bold: z.boolean(),
  states: z.object({
    On: AppearanceSchema,
    Off: AppearanceSchema,
    Alert: AppearanceSchema,
  }),
});
export type FlapConfig = z.infer<typeof FlapConfigSchema>;
export type Appearance = z.infer<typeof AppearanceSchema>;
export type WeaponState = keyof FlapConfig["states"];
export const token = (name: keyof typeof palette) => `var(${palette[name]})`;
