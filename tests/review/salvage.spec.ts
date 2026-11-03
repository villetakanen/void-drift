import { expect, test } from "../helpers/local-browser";

test("shared weapon fitting and turret geometry", async ({ page }, info) => {
	await page.goto("/lab/entities/ship");
	await page.getByLabel("Show railgun and laser").check();
	const slider = page.getByRole("slider", { name: /Laser rotation/ });
	await slider.press("End");
	await expect(slider).toHaveValue("180");
	const path = info.outputPath("weapon-fittings.png");
	await page.screenshot({ path });
	await info.attach("weapon-fittings", { path, contentType: "image/png" });
});

for (const width of [1280, 844]) {
	test(`weapon salvage review at ${width}`, async ({ page }, info) => {
		const time = new Date("2026-11-03T00:00:00Z");
		await page.clock.install({ time });
		await page.clock.pauseAt(time);
		await page.setViewportSize({ width, height: width === 1280 ? 720 : 390 });
		await page.goto("/builder?chassis=fighter");
		await page
			.getByRole("button", { name: "Hull 1 · Equipment: Empty" })
			.click();
		await page.getByRole("button", { name: /^Laser\b/ }).click();
		await page
			.getByRole("button", { name: "Hull 2 · Equipment: Empty" })
			.click();
		await page.getByRole("button", { name: /^Rail gun\b/ }).click();
		await page
			.getByRole("button", { name: "Test flight", exact: true })
			.click();
		const capture = async (name: string) => {
			const path = info.outputPath(`${name}.png`);
			await page.screenshot({ path });
			await info.attach(name, { path, contentType: "image/png" });
		};
		await page.clock.runFor(7200);
		await capture("tracking");
		const flight = page.locator(".flight-page");
		for (let i = 0; i < 100; i++) {
			if (Number(await flight.getAttribute("data-salvage-destroyed")) > 0)
				break;
			await page.clock.runFor(16);
		}
		await expect(flight).toHaveAttribute("data-salvage-destroyed", "1");
		await page.clock.runFor(48);
		await capture("rail-impact");
		await page.clock.runFor(1000);
		await capture("fragments");
	});
}

test("shared weapon effects in the mixed Lab", async ({ page }, info) => {
	const time = new Date("2026-11-03T00:00:00Z");
	await page.clock.install({ time });
	await page.clock.pauseAt(time);
	await page.goto("/lab/fx?weapons=1");
	await expect(
		page.getByRole("button", { name: "Weapons on" }),
	).toHaveAttribute("aria-pressed", "true");
	await page.clock.runFor(7200);
	const path = info.outputPath("weapon-fx-lab.png");
	await page.screenshot({ path });
	await info.attach("weapon-fx-lab", { path, contentType: "image/png" });
});

test("ship collision uses the shared plume while debris remains physical", async ({
	page,
}, info) => {
	const time = new Date("2026-11-03T00:00:00Z");
	await page.clock.install({ time });
	await page.clock.pauseAt(time);
	await page.goto("/builder?chassis=fighter");
	await page.getByRole("button", { name: "Test flight", exact: true }).click();
	await page.clock.runFor(7200);
	await page.keyboard.down("ArrowUp");
	const flight = page.locator(".flight-page");
	for (let i = 0; i < 100; i++) {
		if (Number(await flight.getAttribute("data-salvage-destroyed")) > 0) break;
		await page.clock.runFor(16);
	}
	await page.keyboard.up("ArrowUp");
	await expect(flight).toHaveAttribute("data-salvage-destroyed", "1");
	await expect(flight).toHaveAttribute("data-rail-shots", "0");
	await expect(flight).toHaveAttribute("data-laser-pulses", "0");
	// The unit scenario isolates the 30-damage wreck hit. During a rendered frame,
	// up to four newly released shards can also collide for five damage each.
	const hull = Number(
		await page
			.getByRole("progressbar", { name: "Hull", exact: true })
			.getAttribute("value"),
	);
	expect(hull).toBeLessThanOrEqual(70);
	expect(hull).toBeGreaterThanOrEqual(50);
	await page.clock.runFor(48);
	const path = info.outputPath("ship-impact.png");
	await page.screenshot({ path });
	await info.attach("ship-impact", { path, contentType: "image/png" });
});
