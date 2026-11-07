import { expect, test } from "../helpers/local-browser";

test("player release leaves a fixed pulse while the hollow energy square moves away", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1280, height: 1000 });
	await page.goto("/lab/entities/derelict");
	const bench = page.getByRole("region", {
		name: "Physical shedding specimen",
	});
	await bench.getByRole("button", { name: "Rail shot", exact: true }).click();
	await expect(bench.getByRole("status")).toContainText(
		"Hull 0 / 85 · Fragments 8 · Energy cells 1",
	);
	const before = {
		x: Number(await bench.getAttribute("data-energy-x")),
		y: Number(await bench.getAttribute("data-energy-y")),
	};
	const pulse = {
		x: await bench.getAttribute("data-pulse-x"),
		y: await bench.getAttribute("data-pulse-y"),
	};
	expect(pulse.x).not.toBeNull();
	expect(pulse.y).not.toBeNull();
	await bench.getByRole("button", { name: "Coast 0.1 s" }).click();
	const after = {
		x: Number(await bench.getAttribute("data-energy-x")),
		y: Number(await bench.getAttribute("data-energy-y")),
	};
	expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeCloseTo(
		4.5,
		3,
	);
	await expect(bench).toHaveAttribute("data-pulse-x", pulse.x ?? "");
	await expect(bench).toHaveAttribute("data-pulse-y", pulse.y ?? "");
	const pixel = await bench
		.locator("canvas")
		.evaluate(
			(node, p) =>
				Array.from(
					(node as HTMLCanvasElement)
						.getContext("2d")
						?.getImageData(
							Math.floor(480 + (p.x - 1240) * 2),
							Math.floor(180 + (p.y - 540) * 2),
							1,
							1,
						).data ?? [],
				),
			after,
		);
	expect(pixel).toEqual([0, 0, 0, 255]);
	await bench.getByRole("button", { name: "Coast 0.5 s" }).click();
	expect(await bench.getAttribute("data-pulse-x")).toBeNull();
	await expect(bench.getByRole("status")).toContainText("Energy cells 1");
	await bench.getByRole("button", { name: "Reset specimen" }).click();
	expect(await bench.getAttribute("data-energy-x")).toBeNull();
	expect(await bench.getAttribute("data-pulse-x")).toBeNull();
});
