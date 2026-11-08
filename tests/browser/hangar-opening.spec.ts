import { expect, test } from "../helpers/local-browser";

test("legacy Hangar links retain queries and safe chassis fallback", async ({
	page,
}) => {
	await page.goto("/builder?chassis=fiddler&source=legacy#opening");
	await expect(page).toHaveURL(
		/\/hangar\?chassis=fiddler&source=legacy#opening$/,
	);
	await expect(
		page.getByRole("radio", { name: "Fiddler", exact: true }),
	).toBeChecked();
	await page.goto("/hangar?chassis=invalid");
	await expect(
		page.getByRole("radio", { name: "Scout", exact: true }),
	).toBeChecked({ checked: false });
	await expect(
		page.getByRole("radio", { name: "Fighter", exact: true }),
	).toBeChecked();
});

test("reserved Experimental selection preserves the build and resets on reload", async ({
	page,
}) => {
	await page.goto("/hangar?chassis=fiddler");
	await expect(page.getByText("BUILDS SAVED ON THIS BROWSER")).toBeVisible();
	const saved = await page.evaluate(() =>
		localStorage.getItem("void-drift-builds-v3"),
	);
	const assembly = await page
		.getByRole("region", { name: "Ship assembly" })
		.textContent();
	const off = page.getByRole("radio", { name: "Off", exact: true });
	const on = page.getByRole("radio", { name: "On", exact: true });
	await expect(off).toBeChecked();
	await page.locator("label").filter({ has: on }).click();
	await expect(on).toBeChecked();
	await expect(page.getByText("Not available yet")).toBeVisible();
	await on.focus();
	await page.keyboard.press("ArrowLeft");
	await expect(off).toBeChecked();
	await page.keyboard.press("ArrowRight");
	await expect(on).toBeChecked();
	await expect(
		page.getByRole("radio", { name: "Fiddler", exact: true }),
	).toBeChecked();
	await expect(page.getByRole("region", { name: "Ship assembly" })).toHaveText(
		assembly ?? "",
	);
	expect(
		await page.evaluate(() => localStorage.getItem("void-drift-builds-v3")),
	).toBe(saved);
	await page.reload();
	await expect(off).toBeChecked();
	await page.getByRole("link", { name: "Void Drift", exact: true }).focus();
	await page.keyboard.press("Enter");
	await expect(page).toHaveURL(/\/$/);
	await page.getByRole("link", { name: "HANGAR", exact: true }).click();
	await expect(page).toHaveURL(/\/hangar$/);
	await page.getByRole("link", { name: "Return to title screen" }).focus();
	await page.keyboard.press("Enter");
	await expect(page).toHaveURL(/\/$/);
});

test("shared Lab opening", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto("/lab/builder");
	await expect(
		page.getByRole("heading", { name: "Hangar", exact: true }),
	).toBeVisible();
	await expect(
		page.getByText("SHIP BUILDER LAB / SHARED SYSTEMS"),
	).toBeVisible();
	await page.screenshot({ path: "artifacts/hangar-opening-lab.png" });
	await page.goto("/hangar");
	await expect(
		page.getByRole("radio", { name: "Off", exact: true }),
	).toBeChecked();
	await page.screenshot({ path: "artifacts/hangar-opening.png" });
});
