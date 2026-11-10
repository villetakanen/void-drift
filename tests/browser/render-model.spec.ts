import { FLIGHT_PASSES } from "../../packages/mode-a/src/lib/flight-frame";
import { expect, test } from "../helpers/local-browser";

const ids = FLIGHT_PASSES.map((pass) => pass.id);

test("render model lists the game's passes and draws the selected ones", async ({
  page,
}) => {
  await page.goto("/lab/render-model");
  const model = page.getByRole("region", { name: "Render model" });
  const ticks = async () => Number(await model.getAttribute("data-ticks"));
  const advancing = async () => {
    const from = await ticks();
    await expect.poll(ticks).not.toBe(from);
  };
  await expect.poll(ticks).toBeGreaterThan(10);

  const rows = model.locator("[data-pass]");
  expect(
    await rows.evaluateAll((items) =>
      items.map((item) => item.getAttribute("data-pass")),
    ),
  ).toEqual(ids);
  await expect(model).toHaveAttribute("data-drawn", ids.join(" "));

  // Hiding one pass leaves the others, and the simulation keeps running.
  const hiddenPass = FLIGHT_PASSES[1];
  await model.getByRole("checkbox", { name: hiddenPass.name }).uncheck();
  await expect(model).toHaveAttribute(
    "data-drawn",
    ids.filter((id) => id !== hiddenPass.id).join(" "),
  );
  await advancing();

  // Solo shows one pass; leaving it restores the toggled set.
  const soloPass = FLIGHT_PASSES[FLIGHT_PASSES.length - 3];
  const solo = model.getByRole("button", { name: `Solo ${soloPass.name}` });
  await solo.click();
  await expect(model).toHaveAttribute("data-drawn", soloPass.id);
  await advancing();
  await solo.click();
  await expect(model).toHaveAttribute(
    "data-drawn",
    ids.filter((id) => id !== hiddenPass.id).join(" "),
  );
  await model.getByRole("checkbox", { name: hiddenPass.name }).check();

  // Build-up draws the first passes in order.
  await model.getByRole("slider").fill("3");
  await expect(model).toHaveAttribute("data-drawn", ids.slice(0, 3).join(" "));
  await advancing();

  // Pause holds the tick; Step advances it by one.
  await model.getByRole("button", { name: "Pause", exact: true }).click();
  const held = await ticks();
  await model.getByRole("button", { name: "Step", exact: true }).click();
  await expect(model).toHaveAttribute("data-ticks", String(held + 1));

  // Layer values come from the tokens.
  for (const row of await model.locator("[data-layer]").all()) {
    const token = (await row.getAttribute("data-layer")) ?? "";
    const value = await page.evaluate(
      (name) =>
        getComputedStyle(document.documentElement)
          .getPropertyValue(name)
          .trim(),
      token,
    );
    await expect(row.locator(".value")).toHaveText(value);
  }
});
