import { expect, test } from "@playwright/test";

test("optional stabilizers persist and render in all fitted hulls through turn, release and LR", async ({
	page,
}) => {
	await page.clock.install();
	for (const chassis of ["balanced", "scout", "tank"]) {
		await page.goto(`/lab/builder?chassis=${chassis}`);
		await page.getByRole("checkbox", { name: "Ion stabilizers" }).check();
		await page.reload();
		await expect(
			page.getByRole("checkbox", { name: "Ion stabilizers" }),
		).toBeChecked();
		await page.getByRole("button", { name: /Heavy ion.*20 mass/ }).click();
		if (chassis === "tank") {
			for (const n of [1, 2, 3]) {
				await page
					.getByRole("button", { name: `Aft ${n} · Universal: Empty` })
					.click();
				await page.getByRole("button", { name: /Heavy ion.*20 mass/ }).click();
			}
		}
		await page
			.getByRole("button", { name: "Test flight", exact: true })
			.click();
		const deck = page.locator(".flight-page");
		await expect(deck).toHaveAttribute("data-stabilizers", "true");
		await page.keyboard.down("d");
		await page.clock.runFor(500);
		await expect
			.poll(async () => Number(await deck.getAttribute("data-spin")))
			.toBeGreaterThan(0);
		await page.screenshot({ path: `artifacts/ion-${chassis}-left.png` });
		await page.keyboard.up("d");
		const initialSpin = Number(await deck.getAttribute("data-spin"));
		await page.clock.runFor(500);
		const brakingSpin = Number(await deck.getAttribute("data-spin"));
		expect(brakingSpin).toBeLessThan(initialSpin);
		expect(brakingSpin).toBeGreaterThanOrEqual(0);
		await page.screenshot({ path: `artifacts/ion-${chassis}-release.png` });
		await page.keyboard.down("a");
		await page.clock.runFor(500);
		await page.screenshot({ path: `artifacts/ion-${chassis}-right.png` });
		await page.keyboard.down("d");
		await page.clock.runFor(500);
		await page.screenshot({ path: `artifacts/ion-${chassis}-both.png` });
		await page.keyboard.up("d");
		await page.keyboard.up("a");
	}
});

test("Flight Lab imports, renders and replays optional stabilizers and ion settings", async ({
	page,
}) => {
	await page.goto("/lab/flight");
	await page.getByRole("checkbox", { name: "Ion stabilizers" }).check();
	await page.getByLabel("One Light ion speed", { exact: true }).fill("360");
	await page.getByRole("button", { name: "Apply & reset" }).click();
	await expect(page.locator(".flight-page")).toHaveAttribute(
		"data-stabilizers",
		"true",
	);
	await page.getByRole("button", { name: "Export JSON" }).click();
	const raw = await page.getByLabel("Trial configuration").inputValue();
	const data = JSON.parse(raw);
	expect(data.loadout.side).toBe("ion");
	expect(data.loadout.aft.every((part: unknown) => part === null)).toBe(true);
	expect(data.loadout.stabilizers).toBe(true);
	expect(data.ion.maxSpeed).toBe(360);
	await page.getByRole("button", { name: "Replay trial", exact: true }).click();
	const x = await page.locator(".flight-page").getAttribute("data-x");
	await page.getByLabel("Trial configuration").fill(raw);
	await page.getByRole("button", { name: "Import JSON" }).click();
	await page.getByRole("button", { name: "Replay trial", exact: true }).click();
	await expect(page.locator(".flight-page")).toHaveAttribute("data-x", x ?? "");
});
