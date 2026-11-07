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
	test(`armed practice review at ${width}`, async ({ page }, info) => {
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
		const flight = page.locator(".flight-page");
		await expect(flight).toHaveAttribute("data-salvage-passes", "0");
		await expect(flight).toHaveAttribute("data-rail-shots", "0");
		await expect(flight).toHaveAttribute("data-laser-pulses", "0");
		await capture("armed-practice");
		await page.getByRole("button", { name: "Pause", exact: true }).click();
		await capture("practice-paused");
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
