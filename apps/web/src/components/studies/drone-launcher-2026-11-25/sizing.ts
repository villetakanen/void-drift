import { z } from "astro/zod";
import suppliedSizing from "../../../../public/studies/drone-launcher-2026-11-25/02-2-sizing.json";

export const FittingSchema = z.enum([
  "Launcher",
  "Ion cannon",
  "Plasma rifle",
  "Empty",
]);
export const SizingSchema = z.object({
  version: z.literal(1),
  length: z.number().min(8).max(48),
  anchorPercent: z.number().min(50).max(95),
  zoom: z.number().min(4).max(10),
  slots: z.tuple([FittingSchema, FittingSchema, FittingSchema, FittingSchema]),
});
export type Sizing = z.infer<typeof SizingSchema>;
export const initialSizing = (): Sizing => SizingSchema.parse(suppliedSizing);

export const MasterSchema = z.object({
  bounds: z.tuple([
    z.number(),
    z.number(),
    z.number().positive(),
    z.number().positive(),
  ]),
  faces: z
    .array(
      z.object({
        fill: z.union([
          z.string().regex(/^#[0-9a-f]{6}$/i),
          z.literal("url(#ion-exhaust-gradient)"),
        ]),
        path: z.string().min(1),
      }),
    )
    .min(1),
});
