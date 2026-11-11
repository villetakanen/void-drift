import { expect, it } from "vitest";
import { defaultLoadout, LoadoutSchema } from "./schemas/loadout";

it("rejects a stored fitting whose part the mount does not accept", () => {
  const build = defaultLoadout("fighter");
  build.hull[0] = "coil";
  build.aft[0] = "ion";
  expect(LoadoutSchema.safeParse(build).success).toBe(true);
  build.hull[0] = "ion";
  expect(LoadoutSchema.safeParse(build).success).toBe(false);
});
