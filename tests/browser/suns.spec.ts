import { expect, test } from "../helpers/local-browser";

for (const density of [1, 2]) {
	test.describe(`standard Sun at density ${density}`, () => {
		test.use({
			viewport: { width: 1440, height: 1000 },
			deviceScaleFactor: density,
		});
		test("live effects and fixed CSS geometry follow the Wasp", async ({
			page,
		}) => {
			const errors: string[] = [];
			page.on("pageerror", (error) => errors.push(error.message));
			await page.clock.install();
			await page.addInitScript(() => {
				type Stroke = {
					width: number;
					dash: number[];
					radius: number;
					alpha: number;
				};
				const surface = window as unknown as {
					sunStrokes: Stroke[];
					sunFills: number[];
				};
				surface.sunStrokes = [];
				surface.sunFills = [];
				const proto = CanvasRenderingContext2D.prototype;
				const stroke = proto.stroke,
					arc = proto.arc,
					fill = proto.fill;
				const radii = new WeakMap<CanvasRenderingContext2D, number>();
				proto.arc = function (...args: Parameters<typeof arc>) {
					radii.set(this, args[2]);
					return arc.apply(this, args);
				};
				proto.stroke = function (path?: Path2D) {
					if (
						this.canvas.getAttribute("aria-label") ===
						"Live standard Sun and Wasp simulation"
					) {
						const t = this.getTransform(),
							factor =
								(Math.hypot(t.a, t.b) * this.canvas.clientWidth) /
								this.canvas.width;
						surface.sunStrokes.push({
							width: this.lineWidth * factor,
							dash: this.getLineDash().map((v) => v * factor),
							radius: (radii.get(this) ?? 0) * factor,
							alpha: this.globalAlpha,
						});
						surface.sunStrokes = surface.sunStrokes.slice(-80);
					}
					Reflect.apply(stroke, this, path ? [path] : []);
				};
				proto.fill = function (
					pathOrRule?: Path2D | CanvasFillRule,
					fillRule?: CanvasFillRule,
				) {
					if (
						this.canvas.getAttribute("aria-label") ===
						"Live standard Sun and Wasp simulation"
					) {
						surface.sunFills.push(this.globalAlpha);
						surface.sunFills = surface.sunFills.slice(-80);
					}
					Reflect.apply(
						fill,
						this,
						pathOrRule === undefined ? [] : [pathOrRule, fillRule],
					);
				};
			});
			await page.goto("/lab/entities/star");
			await expect(
				page.getByRole("heading", { name: "A bargain inside the well" }),
			).toBeVisible();
			const bench = page.locator(".bench");
			await bench.scrollIntoViewIfNeeded();
			await expect(bench).toHaveAttribute("data-ready", "true");
			await expect(bench).toHaveAttribute("data-power", "50");
			for (const zoom of [0.35, 1.6]) {
				await page.getByRole("slider", { name: "Sun zoom" }).fill(String(zoom));
				await page.clock.runFor(50);
				const geometry = await page.evaluate(() => {
					const rows = (
						window as unknown as {
							sunStrokes: {
								width: number;
								dash: number[];
								radius: number;
								alpha: number;
							}[];
						}
					).sunStrokes;
					const gravityIndex = rows.findLastIndex(
						(r) => Math.abs(r.dash[0] - 5) < 0.001,
					);
					return rows.slice(gravityIndex, gravityIndex + 3);
				});
				expect(geometry).toHaveLength(3);
				geometry.forEach((row) => {
					expect(row.width).toBeCloseTo(1, 5);
				});
				expect(geometry[0].radius - geometry[1].radius).toBeCloseTo(2, 5);
				expect(geometry[0].dash[0]).toBeCloseTo(5, 5);
				expect(geometry[0].dash[1]).toBeCloseTo(5, 5);
				expect(geometry[1].dash).toEqual([]);
				expect(geometry[2].dash[0]).toBeCloseTo(1);
				expect(geometry[2].dash[1]).toBeCloseTo(4);
			}
			await page.getByRole("slider", { name: "Sun zoom" }).fill("0.8");
			await page
				.getByRole("button", { name: "Run flight", exact: true })
				.click();
			await page.clock.runFor(100);
			expect(
				Number(await bench.getAttribute("data-collection")),
			).toBeGreaterThan(0);
			expect(Number(await bench.getAttribute("data-power"))).toBeGreaterThan(
				50,
			);
			expect(Number(await bench.getAttribute("data-damage"))).toBe(0);
			await page
				.getByRole("button", { name: "Pause flight", exact: true })
				.click();
			await page
				.getByRole("spinbutton", { name: "Start distance", exact: true })
				.fill("320");
			await page.getByRole("checkbox", { name: "Both thrusters" }).check();
			await page
				.getByRole("button", { name: "Reset flight", exact: true })
				.click();
			await page
				.getByRole("button", { name: "Run flight", exact: true })
				.click();
			await page.clock.runFor(100);
			expect(
				Number(await bench.getAttribute("data-collection")),
			).toBeGreaterThan(0);
			expect(Number(await bench.getAttribute("data-power"))).toBeLessThan(50);
			await page
				.getByRole("button", { name: "Pause flight", exact: true })
				.click();
			await page.getByRole("checkbox", { name: "Both thrusters" }).uncheck();
			await page
				.getByRole("spinbutton", { name: "Start distance", exact: true })
				.fill("180");
			await page
				.getByRole("spinbutton", { name: "Starting energy", exact: true })
				.fill("100");
			await page
				.getByRole("button", { name: "Reset flight", exact: true })
				.click();
			const capacity = Number(await bench.getAttribute("data-power"));
			await page
				.getByRole("button", { name: "Run flight", exact: true })
				.click();
			await page.clock.runFor(100);
			expect(
				Number(await bench.getAttribute("data-collection")),
			).toBeGreaterThan(0);
			expect(Number(await bench.getAttribute("data-power"))).toBe(capacity);
			await page
				.getByRole("button", { name: "Pause flight", exact: true })
				.click();
			await page
				.getByRole("spinbutton", { name: "Start distance", exact: true })
				.fill("80");
			await page
				.getByRole("button", { name: "Reset flight", exact: true })
				.click();
			await page
				.getByRole("button", { name: "Run flight", exact: true })
				.click();
			await page.clock.runFor(100);
			expect(Number(await bench.getAttribute("data-damage"))).toBeGreaterThan(
				0,
			);
			expect(Number(await bench.getAttribute("data-hull"))).toBeLessThan(100);
			const fills = await page.evaluate(
				() => (window as unknown as { sunFills: number[] }).sunFills,
			);
			expect(fills).toContain(0.033);
			expect(fills).toContain(0.11);
			await page
				.getByRole("button", { name: "Pause flight", exact: true })
				.click();
			await page.screenshot({ path: `/tmp/suns-live-dpr-${density}.png` });
			if (density === 1) {
				await page
					.getByRole("heading", { name: "A bargain inside the well" })
					.scrollIntoViewIfNeeded();
				await page.screenshot({ path: "/tmp/suns-article-top.png" });
				await page
					.locator("article table")
					.screenshot({ path: "/tmp/suns-zones.png" });
			}
			expect(errors).toEqual([]);
		});
	});
}

for (const route of ["/lab/instrument", "/lab/gravity-tuning"]) {
	test(`Path energy controls preserve analysis and export in ${route}`, async ({
		page,
	}) => {
		await page.goto(route);
		await page.getByRole("button", { name: "Open values" }).first().click();
		await page.getByRole("checkbox", { name: "Energy analysis" }).check();
		const peak = page
			.getByRole("group", { name: "Collection 1" })
			.getByRole("spinbutton", { name: "peak", exact: true });
		await peak.fill("9");
		await peak.dispatchEvent("change");
		await expect(peak).toHaveValue("9");
		await expect(page.locator(".pane pre")).toContainText('"peak": 9');
		await page
			.getByRole("button", { name: "Close values", exact: true })
			.click();
		await expect(page.locator(".graph")).toHaveCount(4);
	});
}
