import { expect, test } from "../helpers/local-browser";

const modeA = (testDir: string) =>
  `/@fs/${new URL("../../packages/mode-a/src/index.ts", `file://${testDir}/`).pathname}`;

test("genuine turret is offered in compatible slots only, persists and launches through Hangar", async ({
  page,
}) => {
  await page.goto("/hangar?chassis=fighter");
  // The engine slot is selected first: its catalogue offers engines only.
  await page
    .getByRole("button", { name: "Left side · mirrored E: Light ion" })
    .click();
  await expect(
    page.getByRole("button", { name: /^Heavy ion\b/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Ion Point Defence\b/ }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Hull 1 · Equipment: Empty" }).click();
  const turret = page.getByRole("button", { name: /^Ion Point Defence\b/ });
  await expect(turret).toContainText("8–24 damage/s");
  await expect(turret).toContainText("3 shots/s");
  await expect(turret).toContainText("100 units");
  await expect(turret).toContainText("0.1p/shot");
  await expect(turret).toContainText("10 mass");
  await expect(turret.locator("svg circle")).toHaveCount(2);
  await turret.click();
  await page.getByRole("button", { name: "Aft 1 · Universal: Empty" }).click();
  await turret.click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Hull 1 · Equipment: Ion Point Defence" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Aft 1 · Universal: Ion Point Defence" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Derelicts", exact: true }).click();
  await expect(page.locator(".flight-page")).toHaveAttribute(
    "data-status",
    "PLAYING",
  );
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("button", { name: "Abort", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Hull 1 · Equipment: Ion Point Defence" }),
  ).toBeVisible();
  await page.goto("/hangar?chassis=fiddler");
  const support = page.getByRole("button", { name: /· Support: / }).first();
  await support.click();
  await expect(
    page.getByRole("button", { name: /^Ion Point Defence\b/ }),
  ).toHaveCount(0);
});

for (const path of [
  "/lab/studies/ion-point-defence-2026-11-08#production",
  "/lab/utility-artwork#ion-point-defence",
])
  test(`production turret encounter at ${path.split("#")[0]} tracks, stops at first contact, switches and preserves gameplay without FX`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(path);
    const scene = page.getByRole("region", {
      name: "Production Ion Point Defence encounter",
    });
    const select = scene.getByLabel("Encounter", { exact: true });
    const stepButton = scene.getByRole("button", { name: "Step encounter" });
    const steps = async (n: number) => {
      for (let i = 0; i < n; i++) await stepButton.click();
    };
    // Wait for hydration before driving the controls.
    await expect(stepButton).toBeEnabled();
    // Beyond reach: tracked, never fired on.
    await select.selectOption("reach");
    await steps(70);
    await expect(scene).toHaveAttribute("data-target", "101");
    await expect(scene).toHaveAttribute("data-shots", "0");
    await expect(scene).toHaveAttribute("data-spent", "0");
    // First contact: the near wreck takes every hit; the wreck behind it keeps its hull.
    await select.selectOption("first-contact");
    await steps(40);
    expect(Number(await scene.getAttribute("data-shots"))).toBeGreaterThan(0);
    await expect(scene).toHaveAttribute("data-hulls", /102:85\b/);
    await expect(scene).not.toHaveAttribute("data-hulls", /101:85\b/);
    const hulls = await scene.getAttribute("data-hulls");
    const spent = await scene.getAttribute("data-spent");
    await page.screenshot({
      path: testInfo.outputPath("point-defence-first-contact.png"),
    });
    await scene.getByRole("button", { name: "Reset encounter" }).click();
    await expect(scene).toHaveAttribute("data-shots", "0");
    await scene.getByLabel("Effects", { exact: true }).uncheck();
    await steps(40);
    await expect(scene).toHaveAttribute("data-hulls", hulls ?? "");
    await expect(scene).toHaveAttribute("data-spent", spent ?? "");
    await scene.getByLabel("Effects", { exact: true }).check();
    // A clearly closer wreck takes over from the retained fragment.
    await select.selectOption("switch");
    await steps(2);
    await expect(scene).toHaveAttribute("data-target", "101");
    await scene.getByRole("button", { name: "Play encounter" }).click();
    await expect(scene).toHaveAttribute("data-target", "102", {
      timeout: 10_000,
    });
    await expect
      .poll(async () => Number(await scene.getAttribute("data-shots")), {
        timeout: 10_000,
      })
      .toBeGreaterThan(0);
    await scene.getByRole("button", { name: "Pause encounter" }).click();
    // Scout hides the turret under its hull yet still fires.
    await select.selectOption("scout");
    await steps(40);
    expect(Number(await scene.getAttribute("data-shots"))).toBeGreaterThan(0);
    await select.selectOption("turning");
    await expect(scene.getByLabel("Turn and burn")).toBeChecked();
    await steps(40);
    expect(Number(await scene.getAttribute("data-shots"))).toBeGreaterThan(0);
  });

test("turret LFX follows the current muzzle and heading, keeps its 100-unit profile and never changes gameplay", async ({
  page,
}, testInfo) => {
  await page.goto("/lab/fx");
  const result = await page.evaluate(async (path) => {
    const {
      Simulation,
      stockSettings,
      defaultLoadout,
      weaponPose,
      FlightFx,
      WeaponEventSchema,
    } = await import(path);
    const loadout = defaultLoadout("scout");
    loadout.hull[0] = "ion-point-defence";
    const sim = new Simulation({
      ...stockSettings("scout"),
      loadout,
      mode: "derelicts",
      arrival: false,
    });
    sim.planets.length = 0;
    sim.star.pos.set(1800, 1000);
    sim.ship.pos.set(200, 200);
    sim.ship.rotation = 0;
    const salvage = sim.salvage;
    if (!salvage) throw new Error("Salvage missing");
    const weapon = salvage.weapons[0];
    salvage.events.push(
      WeaponEventSchema.parse({
        kind: "point-defence",
        id: 1,
        mountKey: weapon.mount.key,
        distance: 100,
        time: 0,
        x: 200,
        y: 200,
        endX: 300,
        endY: 200,
      }),
    );
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas missing");
    const fx = new FlightFx();
    const snapshot = () =>
      JSON.stringify({
        power: sim.state.resources.power,
        hits: salvage.hits,
        bodies: salvage.bodies,
        angle: weapon.angle,
        readyAt: weapon.readyAt,
      });
    const before = snapshot();
    const render = () => {
      ctx.clearRect(0, 0, 512, 512);
      fx.drawLfx(ctx, sim);
    };
    const alpha = (x: number, y: number) =>
      ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data[3];
    const along = (
      p: { muzzleX: number; muzzleY: number; angle: number },
      d: number,
    ) =>
      alpha(
        p.muzzleX + Math.cos(p.angle) * d,
        p.muzzleY + Math.sin(p.angle) * d,
      );
    /** Brightest alpha across the beam's width at distance `d`. */
    const peak = (
      p: { muzzleX: number; muzzleY: number; angle: number },
      d: number,
    ) => {
      let max = 0;
      for (let o = -3; o <= 3; o++)
        max = Math.max(
          max,
          alpha(
            p.muzzleX + Math.cos(p.angle) * d - Math.sin(p.angle) * o,
            p.muzzleY + Math.sin(p.angle) * d + Math.cos(p.angle) * o,
          ),
        );
      return max;
    };
    const p = weaponPose(sim.ship, weapon.mount, weapon.angle);
    render();
    // Light leaves the muzzle under the hull; the 100-unit profile ends before 100 units.
    const attached = along(p, 20);
    const beyond = along(p, 110);
    const tip = { near: peak(p, 20), end: peak(p, 95) };
    const first = ctx.getImageData(0, 0, 512, 512).data.slice();
    render();
    const second = ctx.getImageData(0, 0, 512, 512).data;
    const paused = first.every((v: number, i: number) => v === second[i]);
    // The turret turns relative to the ship: the flash follows its current heading.
    weapon.angle = Math.PI / 2;
    render();
    const q = weaponPose(sim.ship, weapon.mount, weapon.angle);
    const turned = along(q, 20),
      old = along(p, 40);
    salvage.time = 0.1;
    render();
    const expired = ctx
      .getImageData(0, 0, 512, 512)
      .data.some((v: number) => v > 0);
    salvage.time = 0;
    salvage.events = [];
    render();
    const reset = ctx
      .getImageData(0, 0, 512, 512)
      .data.some((v: number) => v > 0);
    weapon.angle = 0;
    // A cannon discharge clipped at the same 100 units keeps its 200-unit
    // profile, which is still bright where the turret profile fades to its tip.
    const gunLoadout = defaultLoadout("scout");
    gunLoadout.hull[0] = "light-ion-cannon";
    const gun = new Simulation({
      ...stockSettings("scout"),
      loadout: gunLoadout,
      mode: "derelicts",
      arrival: false,
    });
    gun.planets.length = 0;
    gun.star.pos.set(1800, 1000);
    gun.ship.pos.set(200, 200);
    gun.ship.rotation = 0;
    const gunSalvage = gun.salvage;
    const cannon = gunSalvage?.weapons.find(
      (w: { kind: string }) => w.kind === "light-ion-cannon",
    );
    if (!gunSalvage || !cannon) throw new Error("Cannon missing");
    gunSalvage.events.push(
      WeaponEventSchema.parse({
        kind: "ion-cannon",
        id: 1,
        mountKey: cannon.mount.key,
        distance: 100,
        time: 0,
        x: 200,
        y: 200,
        endX: 300,
        endY: 200,
      }),
    );
    ctx.clearRect(0, 0, 512, 512);
    new FlightFx().drawLfx(ctx, gun);
    const c = weaponPose(gun.ship, cannon.mount);
    const clipped = { near: peak(c, 20), end: peak(c, 95) };
    return {
      tip,
      clipped,
      attached,
      beyond,
      paused,
      turned,
      old,
      expired,
      reset,
      isolated: before === snapshot(),
    };
  }, modeA(testInfo.project.testDir));
  expect(result.attached).toBeGreaterThan(0);
  expect(result.beyond).toBe(0);
  // Near its 100-unit end the turret's own transparent tip is dimmer, relative
  // to its body, than a cannon profile clipped at the same distance.
  expect(result.tip.near).toBeGreaterThan(0);
  expect(result.clipped.near).toBeGreaterThan(0);
  expect(result.tip.end / result.tip.near).toBeLessThan(
    result.clipped.end / result.clipped.near,
  );
  expect(result.turned).toBeGreaterThan(0);
  expect(result.old).toBe(0);
  expect(result.paused).toBe(true);
  expect(result.expired).toBe(false);
  expect(result.reset).toBe(false);
  expect(result.isolated).toBe(true);
});
