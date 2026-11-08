import { expect, test } from "../helpers/local-browser";

test("genuine cannon installs, persists, removes and launches through Hangar", async ({
	page,
}) => {
	await page.goto("/hangar?chassis=fighter");
	await page.getByRole("button", { name: "Hull 1 · Equipment: Empty" }).click();
	const cannon = page.getByRole("button", { name: /^Light Ion Cannon\b/ });
	await expect(cannon).toContainText("12–48 damage/s");
	await expect(cannon.locator("svg path")).toHaveCount(8);
	await cannon.click();
	await page.getByRole("button", { name: "Hull 2 · Equipment: Empty" }).click();
	await cannon.click();
	await page.reload();
	await expect(
		page.getByRole("button", { name: "Hull 1 · Equipment: Light Ion Cannon" }),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Hull 2 · Equipment: Light Ion Cannon" }),
	).toBeVisible();
	await page
		.getByRole("button", { name: "Hull 1 · Equipment: Light Ion Cannon" })
		.click();
	await page.getByRole("button", { name: /Remove/ }).click();
	await expect(
		page.getByRole("button", { name: "Hull 1 · Equipment: Empty" }),
	).toBeVisible();
	await cannon.click();
	await page.getByRole("button", { name: "Derelicts", exact: true }).click();
	await expect(page.locator(".flight-page")).toHaveAttribute(
		"data-status",
		"PLAYING",
	);
	await page.getByRole("button", { name: "Pause", exact: true }).click();
	await page.getByRole("button", { name: "Abort", exact: true }).click();
	await expect(
		page.getByRole("button", { name: "Hull 1 · Equipment: Light Ion Cannon" }),
	).toBeVisible();
});

test("accepted study production encounter fires, freezes, resets and preserves gameplay without FX", async ({
	page,
}, testInfo) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto("/lab/studies/light-ion-cannon-2026-11-08#production");
	const scene = page.getByRole("region", {
		name: "Production Light Ion Cannon encounter",
	});
	await scene.getByRole("button", { name: "Step encounter" }).click();
	await expect(scene).toHaveAttribute("data-shots", "2");
	await expect(scene).toHaveAttribute("data-spent", "0.4");
	const hits = await scene.getAttribute("data-hits");
	await page.screenshot({ path: testInfo.outputPath("cannon-close.png") });
	await page.waitForTimeout(100);
	await expect(scene).toHaveAttribute("data-spent", "0.4");
	await scene.getByRole("button", { name: "Reset encounter" }).click();
	await scene.getByLabel("Effects", { exact: true }).uncheck();
	await scene.getByRole("button", { name: "Step encounter" }).click();
	await expect(scene).toHaveAttribute("data-hits", hits ?? "");
	await expect(scene).toHaveAttribute("data-spent", "0.4");
	await scene.getByLabel("Encounter", { exact: true }).selectOption("miss");
	await scene.getByRole("button", { name: "Step encounter" }).click();
	await expect(scene).toHaveAttribute("data-shots", "2");
	await expect(scene).toHaveAttribute("data-spent", "0.4");
	await scene.getByRole("button", { name: "Reset encounter" }).click();
	await expect(scene).toHaveAttribute("data-shots", "0");
});

test("fresh LFX follows the shared muzzle, expires without history and never changes gameplay", async ({
	page,
}, testInfo) => {
	await page.goto("/lab/fx");
	const result = await page.evaluate(
		async (path) => {
			const {
				Simulation,
				stockSettings,
				defaultLoadout,
				weaponPose,
				FlightFx,
				WeaponEventSchema,
			} = await import(path);
			const loadout = defaultLoadout("fighter");
			loadout.hull[0] = "light-ion-cannon";
			const sim = new Simulation({
				...stockSettings("fighter"),
				loadout,
				mode: "derelicts",
				arrival: false,
			});
			sim.planets.length = 0;
			sim.star.pos.set(1800, 1000);
			sim.ship.pos.set(100, 100);
			sim.ship.rotation = 0;
			const salvage = sim.salvage;
			if (!salvage) throw new Error("Salvage missing");
			const mount = salvage.weapons[0].mount;
			salvage.events.push(
				WeaponEventSchema.parse({
					kind: "ion-cannon",
					id: 1,
					mountKey: mount.key,
					distance: 200,
					time: 0,
					x: 100,
					y: 100,
					endX: 300,
					endY: 100,
				}),
			);
			const canvas = document.createElement("canvas");
			canvas.width = canvas.height = 512;
			const ctx = canvas.getContext("2d");
			if (!ctx) throw new Error("Canvas missing");
			const fx = new FlightFx();
			const snapshot = JSON.stringify({
				power: sim.state.resources.power,
				hits: salvage.hits,
				bodies: salvage.bodies,
			});
			const render = () => {
				ctx.clearRect(0, 0, 512, 512);
				fx.drawLfx(ctx, sim);
			};
			const alpha = (x: number, y: number) =>
				ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data[3];
			const p = weaponPose(sim.ship, mount);
			render();
			const attached = alpha(p.muzzleX + 20, p.muzzleY);
			const first = ctx.getImageData(0, 0, 512, 512).data.slice();
			render();
			const second = ctx.getImageData(0, 0, 512, 512).data;
			const paused = first.every((v: number, i: number) => v === second[i]);
			sim.ship.rotation = Math.PI / 2;
			render();
			const q = weaponPose(sim.ship, mount);
			const turned = alpha(q.muzzleX, q.muzzleY + 20),
				old = alpha(p.muzzleX + 20, p.muzzleY);
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
			return {
				attached,
				paused,
				turned,
				old,
				expired,
				reset,
				isolated:
					snapshot ===
					JSON.stringify({
						power: sim.state.resources.power,
						hits: salvage.hits,
						bodies: salvage.bodies,
					}),
			};
		},
		`/@fs/${new URL("../../packages/mode-a/src/index.ts", `file://${testInfo.project.testDir}/`).pathname}`,
	);
	expect(result.attached).toBeGreaterThan(0);
	expect(result.turned).toBeGreaterThan(0);
	expect(result.old).toBe(0);
	expect(result.paused).toBe(true);
	expect(result.expired).toBe(false);
	expect(result.reset).toBe(false);
	expect(result.isolated).toBe(true);
});
