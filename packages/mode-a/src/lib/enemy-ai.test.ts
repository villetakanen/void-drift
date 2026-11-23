import { describe, expect, it } from "vitest";
import { chooseEnemyAction, updateEnemyObjectiveForCapacity } from "./enemy-ai";

describe("shared enemy objective", () => {
  const capacity = 100;
  const actor = (
    power: number,
    objective: "pursue" | "recover" = "pursue",
  ) => ({ resources: { power }, objective });
  const update = (state: ReturnType<typeof actor>) =>
    updateEnemyObjectiveForCapacity(state, capacity, true);
  it("latches only below 20 percent and releases at 80 percent", () => {
    expect(update(actor(capacity * 0.2))).toBe("pursue");
    expect(update(actor(capacity * 0.199))).toBe("recover");
    expect(update(actor(capacity * 0.799, "recover"))).toBe("recover");
    expect(update(actor(capacity * 0.8, "recover"))).toBe("pursue");
  });
  it("resolves tied actions deterministically in catalogue order", () => {
    const actions = ["hold", "burrow"] as const;
    expect(
      chooseEnemyAction(actions, (action) => ({ action, score: 1 })).action,
    ).toBe("hold");
  });
});
