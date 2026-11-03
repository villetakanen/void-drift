import { FxPass } from "./arcade-fx";

/** One game-time decay shared by every source's painted light. */
export const FX_HALF_LIFE = 0.1;
export const FX_QUIET_CLEAR = 0.8;
export const FX_HISTORY_WINDOW = 0.5;
export function fxRetention(seconds: number) {
	return 2 ** (-Math.max(0, seconds) / FX_HALF_LIFE);
}

function sameCamera(a: DOMMatrix, b: DOMMatrix) {
	return (
		a.a === b.a &&
		a.b === b.b &&
		a.c === b.c &&
		a.d === b.d &&
		a.e === b.e &&
		a.f === b.f
	);
}
function buffer(width: number, height: number) {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("FX surface requires Canvas 2D");
	return ctx;
}
interface LightImage {
	ctx: CanvasRenderingContext2D;
	camera?: DOMMatrix;
	epoch: number;
}

/**
 * Pixels remember light, never individual trail objects. Two rolling image
 * windows receive the same decay. Retiring a whole old window guarantees that
 * 8-bit rounding residue disappears even while other sources keep emitting.
 * A third reusable buffer handles camera reprojection; all sources share these.
 */
export class FxSurface {
	readonly pass = new FxPass();
	private images: LightImage[] = [];
	private spare?: CanvasRenderingContext2D;
	private time: number | undefined;
	private lastEmission = -Infinity;

	private erase(image: LightImage) {
		image.ctx.resetTransform();
		image.ctx.clearRect(0, 0, image.ctx.canvas.width, image.ctx.canvas.height);
		image.camera = undefined;
	}
	clear() {
		for (const image of this.images) {
			this.erase(image);
			image.epoch = -Infinity;
		}
		this.time = undefined;
		this.lastEmission = -Infinity;
		this.pass.budget.reset();
	}

	draw(
		target: CanvasRenderingContext2D,
		gameTime: number,
		emit: (ctx: CanvasRenderingContext2D, pass: FxPass) => void,
		additive = true,
	) {
		if (!Number.isFinite(gameTime) || gameTime < 0) return;
		const { width, height } = target.canvas;
		if (!width || !height) return;
		if (
			!this.spare ||
			this.spare.canvas.width !== width ||
			this.spare.canvas.height !== height
		) {
			this.images = Array.from({ length: 2 }, () => ({
				ctx: buffer(width, height),
				epoch: -Infinity,
			}));
			this.spare = buffer(width, height);
			this.clear();
		}
		if (this.time !== undefined && gameTime < this.time) this.clear();
		const camera = target.getTransform();
		const elapsed =
			this.time === undefined
				? Math.min(gameTime, 1 / 60)
				: gameTime - this.time;
		this.time = gameTime;
		if (elapsed > 0) {
			const epoch = Math.floor(gameTime / FX_HISTORY_WINDOW);
			const retention = fxRetention(elapsed);
			for (let index = 0; index < this.images.length; index++) {
				const image = this.images[index];
				const expected = epoch - ((epoch - index + 2) % 2);
				if (image.epoch !== expected) {
					this.erase(image);
					image.epoch = expected;
				}
				if (!image.camera) continue;
				const ctx = image.ctx;
				if (!sameCamera(camera, image.camera)) {
					const next = this.spare;
					next.resetTransform();
					next.clearRect(0, 0, width, height);
					next.setTransform(camera.multiply(image.camera.inverse()));
					next.globalCompositeOperation = "source-over";
					next.globalAlpha = retention;
					next.drawImage(ctx.canvas, 0, 0);
					this.spare = ctx;
					image.ctx = next;
				} else {
					ctx.resetTransform();
					ctx.globalCompositeOperation = "destination-out";
					ctx.globalAlpha = 1 - retention;
					ctx.fillStyle = "#000";
					ctx.fillRect(0, 0, width, height);
				}
				image.camera = camera;
			}
			const active = this.images[epoch % 2];
			const ctx = active.ctx;
			ctx.setTransform(camera);
			// Integrate fresh emission over game time, with no catch-up queue.
			this.pass.begin(
				ctx,
				true,
				Math.min(1, 2.2 * (1 - fxRetention(Math.min(elapsed, 0.1)))),
			);
			try {
				emit(ctx, this.pass);
			} finally {
				this.pass.end(ctx);
			}
			if (this.pass.budget.essential + this.pass.budget.decoration > 0) {
				active.camera = camera;
				this.lastEmission = gameTime;
			} else if (gameTime - this.lastEmission >= FX_QUIET_CLEAR) {
				for (const image of this.images) this.erase(image);
			}
		}
		target.save();
		try {
			target.globalCompositeOperation = additive ? "lighter" : "source-over";
			target.globalAlpha = 1;
			target.shadowBlur = 0;
			target.shadowColor = "transparent";
			target.shadowOffsetX = target.shadowOffsetY = 0;
			target.filter = "none";
			for (const image of this.images) {
				if (!image.camera) continue;
				if (sameCamera(camera, image.camera)) target.resetTransform();
				else target.setTransform(camera.multiply(image.camera.inverse()));
				target.drawImage(image.ctx.canvas, 0, 0);
			}
		} finally {
			target.restore();
		}
	}
}
