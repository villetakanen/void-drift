import { expect, it } from "vitest";
import { Vec2 } from "../physics/Physics";
import { EnginePlume, type PlumeOutlet } from "./engine-plume";
import { fxRetention } from "./fx-surface";

const ship = () => ({
	pos: new Vec2(10, 20),
	vel: new Vec2(100, 0),
	acc: new Vec2(0, 0),
	rotation: 0,
	radius: 16,
});
it("only current delivered outlets are retained, with mount position and identity after turning", () => {
	const body = ship(),
		plume = new EnginePlume();
	const emitters = (["ion-light", "ion-heavy", "default"] as const).map(
		(style) => ({ style, x: -5, y: 2, angle: 0.1, output: 1 }),
	);
	plume.stepMounted(1 / 60, body, emitters);
	body.rotation = Math.PI / 2;
	plume.stepMounted(1 / 60, body, emitters);
	const outlets: PlumeOutlet[] = [];
	plume.inspect((outlet) => outlets.push({ ...outlet }));
	expect(outlets.map((outlet) => outlet.style)).toEqual([
		"ion-light",
		"ion-heavy",
		"default",
	]);
	for (const outlet of outlets) {
		expect(outlet.x).toBeCloseTo(8);
		expect(outlet.y).toBeCloseTo(15);
		expect(outlet.angle).toBeCloseTo(Math.PI / 2 + 0.1);
	}
	for (const emitter of emitters) emitter.output = 0;
	plume.stepMounted(1 / 60, body, emitters);
	expect(plume.activeCount).toBe(0);
	const released: PlumeOutlet[] = [];
	plume.inspect((outlet) => released.push({ ...outlet }));
	expect(released).toEqual([]);
});
it("shared image decay depends on elapsed game time, not display frequency", () => {
	expect(fxRetention(0)).toBe(1);
	expect(fxRetention(1 / 60) ** 30).toBeCloseTo(fxRetention(1 / 30) ** 15, 12);
	expect(fxRetention(0.5)).toBeCloseTo(fxRetention(1 / 60) ** 30, 12);
});
