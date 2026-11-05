import { verificationUrls } from "../../packages/core/src/lib/schemas/verification-ports.mjs";
import {
	type CompetitionChassis,
	competitionFlightResult,
	waitForFlightPhase,
} from "../helpers/competition-flight";
import { expect, test } from "../helpers/local-browser";

const firestore = "http://127.0.0.1:8080";
test.use({
	localOrigins: [
		verificationUrls().competition,
		firestore,
		"http://127.0.0.1:9099",
	],
});

// Rules cases leave fixtures behind. Clear them even when that preceding suite
// failed, and also isolate a standalone competition invocation.
test.beforeAll(async ({ request }) => {
	const response = await request.delete(
		`${firestore}/emulator/v1/projects/demo-void-drift/databases/(default)/documents`,
	);
	expect(response.ok(), "reset demo Firestore before competition").toBe(true);
});

test("two anonymous pilots complete runs, retry a rejected write and see a shared leaderboard", async ({
	newLocalContext,
}) => {
	const pilots: {
		launcher: string;
		name: string;
		chassis: CompetitionChassis;
		initials: string;
	}[] = [
		{ launcher: "01", name: "Scout", chassis: "scout", initials: "ONE" },
		{
			launcher: "04",
			name: "Corvette",
			chassis: "corvette",
			initials: "TWO",
		},
	];
	for (const pilot of pilots) {
		const chassis = pilot.chassis;
		const context = await newLocalContext();
		const page = await context.newPage();
		await page.clock.install({ time: new Date("2026-11-03T00:00:00Z") });
		await page.goto("/");
		await expect(page.locator(".flight-page")).toHaveAttribute(
			"data-stabilizers",
			"true",
		);
		await page
			.getByRole("radiogroup", { name: "SELECT YOUR SHIP" })
			.getByText(pilot.launcher, { exact: true })
			.click();
		await expect(page.getByText(pilot.name, { exact: true })).toBeVisible();
		await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
		await page.getByRole("button", { name: "PRESS START" }).click();
		await waitForFlightPhase(page, "playing");
		await expect(page.locator(".flight-page")).toHaveAttribute(
			"data-status",
			"PLAYING",
		);
		await expect(page.locator(".flight-page")).toHaveAttribute(
			"data-ticks",
			"0",
		);
		const seed = Number(
			await page.locator(".flight-page").getAttribute("data-seed"),
		);
		const predicted = competitionFlightResult(chassis, seed);
		expect(predicted.status).toBe("GAME_OVER");
		await page.clock.runFor((predicted.ticks * 1000) / 60 + 40);
		await expect(
			page.getByRole("dialog", { name: "Run complete" }),
		).toBeVisible();
		await expect(page.locator(".flight-page")).toHaveAttribute(
			"data-ticks",
			String(predicted.ticks),
		);
		await page.clock.resume();
		await page.getByLabel("Your initials").fill(pilot.initials);
		const submit = page.getByRole("button", {
			name: "Save Score",
			exact: true,
		});
		if (pilot.initials === "ONE") {
			let rejected = false;
			await page.route(
				(url) =>
					url.origin === firestore &&
					url.pathname.endsWith("/documents:commit"),
				async (route) => {
					if (rejected) return route.continue();
					rejected = true;
					await route.fulfill({
						status: 403,
						json: {
							error: {
								code: 403,
								status: "PERMISSION_DENIED",
								message: "Verification fixture denied this write.",
							},
						},
					});
				},
			);
			await submit.click();
			await expect(page.locator(".flight-message")).toContainText(
				"Verification fixture denied this write.",
			);
			await expect(submit).toBeEnabled();
			expect(rejected).toBe(true);
		}
		await submit.click();
		await expect(page).toHaveURL(/\/leaderboard$/, { timeout: 15000 });
		await context.close();
	}
	const context = await newLocalContext();
	const page = await context.newPage();
	await page.goto("/leaderboard");
	for (const initials of ["ONE", "TWO"])
		await expect(
			page.getByRole("cell", { name: new RegExp(`^${initials}\\b`) }),
		).toBeVisible();
	for (const name of ["Scout", "Corvette"])
		await expect(page.getByRole("cell", { name, exact: true })).toBeVisible();
	await context.close();
});
