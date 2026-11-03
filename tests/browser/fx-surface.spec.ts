import { expect, test } from "../helpers/local-browser";

// Small synthetic stamps test compositing semantics, not the appearance of game art.
test("light accumulates, decays once, freezes on pause and follows the camera", async ({
	page,
}, testInfo) => {
	await page.goto("/lab/fx");
	const result = await page.evaluate(
		async (path) => {
			const { FxSurface } = await import(path);
			const canvas = document.createElement("canvas");
			canvas.width = canvas.height = 128;
			const ctx = canvas.getContext("2d");
			if (!ctx) throw new Error("2D context unavailable");
			const surface = new FxSurface();
			let emissions = 0;
			const emit = (
				light: CanvasRenderingContext2D,
				pass: { opacity: number; budget: { take: () => boolean } },
			) => {
				emissions++;
				pass.budget.take();
				light.globalAlpha = pass.opacity;
				light.fillStyle = "#ffffff";
				light.fillRect(20, 20, 8, 8);
			};
			const render = (time: number, active = true) => {
				ctx.save();
				ctx.resetTransform();
				ctx.clearRect(0, 0, 128, 128);
				ctx.restore();
				surface.draw(ctx, time, active ? emit : () => {});
			};
			const alpha = (x = 24, y = 24) => ctx.getImageData(x, y, 1, 1).data[3];
			render(1 / 60);
			const first = alpha();
			render(2 / 60);
			const overlap = alpha();
			for (let i = 0; i < 10; i++) render(2 / 60);
			const paused = alpha(),
				pausedEmissions = emissions;
			ctx.translate(10, 0);
			ctx.scale(2, 2);
			render(2 / 60);
			const cameraPaused = alpha(58, 48),
				oldPosition = alpha();
			render(2 / 60 + 0.1, false);
			const faded = alpha(58, 48);
			render(2, false);
			const quiet = alpha(58, 48);
			render(2 + 1 / 60);
			surface.clear();
			render(2 + 1 / 60, false);
			const reset = alpha(58, 48);
			return {
				first,
				overlap,
				paused,
				pausedEmissions,
				cameraPaused,
				oldPosition,
				faded,
				quiet,
				reset,
			};
		},
		`/@fs/${new URL("../../packages/core/src/index.ts", `file://${testInfo.project.testDir}/`).pathname}`,
	);
	expect(result.first).toBeGreaterThan(0);
	expect(result.overlap).toBeGreaterThan(result.first);
	expect(result.paused).toBe(result.overlap);
	expect(result.pausedEmissions).toBe(2);
	expect(result.cameraPaused).toBe(result.paused);
	expect(result.oldPosition).toBe(0);
	expect(result.faded).toBeGreaterThan(0);
	expect(result.faded).toBeLessThan(result.cameraPaused);
	expect(result.quiet).toBe(0);
	expect(result.reset).toBe(0);
});

test("shared decay is display-rate independent and a teleported source leaves no connecting line", async ({
	page,
}, testInfo) => {
	await page.goto("/lab/fx");
	const result = await page.evaluate(
		async (path) => {
			const { FxSurface } = await import(path);
			function fixture() {
				const canvas = document.createElement("canvas");
				canvas.width = 128;
				canvas.height = 64;
				const ctx = canvas.getContext("2d");
				if (!ctx) throw new Error("2D context unavailable");
				const surface = new FxSurface();
				const draw = (time: number, x?: number) => {
					ctx.clearRect(0, 0, 128, 64);
					surface.draw(
						ctx,
						time,
						(
							light: CanvasRenderingContext2D,
							pass: { opacity: number; budget: { take: () => boolean } },
						) => {
							if (x === undefined) return;
							pass.budget.take();
							light.globalAlpha = pass.opacity;
							light.fillStyle = "white";
							light.fillRect(x, 20, 8, 8);
						},
					);
				};
				return {
					draw,
					alpha: (x: number) => ctx.getImageData(x, 24, 1, 1).data[3],
				};
			}
			const slow = fixture(),
				fast = fixture(),
				wrap = fixture();
			for (const f of [slow, fast, wrap]) f.draw(1 / 60, 20);
			for (let i = 1; i <= 6; i++) slow.draw(1 / 60 + i / 30);
			for (let i = 1; i <= 12; i++) fast.draw(1 / 60 + i / 60);
			wrap.draw(2 / 60, 100);
			return {
				slow: slow.alpha(24),
				fast: fast.alpha(24),
				old: wrap.alpha(24),
				fresh: wrap.alpha(104),
				between: wrap.alpha(64),
			};
		},
		`/@fs/${new URL("../../packages/core/src/index.ts", `file://${testInfo.project.testDir}/`).pathname}`,
	);
	expect(result.slow).toBeGreaterThan(0);
	expect(Math.abs(result.slow - result.fast)).toBeLessThanOrEqual(3);
	expect(result.old).toBeGreaterThan(0);
	expect(result.fresh).toBeGreaterThan(result.old);
	expect(result.between).toBe(0);
});

test("old light becomes fully transparent while other sources keep emitting", async ({
	page,
}, testInfo) => {
	await page.goto("/lab/fx");
	const result = await page.evaluate(
		async (path) => {
			const { FxSurface } = await import(path);
			const canvas = document.createElement("canvas");
			canvas.width = 128;
			canvas.height = 64;
			const ctx = canvas.getContext("2d");
			if (!ctx) throw new Error("2D context unavailable");
			const surface = new FxSurface();
			let early = 0;
			for (let tick = 1; tick <= 90; tick++) {
				ctx.clearRect(0, 0, 128, 64);
				surface.draw(
					ctx,
					tick / 60,
					(
						light: CanvasRenderingContext2D,
						pass: { opacity: number; budget: { take: () => boolean } },
					) => {
						light.globalAlpha = pass.opacity;
						light.fillStyle = "white";
						pass.budget.take();
						light.fillRect(100, 20, 8, 8);
						if (tick === 1) {
							pass.budget.take();
							light.fillRect(20, 20, 8, 8);
						}
					},
				);
				if (tick === 5) early = ctx.getImageData(24, 24, 1, 1).data[3];
			}
			return {
				early,
				old: ctx.getImageData(24, 24, 1, 1).data[3],
				active: ctx.getImageData(104, 24, 1, 1).data[3],
			};
		},
		`/@fs/${new URL("../../packages/core/src/index.ts", `file://${testInfo.project.testDir}/`).pathname}`,
	);
	expect(result.early).toBeGreaterThan(0);
	expect(result.old).toBe(0);
	expect(result.active).toBeGreaterThan(0);
});
