import {
	DERELICT_SCALE,
	DERELICT_SOURCE_PLANES,
} from "../../packages/mode-a/src/lib/derelict-geometry";
import { expect, test } from "../helpers/local-browser";

test("shared hull measures 110 units and keeps its energy aperture black after light", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto("/lab/entities/derelict");
	const slider = page.getByRole("slider", { name: "Breakup reference" });
	await slider.fill("1.08");
	await expect(page.locator("output")).toHaveText("1.08 s");
	const bounds = await page.evaluate((planes) => {
		const ns = "http://www.w3.org/2000/svg";
		const svg = document.createElementNS(ns, "svg");
		document.body.append(svg);
		for (const plane of planes) {
			const path = document.createElementNS(ns, "path");
			path.setAttribute("d", plane.d);
			svg.append(path);
		}
		const box = svg.getBBox();
		svg.remove();
		return { width: box.width, height: box.height };
	}, DERELICT_SOURCE_PLANES);
	expect(Math.max(bounds.width, bounds.height) * DERELICT_SCALE).toBeCloseTo(
		110,
		3,
	);
	const centre = {
		x: 350 + (100.05 - 101) * DERELICT_SCALE * 1.6,
		y: 240 + (154.15 - 150) * DERELICT_SCALE * 1.6,
	};
	const hole = await page
		.locator("canvas")
		.evaluate(
			(node, p) =>
				Array.from(
					(node as HTMLCanvasElement)
						.getContext("2d")
						?.getImageData(Math.floor(p.x), Math.floor(p.y), 1, 1).data ?? [],
				),
			centre,
		);
	expect(hole).toEqual([0, 0, 0, 255]);
	await page.getByRole("checkbox", { name: "Energy light" }).uncheck();
	await slider.fill("2");
	await expect(page.locator("output")).toHaveText("2.00 s");
});
