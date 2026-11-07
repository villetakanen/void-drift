import { expect, test } from "../helpers/local-browser";

test("armed practice has full resources, no encounters and fresh entry after abort", async ({
	page,
}) => {
	const time = new Date("2026-11-03T00:00:00Z");
	await page.clock.install({ time });
	await page.clock.pauseAt(time);
	await page.goto("/builder?chassis=fighter");
	await page.getByRole("button", { name: "Hull 1 · Equipment: Empty" }).click();
	await page.getByRole("button", { name: /^Rail gun\b/ }).click();
	await page.getByRole("button", { name: "Test flight", exact: true }).click();
	const flight = page.locator(".flight-page");
	const initialX = await flight.getAttribute("data-x");
	const initialY = await flight.getAttribute("data-y");
	const power = page.getByRole("progressbar", { name: "Power" });
	const capacity = await power.getAttribute("max");
	await expect(
		page.getByRole("button", { name: /Reset flight|Send derelict/ }),
	).toHaveCount(0);
	await expect(page.locator(".timer")).toHaveCount(0);
	await page.keyboard.down("ArrowUp");
	await page.clock.runFor(12000);
	await page.keyboard.up("ArrowUp");
	await expect(power).toHaveAttribute("value", capacity ?? "");
	await expect(page.getByRole("progressbar", { name: "Hull" })).toHaveAttribute(
		"value",
		"100",
	);
	await expect(flight).toHaveAttribute("data-status", "PLAYING");
	for (const name of [
		"data-salvage-passes",
		"data-rail-shots",
		"data-salvage-bodies",
	])
		await expect(flight).toHaveAttribute(name, "0");
	await page.getByRole("button", { name: "Pause", exact: true }).click();
	const ticks = await flight.getAttribute("data-ticks");
	await page.clock.runFor(1000);
	await expect(flight).toHaveAttribute("data-ticks", ticks ?? "");
	await page.getByRole("button", { name: "Resume", exact: true }).click();
	await page.clock.runFor(100);
	await expect(flight).not.toHaveAttribute("data-ticks", ticks ?? "");
	await page.getByRole("button", { name: "Pause", exact: true }).click();
	await page.getByRole("button", { name: "Abort", exact: true }).click();
	await expect(
		page.getByRole("button", { name: "Hull 1 · Equipment: Rail gun" }),
	).toBeVisible();
	await page.getByRole("button", { name: "Test flight", exact: true }).click();
	await expect(flight).toHaveAttribute("data-x", initialX ?? "");
	await expect(flight).toHaveAttribute("data-y", initialY ?? "");
	await expect(page.getByRole("button", { name: "Save Score" })).toHaveCount(0);
});

test("landscape practice retain simultaneous engine input and release", async ({
	page,
	context,
}) => {
	const time = new Date("2026-11-03T00:00:00Z");
	await page.clock.install({ time });
	await page.clock.pauseAt(time);
	await page.setViewportSize({ width: 844, height: 390 });
	await page.goto("/builder?chassis=wasp");
	await page
		.getByRole("button", { name: "Left wing · Equipment: Empty" })
		.click();
	await page.getByRole("button", { name: /^Laser\b/ }).click();
	await page.getByRole("button", { name: "Test flight", exact: true }).click();
	const left = page.getByRole("button", { name: "Left engine", exact: true });
	const right = page.getByRole("button", { name: "Right engine", exact: true });
	const a = await left.boundingBox(),
		b = await right.boundingBox();
	if (!a || !b) throw new Error("Touch controls missing");
	const client = await context.newCDPSession(page);
	await client.send("Input.dispatchTouchEvent", {
		type: "touchStart",
		touchPoints: [
			{ x: a.x + a.width / 2, y: a.y + a.height / 2, id: 1 },
			{ x: b.x + b.width / 2, y: b.y + b.height / 2, id: 2 },
		],
	});
	await page.clock.runFor(500);
	await expect(left).toHaveClass(/active/);
	await expect(right).toHaveClass(/active/);
	await client.send("Input.dispatchTouchEvent", {
		type: "touchCancel",
		touchPoints: [],
	});
	await page.clock.runFor(32);
	await expect(left).not.toHaveClass(/active/);
	await expect(right).not.toHaveClass(/active/);
	await expect(page.getByRole("button", { name: "Send derelict" })).toHaveCount(
		0,
	);
});
