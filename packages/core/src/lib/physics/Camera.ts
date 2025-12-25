import { Vec2 } from "./Physics";

export interface CameraOptions {
	/** Smoothing factor (0 = instant, 1 = no movement) */
	smoothing?: number;
	/** Fixed viewport width (logical units) */
	viewportWidth?: number;
	/** Fixed viewport height (logical units) */
	viewportHeight?: number;
}

/**
 * Camera Director - Smooth tracking for the game viewport.
 * Maintains a fixed 16:9 aspect ratio and interpolates to follow targets.
 */
export class Camera {
	/** Current camera position (center of view) */
	public pos: Vec2;

	/** Target position to follow */
	private target: Vec2;

	/** Smoothing factor (0 = instant snap, higher = more lag) */
	private smoothing: number;

	/** Logical viewport dimensions (game units) */
	public viewportWidth: number;
	public viewportHeight: number;

	constructor(options: CameraOptions = {}) {
		this.pos = new Vec2(0, 0);
		this.target = new Vec2(0, 0);
		this.smoothing = options.smoothing ?? 1.0;

		// Default to 1920x1080 logical resolution (16:9)
		this.viewportWidth = options.viewportWidth ?? 1920;
		this.viewportHeight = options.viewportHeight ?? 1080;
	}

	/**
	 * Set the target position for the camera to follow.
	 */
	setTarget(x: number, y: number): void {
		this.target.set(x, y);
	}

	/**
	 * Update camera position with smooth interpolation.
	 * Call this every frame before rendering.
	 */
	update(dt: number): void {
		// Damped spring interpolation
		const dx = this.target.x - this.pos.x;
		const dy = this.target.y - this.pos.y;
		const distSq = dx * dx + dy * dy;

		// Teleport Detection:
		// If the visual distance is too large (e.g. ship wrapped to other side),
		// snap the camera instantly to prevent a disorienting "pan across the universe".
		// Threshold: 1000px roughly half a screen width, indicating a warp.
		if (distSq > 1000 * 1000) {
			this.pos.set(this.target.x, this.target.y);
			return;
		}

		// Frame-rate independent smoothing
		const factor = Math.min(1, this.smoothing * dt * 60);

		this.pos.x += dx * factor;
		this.pos.y += dy * factor;
	}

	/**
	 * Get the world-to-screen transform offset.
	 * Returns the top-left corner of the viewport in world space.
	 */
	getViewOffset(): { x: number; y: number } {
		return {
			x: this.pos.x - this.viewportWidth / 2,
			y: this.pos.y - this.viewportHeight / 2,
		};
	}

	/**
	 * Convert world coordinates to screen coordinates.
	 */
	worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
		const offset = this.getViewOffset();
		return {
			x: worldX - offset.x,
			y: worldY - offset.y,
		};
	}

	/**
	 * Convert screen coordinates to world coordinates.
	 */
	screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
		const offset = this.getViewOffset();
		return {
			x: screenX + offset.x,
			y: screenY + offset.y,
		};
	}

	/**
	 * Apply camera transform to the rendering context.
	 * Call this before rendering game objects.
	 */
	applyTransform(ctx: CanvasRenderingContext2D): void {
		const offset = this.getViewOffset();
		ctx.translate(-offset.x, -offset.y);
	}

	/**
	 * Reset the camera transform.
	 * Call this after rendering to restore the context state.
	 */
	resetTransform(ctx: CanvasRenderingContext2D): void {
		ctx.setTransform(1, 0, 0, 1, 0, 0);
	}
}
