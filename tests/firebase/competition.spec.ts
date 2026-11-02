import { expect, test } from "@playwright/test";

const LAUNCHER: Record<string, string> = {
	scout: "01",
	wasp: "02",
	fighter: "03",
	corvette: "04",
};

test("two anonymous pilots complete runs, submit and see a shared leaderboard", async ({
	browser,
}) => {
	for (const [ship, initials] of [
		["scout", "ONE"],
		["corvette", "TWO"],
	]) {
		const context = await browser.newContext();
		const page = await context.newPage();
		await page.route("**/*", (route) =>
			["localhost", "127.0.0.1"].includes(
				new URL(route.request().url()).hostname,
			)
				? route.continue()
				: route.abort(),
		);
		await page.clock.install();
		await page.goto("http://127.0.0.1:4323/");
		await page
			.getByRole("radiogroup", { name: "SELECT YOUR SHIP" })
			.getByText(LAUNCHER[ship], { exact: true })
			.click();
		await page.getByRole("button", { name: "PRESS START" }).click();
		for (
			let i = 0;
			i < 15 &&
			(await page.locator(".flight-page").getAttribute("data-status")) !==
				"GAME_OVER";
			i++
		)
			await page.clock.runFor(10000);
		await expect(
			page.getByRole("dialog", { name: "Run complete" }),
		).toBeVisible();
		await page.getByLabel("Your initials").fill(initials);
		await page
			.getByRole("button", { name: "Submit Score", exact: true })
			.click();
		await expect(
			page.getByRole("button", { name: "Saved", exact: true }),
		).toBeVisible({ timeout: 15000 });
		await context.close();
	}
	const context = await browser.newContext();
	const page = await context.newPage();
	await page.goto("http://127.0.0.1:4323/leaderboard");
	await expect(page.getByRole("cell").filter({ hasText: /ONE/ })).toBeVisible();
	await expect(page.getByRole("cell").filter({ hasText: /TWO/ })).toBeVisible();
	for (const name of ["Scout", "Corvette"])
		await expect(page.getByRole("cell", { name, exact: true })).toBeVisible();
	await context.close();
});
