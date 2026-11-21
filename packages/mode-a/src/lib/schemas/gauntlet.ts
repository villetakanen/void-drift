import { z } from "zod";

export const GauntletActorIdSchema = z.enum([
  "pirate-1",
  "pirate-2",
  "pirate-3",
  "pirate-4",
  "pirate-5",
  "pirate-6",
  "pirate-7",
]);
export const GauntletAllegianceSchema = z.enum(["player", "hostile"]);
export const GauntletLifecycleSchema = z.enum([
  "arriving",
  "active",
  "destroyed",
]);
export const GauntletResultSchema = z.object({
  winner: z.enum(["player", "pirate", "mutual"]),
  cause: z.enum(["combat", "environment"]),
});
export type GauntletResult = z.infer<typeof GauntletResultSchema>;
