import { expect, test } from "../helpers/local-browser";

// Contract: docs/specs/gravity-tuning.md.
test.use({ viewport: { width: 1366, height: 1024 } });

const documentText = (page: import("@playwright/test").Page) =>
	page.locator(".pane pre").textContent();

test("the bench draws four ships, the well and three graphs", async ({
	page,
}) => {
	await page.goto("/lab/gravity-tuning");
	await expect(
		page.getByRole("list", { name: "Vehicles" }).getByRole("listitem"),
	).toHaveCount(4);
	await expect(page.locator(".graph .head .name")).toHaveText([
		"Speed",
		"Gravity",
		"Distance to well",
	]);
	await expect(page.locator(".reach.lab")).toHaveCount(1);
	await expect(page.locator(".lab-surface")).toHaveCount(1);
	await expect(page.locator(".reference")).toHaveCount(4);
	expect(
		await page.locator('polyline[stroke-dasharray="2 5"]').count(),
	).toBeGreaterThanOrEqual(4);
	await expect(page.getByRole("radiogroup", { name: "Burn" })).toBeVisible();
});

test("a setting redraws the bench and reaches the document; an impossible one is refused", async ({
	page,
}) => {
	await page.goto("/lab/gravity-tuning");
	const speed = page.locator(".graph .head").first();
	const before = await speed.textContent();
	await page.getByRole("button", { name: "Open values" }).click();
	await expect(page.getByRole("radiogroup", { name: "Falloff" })).toBeVisible();
	await expect(
		page
			.getByRole("list", { name: "Surface pull against each ship's thrust" })
			.getByRole("listitem"),
	).toHaveCount(4);
	const size = page.locator("#gt-well-cutoff");
	await size.fill("25");
	await size.press("Tab");
	await expect(page.locator(".pane pre")).toContainText('"cutoff": 25');
	await expect(speed).not.toHaveText(before ?? "");
	const shown = await size.inputValue();
	await size.fill("0");
	await size.press("Tab");
	await expect(size).toHaveValue(shown);
	await expect(page.getByRole("alert")).toBeVisible();
});

test("dragging the well moves it in the document", async ({ page }) => {
	await page.goto("/lab/gravity-tuning");
	// The handle is server-rendered; drag only once the bench has hydrated.
	await page.waitForSelector("astro-island:not([ssr])");
	await page.getByRole("button", { name: "Open values" }).click();
	const defaults = JSON.parse((await documentText(page)) ?? "{}").well;
	await page.getByRole("button", { name: "Close values" }).click();
	const handle = page.locator(".handle");
	const box = await handle.boundingBox();
	if (!box) throw new Error("well handle not drawn");
	const x = box.x + box.width / 2;
	const y = box.y + box.height / 2;
	await page.mouse.move(x, y);
	await page.mouse.down();
	await page.mouse.move(x + 40, y + 30, { steps: 5 });
	await page.mouse.up();
	await page.getByRole("button", { name: "Open values" }).click();
	const doc = JSON.parse((await documentText(page)) ?? "{}");
	expect(doc.well.x).not.toBe(defaults.x);
	expect(doc.well.y).not.toBe(defaults.y);
});
