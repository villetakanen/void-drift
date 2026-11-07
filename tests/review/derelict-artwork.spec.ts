import { expect, test } from "../helpers/local-browser";

test("shared derelict artwork: intact hull and separated material", async ({
	page,
}, info) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto("/lab/entities/derelict");
	await expect(
		page.getByRole("heading", { name: "Lab // Derelict" }),
	).toBeVisible();
	const scrub = page.getByRole("slider", { name: "Breakup reference" });
	await scrub.fill("0");
	await expect(
		page.getByRole("checkbox", { name: "Energy light" }),
	).toBeChecked();
	for (const [label, value] of [
		["intact", "0"],
		["early-shedding", "0.7"],
		["release", "1.08"],
		["separated", "2"],
	]) {
		await scrub.fill(value);
		const path = info.outputPath(`derelict-${label}.png`);
		await page.screenshot({ path });
		await info.attach(label, { path, contentType: "image/png" });
	}
});

test("shared derelict hull in the production FX scene before weapon impacts", async ({
	page,
}, info) => {
	const time = new Date("2026-11-07T00:00:00Z");
	await page.clock.install({ time });
	await page.clock.pauseAt(time);
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto("/lab/fx?weapons=1");
	await expect(
		page.getByRole("button", { name: "Weapons on" }),
	).toHaveAttribute("aria-pressed", "true");
	await page.clock.runFor(32);
	const path = info.outputPath("derelict-production-fx.png");
	await page.screenshot({ path });
	await info.attach("production-fx", { path, contentType: "image/png" });
});
