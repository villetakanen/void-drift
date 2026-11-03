import { expect, test } from "../helpers/local-browser";

test("fit weapons, salvage, collect, summon, reset and return through the Hangar", async ({
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
	const send = page.getByRole("button", { name: "Send derelict", exact: true });
	await expect(send).toBeEnabled();
	await page.clock.runFor(7200);
	await page.keyboard.down("ArrowUp");
	await page.clock.runFor(1500);
	await page.keyboard.up("ArrowUp");
	await expect(flight).toHaveAttribute("data-salvage-destroyed", "1");
	await expect
		.poll(async () => Number(await flight.getAttribute("data-rail-shots")))
		.toBeGreaterThan(0);
	await expect
		.poll(async () =>
			Number(await flight.getAttribute("data-salvage-collected")),
		)
		.toBeGreaterThan(0);
	await expect(page.getByRole("status")).toContainText("energy collected");
	await page.getByRole("button", { name: "Pause", exact: true }).click();
	const paused = await flight.getAttribute("data-ticks");
	await expect(send).toBeDisabled();
	await page.clock.runFor(1000);
	await expect(flight).toHaveAttribute("data-ticks", paused ?? "");
	await page.getByRole("button", { name: "Resume", exact: true }).click();
	await send.click();
	await page.clock.runFor(32);
	await expect(flight).toHaveAttribute("data-salvage-passes", "2");
	await expect(send).toBeDisabled();
	await page.getByRole("button", { name: "Reset flight" }).click();
	await expect(flight).toHaveAttribute("data-salvage-passes", "0");
	await expect(flight).toHaveAttribute("data-salvage-collected", "0");
	await expect(flight).toHaveAttribute("data-rail-shots", "0");
	await page.getByRole("button", { name: "Return to builder" }).click();
	await expect(
		page.getByRole("button", { name: "Hull 1 · Equipment: Rail gun" }),
	).toBeVisible();
	await page.getByRole("button", { name: /^Laser\b/ }).click();
	await page.getByRole("button", { name: "Test flight", exact: true }).click();
	await page.clock.runFor(11000);
	await expect
		.poll(async () => Number(await flight.getAttribute("data-laser-pulses")))
		.toBeGreaterThan(0);
	await page.getByRole("button", { name: "Return to builder" }).click();
	await page
		.getByRole("button", { name: "Start survival", exact: true })
		.click();
	await expect(send).toHaveCount(0);
	await page.clock.runFor(4000);
	await expect(flight).toHaveAttribute("data-salvage-passes", "0");
	await expect(flight).toHaveAttribute("data-rail-shots", "0");
	await expect(flight).toHaveAttribute("data-laser-pulses", "0");
});

test("landscape weapon trials retain simultaneous engine input and release", async ({
	page,
	context,
}) => {
	const time = new Date("2026-11-03T00:00:00Z");
	await page.clock.install({ time });
	await page.clock.pauseAt(time);
	await page.setViewportSize({ width: 844, height: 390 });
	await page.goto("/lab/builder?chassis=wasp");
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
	await expect(
		page.getByRole("button", { name: "Send derelict" }),
	).toBeVisible();
	await page.getByRole("button", { name: "Send derelict" }).click();
	await page.clock.runFor(32);
	await expect(page.locator(".flight-page")).toHaveAttribute(
		"data-salvage-passes",
		"1",
	);
});
