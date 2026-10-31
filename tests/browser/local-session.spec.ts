import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
	// These smoke checks cannot accidentally use live services or external fonts.
	await page.route("**/*", (route) => {
		const url = new URL(route.request().url());
		return url.hostname === "127.0.0.1" ? route.continue() : route.abort();
	});
});

test("local game starts with each ship and responds to keyboard input", async ({
	page,
}) => {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	for (const ship of ["scout", "balanced", "tank"]) {
		await page.goto("/");
		await expect(page.getByRole("dialog", { name: "Game menu" })).toBeVisible();
		await page.getByLabel("Ship Chassis").selectOption(ship);
		await expect(page.getByLabel("Ship Chassis")).toHaveValue(ship);
		await page.getByRole("button", { name: "TAP TO START" }).click();
		await expect(page.getByRole("dialog", { name: "Game menu" })).toBeHidden();
		await page.keyboard.down("ArrowLeft");
		await expect(page.locator(".engine.left")).toHaveClass(/active/);
		await page.keyboard.up("ArrowLeft");
		await expect(page.locator(".engine.left")).not.toHaveClass(/active/);
		await expect(page.locator(".timer .time")).not.toHaveText("0.0s");
	}
	expect(errors).toEqual([]);
});

test("ship Lab changes the production drawing without live credentials", async ({
	page,
}, testInfo) => {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	await page.goto("/lab/entities/ship");
	const canvas = page.locator("canvas").first();
	await expect(page.getByLabel("Chassis")).toBeVisible();
	await page.getByLabel("Chassis").selectOption("scout");
	const capture = () =>
		canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL());
	await expect.poll(capture).not.toBe("");
	// Allow the Lab's animation frame to consume the selected profile.
	await page.evaluate(
		() =>
			new Promise<void>((resolve) =>
				requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
			),
	);
	const scout = await capture();
	await page.getByLabel("Chassis").selectOption("tank");
	await expect.poll(capture).not.toBe(scout);
	await testInfo.attach("tank-lab", {
		body: await canvas.screenshot(),
		contentType: "image/png",
	});
	expect(errors).toEqual([]);
});

test("unconfigured leaderboard explains unavailability", async ({ page }) => {
	await page.goto("/leaderboard");
	await expect(
		page.getByText("Shared scores are unavailable in this local session."),
	).toBeVisible();
	await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
});
