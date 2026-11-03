import { expect, test } from "../helpers/local-browser";

test("mount layout editing, linked handoff, undo and invalid import", async ({
	page,
}) => {
	await page.goto("/lab/mount-planner");
	await expect(page.locator("[data-ready=true]")).toBeVisible();
	await page.getByLabel("Mount X", { exact: true }).fill("-18.125");
	await page.getByLabel("Mount X", { exact: true }).press("Tab");
	await page.getByRole("button", { name: "right ↔", exact: true }).click();
	await expect(page.getByLabel("Mount X", { exact: true })).toHaveValue(
		"-18.125",
	);
	await page.getByRole("button", { name: "Copy layout", exact: true }).click();
	await page.getByText("Load / inspect document", { exact: true }).click();
	const exported = await page.getByLabel("Layout document").inputValue();
	const document = JSON.parse(exported);
	expect(document.mounts.map((m: { angle: number }) => m.angle)).toEqual(
		document.baseline.map((m: { angle: number }) => m.angle),
	);
	expect(
		JSON.parse(exported).mounts.find((m: { key: string }) => m.key === "left")
			.x,
	).toBe(-18.125);
	await page.getByRole("button", { name: "Undo", exact: true }).click();
	await expect(page.getByLabel("Mount X", { exact: true })).not.toHaveValue(
		"-18.125",
	);
	await page.getByLabel("Layout document").fill(exported);
	await page
		.getByRole("button", { name: "Load document", exact: true })
		.click();
	await expect(page.getByLabel("Mount X", { exact: true })).toHaveValue(
		"-18.125",
	);
	await page.getByLabel("Layout document").fill("{}");
	await page
		.getByRole("button", { name: "Load document", exact: true })
		.click();
	await expect(page.getByLabel("Mount X", { exact: true })).toHaveValue(
		"-18.125",
	);
});

test("designer links mirrored mounts at a compact viewport", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1180, height: 820 });
	await page.goto("/lab/mount-planner");
	await expect(page.locator("[data-ready=true]")).toBeVisible();
	await page
		.getByRole("radiogroup", { name: "Ship", exact: true })
		.getByText("wasp", { exact: true })
		.click();
	await page
		.getByRole("group", { name: "Mirror partner" })
		.getByRole("button", { name: "hull-1", exact: true })
		.click();
	await page
		.getByRole("button", { name: "Link mirrored pair", exact: true })
		.click();
	await page.getByLabel("Mount Y", { exact: true }).fill("-20");
	await page.getByLabel("Mount Y", { exact: true }).press("Tab");
	await page.getByRole("button", { name: "hull-1 ↔", exact: true }).click();
	await expect(page.getByLabel("Mount Y", { exact: true })).toHaveValue("20");
	await page.getByRole("button", { name: "Unlink pair", exact: true }).click();
	await expect(page.getByLabel("Mirror partner")).toBeVisible();
});

test("view modes and automatic framing preserve mount values", async ({
	page,
}) => {
	await page.goto("/lab/mount-planner");
	await expect(page.locator("[data-ready=true]")).toBeVisible();
	const initial = await page
		.getByLabel("Mount X", { exact: true })
		.inputValue();
	const zoom = page.getByLabel("Zoom", { exact: true });
	const before = Number(await zoom.inputValue());
	await page.setViewportSize({ width: 1440, height: 1000 });
	await expect
		.poll(async () => Number(await zoom.inputValue()))
		.not.toBe(before);
	await page
		.getByRole("radiogroup", { name: "Mount contents" })
		.getByText("In-game", { exact: true })
		.click();
	await expect(page.getByLabel("Mount X", { exact: true })).toHaveValue(
		initial,
	);
	await page
		.getByRole("radiogroup", { name: "Mount contents" })
		.getByText("Empty", { exact: true })
		.click();
	await expect(page.getByLabel("Mount X", { exact: true })).toHaveValue(
		initial,
	);
	await page.getByRole("button", { name: "Fit ship", exact: true }).click();
});
