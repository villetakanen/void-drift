import { expect, type Page, test } from "@playwright/test";

// docs/specs/dialogs.md: every dialog isolates its stage and returns focus.
test.beforeEach(async ({ page }) => {
	await page.route("**/*", (route) =>
		new URL(route.request().url()).hostname === "127.0.0.1"
			? route.continue()
			: route.abort(),
	);
});

/** Presses Tab `n` times and reports where focus went that it must not. */
async function tabOutsideStage(page: Page, n = 24) {
	const leaks: string[] = [];
	for (let i = 0; i < n; i++) {
		await page.keyboard.press("Tab");
		const leak = await page.evaluate(() => {
			const e = document.activeElement;
			if (!e) return null;
			if (e instanceof HTMLCanvasElement) return "canvas";
			if (e.closest(".flight-hud")) return "HUD";
			if (e.closest(".flight-controls")) return `engine pads: ${e.textContent}`;
			if (e.closest("[data-stage]")) return `stage: ${e.textContent}`;
			return null;
		});
		if (leak) leaks.push(leak);
	}
	return leaks;
}

async function expectIsolated(page: Page, name: string) {
	const dialog = page.getByRole("dialog", { name });
	await expect(dialog).toBeVisible();
	expect(
		await page.evaluate(() =>
			document.activeElement?.closest("[role=dialog]") ? "in" : "out",
		),
	).toBe("in");
	await expect(page.locator("[data-stage]")).toHaveAttribute("inert", "");
	await expect(page.locator(".flight-hud")).toBeHidden();
	await expect(page.getByRole("button", { name: "Left engine" })).toBeHidden();
	expect(await tabOutsideStage(page)).toEqual([]);
}

test("dialog isolation: Tab never reaches the HUD, engine pads or canvas", async ({
	page,
}) => {
	await page.goto("/");
	await expect(page.getByRole("button", { name: "PRESS START" })).toBeFocused();
	await expectIsolated(page, "Game menu");

	await page.getByRole("button", { name: "PRESS START" }).click();
	await expect(page.locator(".flight-page")).toHaveAttribute(
		"data-status",
		"PLAYING",
	);
	await expect(page.locator("[data-stage]")).not.toHaveAttribute("inert");
	await expect(page.getByRole("button", { name: "Left engine" })).toBeVisible();
	await page.keyboard.press("Escape");
	await expectIsolated(page, "Paused");

	await page.goto("/lab/flight");
	await page.getByRole("button", { name: "Coast to end" }).click();
	await expectIsolated(page, "Run complete");
	await page.keyboard.press("Escape");
	await expect(
		page.getByRole("dialog", { name: "Run complete" }),
	).toBeVisible();
	await expect(page.locator("[data-stage]")).toHaveAttribute("inert", "");

	// Hand-over: the stage stays inert from run complete into the menu.
	await page.getByRole("button", { name: "Try Again" }).click();
	await expect(page.getByRole("dialog", { name: "Game menu" })).toBeVisible();
	await expect(page.locator("[data-stage]")).toHaveAttribute("inert", "");
	await expect(page.getByRole("button", { name: "PRESS START" })).toBeFocused();
});

test("focus returns to the opener when a dialog closes", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("button", { name: "PRESS START" }).click();
	const pause = page.getByRole("button", { name: "Pause", exact: true });
	await pause.focus();
	await page.keyboard.press("Escape");
	const dialog = page.getByRole("dialog", { name: "Paused" });
	await expect(dialog).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Resume", exact: true }),
	).toBeFocused();
	await page.keyboard.press("Escape");
	await expect(dialog).toBeHidden();
	await expect(page.locator("[data-stage]")).not.toHaveAttribute("inert");
	await expect(pause).toBeFocused();

	// The Lab demo uses the same component.
	await page.goto("/lab/surfaces");
	const opener = page.getByRole("button", { name: "Open dialog" });
	await opener.focus();
	await page.keyboard.press("Enter");
	await expect(page.getByRole("dialog", { name: "Demo dialog" })).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Close", exact: true }),
	).toBeFocused();
	expect(await tabOutsideStage(page, 12)).toEqual([]);
	await page.keyboard.press("Escape");
	await expect(page.getByRole("dialog", { name: "Demo dialog" })).toBeHidden();
	await expect(opener).toBeFocused();
});
