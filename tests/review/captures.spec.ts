import type { Locator, Page, TestInfo } from "@playwright/test";
import { expect, test } from "../helpers/local-browser";

// Human review artifacts only: these scenarios deliberately have no pixel goldens.
async function capture(target: Page | Locator, info: TestInfo, name: string) {
	const path = info.outputPath(`${name}.png`);
	await target.screenshot({ path });
	await info.attach(name, { path, contentType: "image/png" });
}
async function freeze(page: Page) {
	const time = new Date("2026-11-03T00:00:00Z");
	await page.clock.install({ time });
	await page.clock.pauseAt(time);
}

test("flight trial at its fixed seed and replay tick", async ({
	page,
}, info) => {
	await page.goto("/lab/flight");
	await page.getByRole("button", { name: "Replay trial", exact: true }).click();
	await capture(page, info, "flight-trial");
});

test("production ship preview and assembled hulls", async ({ page }, info) => {
	await freeze(page);
	await page.setViewportSize({ width: 1440, height: 1100 });
	await page.goto("/lab/entities/ship");
	await page.getByLabel("Chassis").selectOption("corvette");
	await page.clock.runFor(32);
	await capture(page.locator("canvas").first(), info, "corvette-lab");
	for (const chassis of ["fighter", "scout", "corvette"]) {
		await page.goto(`/builder?chassis=${chassis}`);
		await expect(
			page.getByRole("button", { name: "Test flight", exact: true }),
		).toBeEnabled();
		await page.clock.runFor(32);
		await capture(page, info, `${chassis}-builder`);
		await page
			.getByRole("button", { name: "Test flight", exact: true })
			.click();
		await page.keyboard.down("ArrowUp");
		await page.clock.runFor(500);
		await capture(page, info, `${chassis}-flight-500ms`);
		await page.keyboard.up("ArrowUp");
	}
});

test("ion turn, release, counter-thrust and both-engine review", async ({
	page,
}, info) => {
	await freeze(page);
	for (const chassis of ["fighter", "scout", "corvette"]) {
		await page.goto(`/builder?chassis=${chassis}`);
		await page.getByRole("checkbox", { name: "Ion stabilizers" }).check();
		await page.getByRole("button", { name: /^Heavy ion\b/ }).click();
		if (chassis === "corvette") {
			for (const n of [1, 2, 3]) {
				await page
					.getByRole("button", { name: `Aft ${n} · Universal: Empty` })
					.click();
				await page.getByRole("button", { name: /^Heavy ion\b/ }).click();
			}
		}
		await page
			.getByRole("button", { name: "Test flight", exact: true })
			.click();
		await page.keyboard.down("d");
		await page.clock.runFor(500);
		await capture(page, info, `ion-${chassis}-left-500ms`);
		await page.keyboard.up("d");
		await page.clock.runFor(500);
		await capture(page, info, `ion-${chassis}-release-1000ms`);
		await page.keyboard.down("a");
		await page.clock.runFor(500);
		await capture(page, info, `ion-${chassis}-right-1500ms`);
		await page.keyboard.down("d");
		await page.clock.runFor(500);
		await capture(page, info, `ion-${chassis}-both-2000ms`);
		await page.keyboard.up("a");
		await page.keyboard.up("d");
	}
});

test("mount editor framing and view modes", async ({ page }, info) => {
	await page.goto("/lab/mount-planner");
	await expect(page.locator("[data-ready=true]")).toBeVisible();
	await capture(page, info, "mount-planner-desktop");
	await page.setViewportSize({ width: 1180, height: 820 });
	await capture(page, info, "mount-planner-compact");
	await page.setViewportSize({ width: 1440, height: 1000 });
	for (const mode of ["In-game", "Empty"]) {
		await page
			.getByRole("radiogroup", { name: "Mount contents" })
			.getByText(mode, { exact: true })
			.click();
		await page.getByRole("button", { name: "Fit ship", exact: true }).click();
		await capture(page, info, `mount-planner-${mode.toLowerCase()}`);
	}
});

test("production mixed and ion effects at fixed times", async ({
	page,
}, info) => {
	await freeze(page);
	await page.goto("/lab/fx");
	const scene = page.getByRole("region", { name: "Arcade FX instrument" });
	await expect(scene).toBeVisible();
	await page.clock.runFor(1000);
	await scene.getByRole("button", { name: "Pause", exact: true }).click();
	await capture(scene, info, "mixed-fx-1000ms");
	await page.goto("/lab/ion-engines");
	const region = page.getByRole("region", { name: "Production ion effects" });
	await region
		.getByRole("button", { name: "Firing · 0.75 s", exact: true })
		.click();
	await capture(region, info, "ion-firing-tick45");
});
