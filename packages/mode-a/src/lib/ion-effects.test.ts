import { expect, it } from "vitest";
import { buildPlumeEmitters } from "./build-renderer";
import { defaultLoadout } from "./schemas/loadout";

it("assigns each engine's style per mount without restyling fusion", () => {
  for (const chassis of ["fighter", "scout", "corvette"] as const) {
    for (const side of ["ion", "heavy-ion", "fusion", "plasma"] as const) {
      const build = defaultLoadout(chassis);
      // Isolate main engines from optional stabilizer assist.
      build.stabilizers = false;
      build.side = side;
      build.aft = build.aft.map((_, i) => (i === 0 ? "heavy-ion" : "fusion"));
      const styles = buildPlumeEmitters(build).map((e) => e.style);
      expect(styles.slice(0, 2)).toEqual(
        Array(2).fill(
          side === "ion"
            ? "ion-light"
            : side === "heavy-ion"
              ? "ion-heavy"
              : side === "plasma"
                ? "plasma"
                : "default",
        ),
      );
      expect(styles[2]).toBe("ion-heavy");
      expect(styles.slice(3).every((s) => s === "default")).toBe(true);
    }
  }
});
