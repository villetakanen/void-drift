import { Vec2 } from "./Physics";
export interface CameraOptions {
	smoothing?: number;
	viewportWidth?: number;
	viewportHeight?: number;
}
export class Camera {
	public pos = new Vec2(960, 540);
	public zoom = 1;
	public viewportWidth: number;
	public viewportHeight: number;
	private target = new Vec2(960, 540);
	private targetZoom = 1;
	private smoothing: number;
	private offset = new Vec2(0, 0);
	private view = { x: 0, y: 0 };
	constructor(options: CameraOptions = {}) {
		this.smoothing = options.smoothing ?? 4;
		this.viewportWidth = options.viewportWidth ?? 1280;
		this.viewportHeight = options.viewportHeight ?? 720;
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
	) {
		this.smoothing = smoothing;
		this.target.set((shipX + starX) / 2, (shipY + starY) / 2);
		this.targetZoom = Math.min(
			1.6,
			this.viewportWidth / (Math.abs(shipX - starX) + padding * 2),
			this.viewportHeight / (Math.abs(shipY - starY) + padding * 2),
		);
		if (snap) {
			this.pos.set(this.target.x, this.target.y);
			this.zoom = this.targetZoom;
		}
	}
	update(dt: number) {
		const amount = 1 - Math.exp(-this.smoothing * dt);
		this.pos.x += (this.target.x - this.pos.x) * amount;
		this.pos.y += (this.target.y - this.pos.y) * amount;
		// Zoom out immediately enough to retain targets, ease into a closer view.
		this.zoom =
			this.targetZoom < this.zoom
				? this.targetZoom
				: this.zoom + (this.targetZoom - this.zoom) * amount;
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
