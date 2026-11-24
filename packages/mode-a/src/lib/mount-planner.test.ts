import { expect, it } from "vitest";
import { buildSlotLinks } from "./build-renderer";
import {
  loadMountPlan,
  MountPlanSchema,
  moveMount,
  moveSlotLinkLine,
  newMountPlan,
  previewMounts,
  previewSlotLinkLines,
  snapSlotLinkX,
} from "./mount-planner";
import { CHASSIS, type Loadout } from "./schemas/loadout";

function legacy(chassis: Loadout["chassis"] = "fighter") {
  const { baselineSlotLinkLines, slotLinkLines, ...plan } =
    newMountPlan(chassis);
  return {
    plan: { ...plan, version: 1 as const },
    baselineSlotLinkLines,
    slotLinkLines,
  };
}

it("captures every chassis's authored routes, including empty and multi-link maps", () => {
  for (const chassis of Object.keys(CHASSIS) as Loadout["chassis"][]) {
    const plan = newMountPlan(chassis);
    expect(plan.version).toBe(2);
    expect(plan.baselineSlotLinkLines).toEqual(CHASSIS[chassis].slotLinkLines);
    expect(plan.slotLinkLines).toEqual(plan.baselineSlotLinkLines);
  }
});

it("edits only the selected route and round-trips both paths", () => {
  const plan = newMountPlan("fighter");
  const next = moveSlotLinkLine(plan, "right", -38.75);
  expect(next).toEqual({ ...plan, slotLinkLines: { right: -39 } });
  expect(moveSlotLinkLine(next, "right", -38.8)).toBe(next);
  expect(() => moveSlotLinkLine(next, "hull-0", 5)).toThrow(/hull-0/);
  expect(CHASSIS.fighter.slotLinkLines).toEqual(plan.baselineSlotLinkLines);
  expect(loadMountPlan(JSON.parse(JSON.stringify(next)))).toEqual({
    status: "current",
    plan: next,
  });

  const mounts = previewMounts(next);
  const [original] = buildSlotLinks(plan.chassis, mounts);
  const [draft] = buildSlotLinks(
    plan.chassis,
    mounts,
    previewSlotLinkLines(next),
  );
  expect(draft.points).toEqual([
    original.points[0],
    [-39, original.primary.y],
    [-39, original.secondary.y],
    original.points[3],
  ]);
  expect(
    buildSlotLinks(plan.chassis, mounts, previewSlotLinkLines(next, true)),
  ).toEqual([original]);
  expect(buildSlotLinks(plan.chassis, mounts, {})).toEqual([]);
});

it("snaps ties away from zero without corrupting large numbers or small offsets", () => {
  expect(
    [
      0.25,
      -0.25,
      0.75,
      -0.75,
      -0.01,
      0.75 - Number.EPSILON,
      Number.MAX_VALUE,
    ].map(snapSlotLinkX),
  ).toEqual([0.5, -0.5, 1, -1, 0, 0.5, Number.MAX_VALUE]);
  expect(() => snapSlotLinkX(Infinity)).toThrow(/finite/);
});

it("rejects missing, extra, non-number and off-grid crossbar entries at their fields", () => {
  const plan = newMountPlan("fighter");
  plan.mirrorPairs.push({ a: "hull-0", b: "hull-1", origin: "planner" });
  const linked = moveMount(plan, "hull-0", {});
  for (const field of ["slotLinkLines", "baselineSlotLinkLines"] as const) {
    expect(
      MountPlanSchema.safeParse({ ...linked, [field]: undefined }).success,
    ).toBe(false);
    for (const [map, key] of [
      [{}, "right"],
      [{ right: -40, "hull-1": 2 }, "hull-1"],
      [{ right: -38.25 }, "right"],
      [{ right: -38 + 2 ** -47 }, "right"],
      [{ right: "-38" }, "right"],
      [{ right: Infinity }, "right"],
      [JSON.parse('{"right":-40,"__proto__":0}'), "__proto__"],
    ] as const) {
      const invalid = MountPlanSchema.safeParse({ ...linked, [field]: map });
      expect(invalid.success).toBe(false);
      expect(invalid.error?.issues.map((issue) => issue.path)).toContainEqual([
        field,
        key,
      ]);
    }
  }
  expect(
    buildSlotLinks(linked.chassis, previewMounts(linked), linked.slotLinkLines),
  ).toHaveLength(1);
});

it("reports changed, added and removed catalog routes without replacing captured routes", () => {
  const plan = moveSlotLinkLine(newMountPlan("fiddler"), "right", 12);
  const before = CHASSIS.fiddler.slotLinkLines;
  try {
    CHASSIS.fiddler.slotLinkLines = { right: -65.5, extra: 3 };
    expect(loadMountPlan(plan)).toEqual({
      status: "stale",
      plan,
      staleMounts: [],
      staleSlotLinkLines: ["right", "extra", "aft-1"],
    });
  } finally {
    CHASSIS.fiddler.slotLinkLines = before;
  }
});

it("upgrades a current v1 mount edit using current routing but rejects legacy maps", () => {
  const { plan, baselineSlotLinkLines, slotLinkLines } = legacy();
  const mount = plan.mounts.find((m) => m.key === "hull-0");
  if (!mount) throw new Error("Missing test mount");
  mount.x = 12.123456789;
  expect(loadMountPlan(plan)).toEqual({
    status: "migrated",
    plan: { ...plan, version: 2, baselineSlotLinkLines, slotLinkLines },
  });
  expect(() => loadMountPlan({ ...plan, baselineSlotLinkLines })).toThrow(
    /baselineSlotLinkLines/,
  );
  expect(() => loadMountPlan({ ...plan, slotLinkLines })).toThrow(
    /slotLinkLines/,
  );
});

it("keeps stale v1 documents as legacy, including when authored routes cannot be captured", () => {
  const { plan } = legacy();
  plan.baseline[0].x += 1;
  expect(loadMountPlan(plan)).toEqual({
    status: "stale",
    plan,
    staleMounts: [plan.baseline[0].key],
    staleSlotLinkLines: [],
  });

  const current = legacy().plan;
  const before = CHASSIS.fighter.slotLinkLines;
  try {
    CHASSIS.fighter.slotLinkLines = { right: -38.25 };
    expect(() => newMountPlan("fighter")).toThrow(/exact multiple/);
    const unavailable = loadMountPlan(current);
    expect(unavailable).toMatchObject({ status: "stale", plan: current });
    if (unavailable.status === "stale") {
      expect(unavailable.routingCaptureError?.issues[0].path).toEqual([
        "baselineSlotLinkLines",
        "right",
      ]);
      expect(previewSlotLinkLines(unavailable.plan)).toEqual({});
    }
  } finally {
    CHASSIS.fighter.slotLinkLines = before;
  }
});
