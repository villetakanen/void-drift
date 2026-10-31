import { expect, it } from "vitest";
import { buildPlumeEmitters } from "./build-renderer";
import { defaultLoadout } from "./schemas/loadout";

it("assigns ion styles per mount without restyling fusion or plasma", () => {
	for (const chassis of ["balanced", "scout", "tank"] as const) {
		for (const side of ["ion", "heavy-ion", "fusion", "plasma"] as const) {
			const build = defaultLoadout(chassis);
			build.side = side;
			build.aft = build.aft.map((_, i) => (i === 0 ? "heavy-ion" : "fusion"));
			const styles = buildPlumeEmitters(build).map((e) => e.style);
			expect(styles.slice(0, 2)).toEqual(
				Array(2).fill(
					side === "ion"
						? "ion-light"
						: side === "heavy-ion"
							? "ion-heavy"
							: "default",
				),
			);
			expect(styles[2]).toBe("ion-heavy");
			expect(styles.slice(3).every((s) => s === "default")).toBe(true);
		}
	}
});
