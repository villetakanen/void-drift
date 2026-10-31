import { Vec2 } from "./Physics";
export interface CameraOptions {
	smoothing?: number;
	viewportWidth?: number;
	viewportHeight?: number;
}
export class Camera {
	public pos = new Vec2(960, 540);
	public zoom = 1;
	public zoomLevel = 0;
	public zoomLevels: number[] = [];
	public viewportWidth: number;
	public viewportHeight: number;
	private target = new Vec2(960, 540);
	private targetZoom = 1;
	private smoothing: number;
	private offset = new Vec2(0, 0);
	private view = { x: 0, y: 0 };
	constructor(options: CameraOptions = {}) {
		this.smoothing = options.smoothing ?? 4;
		this.viewportWidth = options.viewportWidth ?? 1920;
		this.viewportHeight = options.viewportHeight ?? 1080;
	}
	setTarget(x: number, y: number) {
		this.target.set(x, y);
	}
	setOffset(x: number, y: number) {
		this.offset.set(x, y);
	}
	frame(
		shipX: number,
		shipY: number,
		starX: number,
		starY: number,
		padding: number,
		smoothing: number,
		snap = false,
		zoomSteps = 5,
		previewLevel: number | null = null,
	) {
		this.smoothing = smoothing;
		this.target.set((shipX + starX) / 2, (shipY + starY) / 2);
		const fit = Math.min(
			this.viewportWidth / (Math.abs(shipX - starX) + padding * 2),
			this.viewportHeight / (Math.abs(shipY - starY) + padding * 2),
		);
		// The widest view contains the full 1200-unit-radius arena. Levels are
		// evenly spaced by scale ratio, from the whole system to close flight.
		const minimum =
			Math.min(this.viewportWidth, this.viewportHeight) / (2400 + padding * 2);
		if (
			this.zoomLevels.length !== zoomSteps ||
			this.zoomLevels[0] !== minimum
		) {
			this.zoomLevels = Array.from(
				{ length: zoomSteps },
				(_, i) => minimum * (1.6 / minimum) ** (i / (zoomSteps - 1)),
			);
			snap = true;
		}
		let level = 0;
		for (let i = 1; i < this.zoomLevels.length; i++) {
			// Require 8% spare room to zoom back in; zoom out as soon as needed.
			const margin = !snap && i > this.zoomLevel ? 1.08 : 1;
			if (this.zoomLevels[i] * margin <= fit) level = i;
		}
		if (previewLevel !== null)
			level = Math.max(0, Math.min(zoomSteps - 1, previewLevel));
		if (previewLevel === 0) this.target.set(starX, starY);
		this.targetZoom = this.zoomLevels[level];
		if (snap || level !== this.zoomLevel) {
			this.pos.set(this.target.x, this.target.y);
		}
		this.zoomLevel = level;
		this.zoom = this.targetZoom;
	}
	update(dt: number) {
		const amount = 1 - Math.exp(-this.smoothing * dt);
		this.pos.x += (this.target.x - this.pos.x) * amount;
		this.pos.y += (this.target.y - this.pos.y) * amount;
	}
	getViewOffset() {
		this.view.x =
			this.pos.x - this.viewportWidth / (2 * this.zoom) + this.offset.x;
		this.view.y =
			this.pos.y - this.viewportHeight / (2 * this.zoom) + this.offset.y;
		return this.view;
	}
	worldToScreen(x: number, y: number) {
		const offset = this.getViewOffset();
		return { x: (x - offset.x) * this.zoom, y: (y - offset.y) * this.zoom };
	}
	screenToWorld(x: number, y: number) {
		const offset = this.getViewOffset();
		return { x: x / this.zoom + offset.x, y: y / this.zoom + offset.y };
	}
	applyTransform(ctx: CanvasRenderingContext2D) {
		const offset = this.getViewOffset();
		ctx.scale(this.zoom, this.zoom);
		ctx.translate(-offset.x, -offset.y);
	}
	resetTransform(ctx: CanvasRenderingContext2D) {
		ctx.setTransform(1, 0, 0, 1, 0, 0);
	}
}
