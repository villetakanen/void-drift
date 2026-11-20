import { z } from "zod";

const positive = z.number().finite().positive();
const orbit = {
  radius: positive,
  orbitRadius: positive,
  travelSpeed: positive,
};
const color = z.string().regex(/^#[0-9a-f]{6}$/i);

/** Fixed Practice system configuration; distances are world units, time seconds. */
export const PracticeSystemSchema = z
  .object({
    phaseSeed: z.number().int(),
    star: z.object({ radius: positive }).strict(),
    mercury: z.object(orbit).strict(),
    venus: z.object({ ...orbit, spinSeconds: positive, color }).strict(),
    cradle: z
      .object({
        ...orbit,
        cloudSpinSeconds: positive,
        spinSeconds: positive,
        cloudHeight: z.number().finite().min(0).max(1),
        color,
      })
      .strict(),
  })
  .strict();
