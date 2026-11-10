import { expect, test } from "../helpers/local-browser";

test("shared ion instrument exposes firing, turning, release and expiry", async ({
  page,
}) => {
  await page.goto("/lab/studies/ion-engines-2026-10-31");
  const region = page.getByRole("region", {
    name: "Light and Heavy ion visual comparison",
  });
  for (const [tick, name] of [
    [45, "Firing · 0.75 s"],
    [270, "Turning · 4.5 s"],
    [330, "Released · 5.5 s"],
    [360, "Faded · 6 s"],
  ] as const) {
    await region.getByRole("button", { name, exact: true }).click();
    await expect(region).toHaveAttribute("data-tick", String(tick));
    if (tick >= 330) await expect(region).toHaveAttribute("data-outlets", "0");
    else
      await expect
        .poll(async () => Number(await region.getAttribute("data-outlets")))
        .toBeGreaterThan(0);
  }
});
