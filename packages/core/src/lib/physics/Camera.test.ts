import { expect, it } from "vitest";
import { Camera } from "./Camera";

it("frames ship and star and round-trips coordinates at every edge", () => {
	for (const [x, y] of [
		[-230, 540],
		[2150, 540],
		[960, -650],
		[960, 1730],
	]) {
		const c = new Camera();
		c.frame(x, y, 960, 540, 160, 4, true);
		for (const [wx, wy] of [
			[x, y],
			[960, 540],
		]) {
			const screen = c.worldToScreen(wx, wy);
			expect(screen.x).toBeGreaterThan(0);
			expect(screen.x).toBeLessThan(c.viewportWidth);
			expect(screen.y).toBeGreaterThan(0);
			expect(screen.y).toBeLessThan(c.viewportHeight);
			expect(c.screenToWorld(screen.x, screen.y).x).toBeCloseTo(wx);
			expect(c.screenToWorld(screen.x, screen.y).y).toBeCloseTo(wy);
		}
	}
});
it("reframes immediately on a wrap instead of panning across the arena", () => {
	const c = new Camera();
	c.frame(2150, 540, 960, 540, 160, 4, true);
	c.frame(-230, 540, 960, 540, 160, 4, true);
	expect(c.pos.x).toBe(365);
});

it("snaps only to configured levels in both directions without aging world effects", () => {
	for (let count = 4; count <= 11; count++) {
		const c = new Camera();
		const visited = new Set<number>();
		for (const distance of [0, 300, 600, 900, 1190, 900, 600, 300, 0]) {
			c.frame(960, 540 + distance, 960, 540, 160, 4, false, count);
			const zoom = c.zoom;
			c.update(1 / 60);
			expect(c.zoom).toBe(zoom);
			expect(c.zoomLevels).toHaveLength(count);
			expect(c.zoomLevels).toContain(zoom);
			visited.add(zoom);
			const effect = c.worldToScreen(1000, 600);
			expect(c.screenToWorld(effect.x, effect.y)).toEqual({ x: 1000, y: 600 });
		}
		expect(visited.size).toBeGreaterThan(1);
	}
});

it("holds the wider level near a threshold and previews every level", () => {
	const c = new Camera();
	c.frame(960, 540, 960, 540, 160, 4, true);
	const threshold = c.zoomLevels[3];
	const distance = c.viewportHeight / threshold - 320;
	c.frame(960, 540 + distance + 1, 960, 540, 160, 4);
	const wider = c.zoom;
	c.frame(960, 540 + distance - 1, 960, 540, 160, 4);
	expect(c.zoom).toBe(wider);
	for (let i = 0; i < 5; i++) {
		c.frame(960, 540, 960, 540, 160, 4, false, 5, i);
		expect(c.zoom).toBe(c.zoomLevels[i]);
	}
});
