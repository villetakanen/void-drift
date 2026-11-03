import { expect, it } from "vitest";
import { FxBudget, FxSparks } from "./arcade-fx";

it("saturated decoration retains reserved activation capacity and resets per frame", () => {
	const budget = new FxBudget();
	for (let i = 0; i < 10000; i++) budget.take();
	expect(budget.decoration).toBe(FxBudget.DECORATION);
	expect(budget.dropped).toBe(10000 - FxBudget.DECORATION);
	expect(budget.take(true)).toBe(true);
	for (let i = 0; i < 10000; i++) budget.take(true);
	expect(budget.essential).toBe(FxBudget.ESSENTIAL);
	budget.reset();
	expect(budget.dropped).toBe(0);
	expect(budget.take()).toBe(true);
});

it("burst overload has bounded memory and no deferred queue, with game-time expiry", () => {
	const sparks = new FxSparks();
	sparks.burst(0, 0, 100000, 2026);
	expect(sparks.count).toBe(FxSparks.CAPACITY);
	sparks.step(0);
	expect(sparks.count).toBe(FxSparks.CAPACITY);
	sparks.burst(0, 0, 100000, 2027);
	expect(sparks.count).toBe(FxSparks.CAPACITY);
	sparks.step(1);
	expect(sparks.count).toBe(0);
	sparks.step(1);
	expect(sparks.count).toBe(0);
	sparks.burst(0, 0, 12, 2026);
	sparks.clear();
	expect(sparks.count).toBe(0);
});
