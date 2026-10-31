import { expect, it } from "vitest";
import { Vec2 } from "../physics/Physics";
import { EnginePlume, type PlumeEmitter } from "./engine-plume";

function recordingContext() {
	const calls: unknown[][] = [];
	const gradient = {
		addColorStop: (...args: unknown[]) => calls.push(["stop", ...args]),
	};
	const ctx = new Proxy(
		{},
		{
			set(_target, key, value) {
				calls.push(["set", key, value === gradient ? "gradient" : value]);
				return true;
			},
			get(_target, key) {
				return (...args: unknown[]) => {
					calls.push([key, ...args]);
					return gradient;
				};
			},
		},
	) as CanvasRenderingContext2D;
	return { ctx, calls };
}
const body = () => ({
	pos: new Vec2(10, 20),
	vel: new Vec2(100, 0),
	acc: new Vec2(0, 0),
	rotation: 0,
	radius: 16,
});
const emitter = (style?: PlumeEmitter["style"]): PlumeEmitter => ({
	x: -5,
	y: 0,
	angle: 0,
	output: 1,
	style,
});
it("untyped and explicit default marks preserve the same generic drawing", () => {
	const traces = [undefined, "default" as const].map((style) => {
		const plume = new EnginePlume();
		plume.stepMounted(1 / 60, body(), [emitter(style)]);
		const record = recordingContext();
		plume.draw(record.ctx);
		return record.calls;
	});
	expect(traces[0]).toEqual(traces[1]);
	expect(traces[0].filter((c) => c[0] === "ellipse")).toHaveLength(1);
});
it("mixed marks retain their original palettes and world heading after mount changes and release", () => {
	const plume = new EnginePlume();
	const ship = body();
	const emitters = [emitter("ion-light"), emitter("ion-heavy"), emitter()];
	plume.stepMounted(1 / 60, ship, emitters);
	for (const e of emitters) {
		e.style = "default";
		e.output = 0;
	}
	ship.rotation = Math.PI / 2;
	plume.stepMounted(0.1, ship, emitters);
	const { ctx, calls } = recordingContext();
	plume.draw(ctx);
	expect(calls.filter((c) => c[0] === "fillRect")).toHaveLength(8);
	expect(calls.filter((c) => c[0] === "ellipse")).toHaveLength(1);
	expect(calls).toContainEqual(["set", "shadowColor", "#25e9d2"]);
	expect(calls).toContainEqual(["set", "shadowColor", "#25cfe9"]);
	expect(calls.filter((c) => c[0] === "rotate").map((c) => c[1])).toEqual([
		0, 0, 0,
	]);
	expect(calls).toContainEqual(["translate", 8.5, 20]);
	plume.stepMounted(0.65, ship, emitters);
	expect(plume.count).toBe(0);
});
