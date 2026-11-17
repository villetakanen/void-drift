import { BuildStoreSchema } from "../../packages/mode-a/src/lib/schemas/loadout";
import { chooseShip } from "../helpers/hangar";
import { expect, test } from "../helpers/local-browser";

test("editing one ship preserves the other saved fittings across reload", async ({
  page,
}) => {
  await page.goto("/hangar");
  await chooseShip(page, "Fighter");
  await page.getByRole("button", { name: "Hull 1 · Equipment: Empty" }).click();
  await page.getByRole("button", { name: /^Potential Well\b/ }).click();
  const readSave = async () => {
    const raw = await page.evaluate(() =>
      localStorage.getItem("void-drift-builds-v3"),
    );
    return BuildStoreSchema.parse(JSON.parse(raw ?? "null"));
  };
  const before = await readSave();
  await chooseShip(page, "Scout");
  await page.getByRole("button", { name: "Hull 1 · Equipment: Empty" }).click();
  await page.getByRole("button", { name: /^Heavy Potential Well\b/ }).click();
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "Hull 1 · Equipment: Heavy Potential Well",
    }),
  ).toBeVisible();
  const after = await readSave();
  for (const chassis of ["wasp", "fighter", "corvette", "fiddler"] as const) {
    expect(after[chassis]).toEqual(before[chassis]);
  }
});
