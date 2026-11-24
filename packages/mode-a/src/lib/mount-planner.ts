import { z } from "zod";
import { type BuildMount, buildMounts } from "./build-renderer";
import {
  CHASSIS,
  defaultLoadout,
  type Loadout,
  LoadoutSchema,
  SlotTypeSchema,
} from "./schemas/loadout";
import { ShipProfileIdSchema } from "./schemas/ship-profile";

const Mount = z
  .object({
    key: z.string().min(1),
    group: z.enum(["side", "hull", "aft"]),
    index: z.number().int().nonnegative(),
    type: SlotTypeSchema,
    width: z.number().finite().positive(),
    height: z.number().finite().positive(),
    x: z.number().finite(),
    y: z.number().finite(),
    angle: z.number().finite(),
    linkedTo: z.string().min(1).optional(),
  })
  .strict();
const Pair = z
  .object({
    a: z.string(),
    b: z.string(),
    origin: z.enum(["production", "planner"]),
  })
  .strict();
const COORDINATES =
  "ship-local: +x forward, +y right; production units; radians, Canvas rotation";
const metadata = (m: z.infer<typeof Mount>) =>
  JSON.stringify([
    m.key,
    m.group,
    m.index,
    m.type,
    m.width,
    m.height,
    m.linkedTo,
  ]);
const PlanFields = z.object({
  kind: z.literal("ship-mount-plan"),
  coordinates: z.literal(COORDINATES),
  chassis: ShipProfileIdSchema,
  baseline: z.array(Mount).min(1),
  mounts: z.array(Mount).min(1),
  mirrorPairs: z.array(Pair),
  previewLoadout: LoadoutSchema,
});
const LegacyPlanShape = PlanFields.extend({ version: z.literal(1) }).strict();
const SlotLinkX = z
  .number()
  .finite()
  .refine((x) => x % 0.5 === 0, {
    message: "Expected an exact multiple of 0.5 ship units",
  });
const SlotLinkLines = z.preprocess(
  (value, ctx) => {
    // Zod's record parser drops this key; report it instead of accepting it silently.
    if (value && typeof value === "object" && Object.hasOwn(value, "__proto__"))
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["__proto__"],
        message: "Invalid crossbar key",
      });
    return value;
  },
  z.record(z.string().min(1), SlotLinkX),
);
const PlanShape = PlanFields.extend({
  version: z.literal(2),
  baselineSlotLinkLines: SlotLinkLines,
  slotLinkLines: SlotLinkLines,
}).strict();
export type LegacyMountPlan = z.infer<typeof LegacyPlanShape>;
export type MountPlan = z.infer<typeof PlanShape>;
export type MountPlanDocument = LegacyMountPlan | MountPlan;

function productionSecondaryKeys(mounts: MountPlan["baseline"]) {
  return mounts.filter((m) => m.linkedTo !== undefined).map((m) => m.key);
}

function validatePlan(plan: MountPlanDocument, ctx: z.RefinementCtx) {
  const issue = (path: (string | number)[], message: string) =>
    ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
  if (plan.previewLoadout.chassis !== plan.chassis)
    issue(["previewLoadout"], "Preview must use this chassis");
  for (const field of ["baseline", "mounts"] as const) {
    if (new Set(plan[field].map((m) => m.key)).size !== plan[field].length)
      issue([field], "Mount keys must be unique");
  }
  if (plan.mounts.length !== plan.baseline.length)
    issue(["mounts"], "Every baseline mount is required");
  for (const m of plan.mounts) {
    const original = plan.baseline.find((b) => b.key === m.key);
    if (!original || metadata(original) !== metadata(m))
      issue(
        ["mounts", m.key],
        "Mount identity and dimensions must match baseline",
      );
  }
  const used = new Set<string>();
  for (const [i, p] of plan.mirrorPairs.entries()) {
    const a = plan.mounts.find((m) => m.key === p.a),
      b = plan.mounts.find((m) => m.key === p.b);
    if (!a || !b || p.a === p.b || used.has(p.a) || used.has(p.b)) {
      issue(["mirrorPairs", i], "Pair requires two distinct, available mounts");
      continue;
    }
    used.add(p.a);
    used.add(p.b);
    if (a.type !== b.type || a.width !== b.width || a.height !== b.height)
      issue(["mirrorPairs", i], "Pair types and dimensions must match");
    // Allow tiny floating-point differences in mirrored mount geometry only.
    if (
      Math.abs(a.x - b.x) > 1e-10 ||
      Math.abs(a.y + b.y) > 1e-10 ||
      Math.abs(a.angle + b.angle) > 1e-10
    )
      issue(["mirrorPairs", i], "Pair geometry must be mirrored");
    if (
      p.origin === "production" &&
      !(
        (b.linkedTo === a.key && !a.linkedTo) ||
        (a.linkedTo === b.key && !b.linkedTo)
      )
    )
      issue(
        ["mirrorPairs", i],
        "Production link needs one primary and one secondary",
      );
  }
  for (const m of plan.mounts)
    if (
      m.linkedTo &&
      !plan.mirrorPairs.some(
        (p) =>
          p.origin === "production" &&
          ((p.a === m.key && p.b === m.linkedTo) ||
            (p.b === m.key && p.a === m.linkedTo)),
      )
    )
      issue(["mirrorPairs"], `Required production link missing: ${m.key}`);
  if (plan.version === 2) {
    const expected = new Set(productionSecondaryKeys(plan.baseline));
    for (const field of ["baselineSlotLinkLines", "slotLinkLines"] as const) {
      for (const key of expected)
        if (!Object.hasOwn(plan[field], key))
          issue([field, key], "Missing production crossbar");
      for (const key of Object.keys(plan[field]))
        if (!expected.has(key))
          issue([field, key], "Not a production secondary mount key");
    }
  }
}

/** Canonical editable document. Use loadMountPlan to also accept legacy input. */
export const MountPlanSchema = PlanShape.superRefine(validatePlan);
export const MountPlanDocumentSchema = z
  .discriminatedUnion("version", [LegacyPlanShape, PlanShape])
  .superRefine(validatePlan);

export function geometry(m: BuildMount): MountPlan["mounts"][number] {
  return {
    key: m.key,
    group: m.group,
    index: m.index,
    type: m.type,
    width: m.width,
    height: m.height,
    x: m.x,
    y: m.y,
    angle: m.angle,
    ...(m.linkedTo ? { linkedTo: m.linkedTo } : {}),
  };
}
export function newMountPlan(chassis: Loadout["chassis"]): MountPlan {
  const previewLoadout = defaultLoadout(chassis);
  const mounts = buildMounts(previewLoadout).map(geometry);
  return MountPlanSchema.parse({
    version: 2,
    kind: "ship-mount-plan",
    coordinates: COORDINATES,
    chassis,
    baseline: mounts,
    mounts,
    baselineSlotLinkLines: CHASSIS[chassis].slotLinkLines,
    slotLinkLines: CHASSIS[chassis].slotLinkLines,
    mirrorPairs: mounts
      .filter((m) => m.linkedTo)
      .map((m) => ({ a: m.linkedTo, b: m.key, origin: "production" })),
    previewLoadout,
  });
}
export function staleMounts(plan: MountPlanDocument): string[] {
  const current = buildMounts(defaultLoadout(plan.chassis)).map(geometry);
  return [...new Set([...current, ...plan.baseline].map((m) => m.key))].filter(
    (key) => {
      const now = current.find((m) => m.key === key);
      const captured = plan.baseline.find((m) => m.key === key);
      return (
        !now ||
        !captured ||
        metadata(now) !== metadata(captured) ||
        now.x !== captured.x ||
        now.y !== captured.y ||
        now.angle !== captured.angle
      );
    },
  );
}

export function staleSlotLinkLines(plan: MountPlan): string[] {
  const current = CHASSIS[plan.chassis].slotLinkLines;
  const captured = plan.baselineSlotLinkLines;
  return [
    ...new Set([...Object.keys(current), ...Object.keys(captured)]),
  ].filter(
    (key) =>
      !Object.hasOwn(current, key) ||
      !Object.hasOwn(captured, key) ||
      current[key] !== captured[key],
  );
}

export type MountPlanLoadResult =
  | { status: "current" | "migrated"; plan: MountPlan }
  | {
      status: "stale";
      plan: MountPlanDocument;
      staleMounts: string[];
      staleSlotLinkLines: string[];
      routingCaptureError?: z.ZodError;
    };

/** Parse a decoded document; throws field-specific Zod errors for invalid input. */
export function loadMountPlan(input: unknown): MountPlanLoadResult {
  const plan = MountPlanDocumentSchema.parse(input);
  const mounts = staleMounts(plan);
  const lines = plan.version === 2 ? staleSlotLinkLines(plan) : [];
  if (mounts.length || lines.length)
    return {
      status: "stale",
      plan,
      staleMounts: mounts,
      staleSlotLinkLines: lines,
    };
  if (plan.version === 2) return { status: "current", plan };
  const authored = CHASSIS[plan.chassis].slotLinkLines;
  const upgraded = MountPlanSchema.safeParse({
    ...plan,
    version: 2,
    baselineSlotLinkLines: authored,
    slotLinkLines: authored,
  });
  if (upgraded.success) return { status: "migrated", plan: upgraded.data };
  return {
    status: "stale",
    plan,
    staleMounts: [],
    staleSlotLinkLines: [],
    routingCaptureError: upgraded.error,
  };
}

/** Snap finite edits to the nearest half-unit, away from zero on ties. */
export function snapSlotLinkX(x: number): number {
  if (!Number.isFinite(x)) throw new RangeError("Crossbar X must be finite");
  // Keep large on-grid values exact without doubling them (which can overflow).
  if (x % 0.5 === 0) return x === 0 ? 0 : x;
  const magnitude = Math.abs(x);
  const whole = Math.floor(magnitude);
  const fraction = magnitude - whole;
  const snapped = whole + (fraction < 0.25 ? 0 : fraction < 0.75 ? 0.5 : 1);
  return x < 0 && snapped !== 0 ? -snapped : snapped;
}

/** Replace one draft route; return the same plan for a no-op. */
export function moveSlotLinkLine(
  plan: MountPlan,
  secondaryKey: string,
  x: number,
): MountPlan {
  if (!Object.hasOwn(plan.slotLinkLines, secondaryKey))
    throw new RangeError(`No production crossbar for ${secondaryKey}`);
  const snapped = snapSlotLinkX(x);
  if (plan.slotLinkLines[secondaryKey] === snapped) return plan;
  return {
    ...plan,
    slotLinkLines: { ...plan.slotLinkLines, [secondaryKey]: snapped },
  };
}

/** A preserved legacy document has no captured routes; don't invent any. */
export function previewSlotLinkLines(
  plan: MountPlanDocument,
  original = false,
): Readonly<Record<string, number>> {
  if (plan.version === 1) return {};
  return original ? plan.baselineSlotLinkLines : plan.slotLinkLines;
}
export function moveMount(
  plan: MountPlan,
  key: string,
  change: Partial<Pick<BuildMount, "x" | "y" | "angle">>,
): MountPlan {
  const next = structuredClone(plan),
    mount = next.mounts.find((m) => m.key === key);
  if (!mount) return next;
  Object.assign(mount, change);
  const pair = next.mirrorPairs.find((p) => p.a === key || p.b === key);
  const other =
    pair &&
    next.mounts.find((m) => m.key === (pair.a === key ? pair.b : pair.a));
  if (other)
    Object.assign(other, { x: mount.x, y: -mount.y, angle: -mount.angle });
  return MountPlanSchema.parse(next);
}
export function previewMounts(
  plan: MountPlanDocument,
  original = false,
): BuildMount[] {
  const production = buildMounts(plan.previewLoadout);
  return (original ? plan.baseline : plan.mounts).map((m) => ({
    ...production.find((p) => p.key === m.key),
    ...m,
    label: production.find((p) => p.key === m.key)?.label ?? m.key,
    part: production.find((p) => p.key === m.key)?.part ?? null,
  }));
}
