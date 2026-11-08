import { expect, test } from "../helpers/local-browser";

test("real laser damage sheds three pieces then releases eight total and one cell", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/lab/entities/derelict");
  const bench = page.getByRole("region", {
    name: "Physical shedding specimen",
  });
  const status = bench.getByRole("status");
  await expect(status).toContainText(
    "Hull 85 / 85 · Fragments 0 · Energy cells 0",
  );
  const pulse = bench.getByRole("button", { name: "Laser pulse", exact: true });
  for (let hit = 1; hit <= 17; hit++) {
    await pulse.click();
    if (hit === 4)
      await expect(status).toContainText(
        "Hull 65 / 85 · Fragments 1 · Energy cells 0",
      );
    if (hit === 7)
      await expect(status).toContainText(
        "Hull 50 / 85 · Fragments 2 · Energy cells 0",
      );
    if (hit === 11)
      await expect(status).toContainText(
        "Hull 30 / 85 · Fragments 3 · Energy cells 0",
      );
  }
  await expect(status).toContainText(
    "Hull 0 / 85 · Fragments 8 · Energy cells 1",
  );
  await bench.getByRole("checkbox", { name: "Show fitted material" }).check();
  await bench.getByRole("button", { name: "Reset specimen" }).click();
  await bench.getByRole("button", { name: "Ram", exact: true }).click();
  await expect(status).toContainText("Hull 0 / 85 · Fragments 8");
  await expect(status).toContainText("Ship hull 70");
});
