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
