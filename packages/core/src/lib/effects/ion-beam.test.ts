import { expect, it } from "vitest";
import { Vec2 } from "../physics/Physics";
import { EnginePlume, type PlumeMark } from "./engine-plume";

it("detached marks keep their source identity and world motion after turning and release", () => {
	const ship = {
		pos: new Vec2(10, 20),
		vel: new Vec2(100, 0),
		acc: new Vec2(0, 0),
		rotation: 0,
		radius: 16,
	};
	const plume = new EnginePlume();
	const emitters = (["ion-light", "ion-heavy", "default"] as const).map(
		(style) => ({ style, x: -5, y: 0, angle: 0, output: 1 }),
	);
	plume.stepMounted(1 / 60, ship, emitters);
	expect(plume.activeCount).toBe(3);
	for (const e of emitters) e.output = 0;
	ship.rotation = Math.PI / 2;
	plume.stepMounted(0.1, ship, emitters);
	const marks: Readonly<PlumeMark>[] = [];
	plume.inspect((mark) => marks.push({ ...mark }));
	expect(marks.map((m) => m.style)).toEqual([
		"ion-light",
		"ion-heavy",
		"default",
	]);
	for (const mark of marks) {
		expect(mark.angle).toBe(0);
		expect(mark.x).toBeCloseTo(8.5);
		expect(mark.y).toBe(20);
	}
	expect(plume.activeCount).toBe(0);
	plume.stepMounted(0.65, ship, emitters);
	expect(plume.count).toBe(0);
});

it("time, zero output and reset govern emission rather than paint recipes", () => {
	const ship = {
		pos: new Vec2(0, 0),
		vel: new Vec2(0, 0),
		acc: new Vec2(0, 0),
		rotation: 0,
		radius: 16,
	};
	const a = new EnginePlume(),
		b = new EnginePlume();
	a.step(1 / 60, ship, 1, 0);
	b.step(1 / 60, ship, 1, 0);
	for (let i = 0; i < 30; i++) a.step(1 / 60, ship, 0, 0);
	for (let i = 0; i < 15; i++) b.step(1 / 30, ship, 0, 0);
	const ages: number[] = [];
	a.inspect((m) => ages.push(m.age));
	b.inspect((m) => ages.push(m.age));
	expect(ages[0]).toBeCloseTo(ages[1]);
	a.step(0, ship, 1, 1);
	expect(a.count).toBe(1);
	expect(a.activeCount).toBe(0);
	a.clear();
	expect(a.count).toBe(0);
	expect(a.activeCount).toBe(0);
	a.step(1 / 60, ship, Number.NaN, 0);
	expect(a.count).toBe(0);
});
