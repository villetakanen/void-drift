import { BUILD_FLIGHT_SCALE, type BuildMount } from "@void-drift/mode-a";
import { z } from "astro/zod";

export const FormIdSchema = z.enum(["Rail shroud"]);
export const InspectionSchema = z
  .object({
    form: FormIdSchema.default("Rail shroud"),
    light: z.enum(["Dark", "Loading", "Mouth", "Vents"]).default("Dark"),
    anchors: z.boolean().default(false),
  })
  .strict();
export type FormId = z.infer<typeof FormIdSchema>;
export type Inspection = z.infer<typeof InspectionSchema>;
export type Point = readonly [number, number];
type Face = readonly [string, readonly Point[]];

// One study-owned assembly in world units. +x forward. The receiver attachment
// is the origin; it is not the midpoint of the full silhouette.
export const REFERENCE = {
  length: 20,
  width: 10.5,
  primary: [12, 0] as Point,
  vents: [
    [8.5, -3.8],
    [8.5, 3.8],
  ] as const,
};
export const FORMS = { "Rail shroud": REFERENCE };
const steel = {
  face: "#292e36",
  edge: "#646d78",
  dark: "#11171e",
  bevel: "#424c58",
};
// The receiver is a separate pale solid. The emitter remains dark, with a
// recessed centre and two short guide edges; it is not an engine shell.
export const ASSEMBLY: Record<
  "Power pack" | "Receiver" | "Emitter",
  readonly Face[]
> = {
  "Power pack": [
    [
      steel.dark,
      [
        [-8, -4.4],
        [-3.5, -2.4],
        [-0.5, -3.4],
        [-5, -5.4],
      ],
    ],
    [
      "#bcc7cb",
      [
        [-8, -4.4],
        [-7.5, -3],
        [-3.2, -1.1],
        [-3.5, -2.4],
      ],
    ],
    [
      "#586978",
      [
        [-3.5, -2.4],
        [-3.2, -1.1],
        [-0.2, -2.1],
        [-0.5, -3.4],
      ],
    ],
    [
      steel.edge,
      [
        [-6.7, -4.1],
        [-6.4, -3.5],
        [-3.8, -2.3],
        [-4.1, -2.9],
      ],
    ],
  ],
  Receiver: [
    [
      steel.dark,
      [
        [-4.5, -3.8],
        [2, -5.1],
        [8.5, -4.7],
        [8.5, 4.7],
        [2, 5.1],
        [-4.5, 3.8],
      ],
    ],
    [
      "#e3ebea",
      [
        [-4.5, -3.8],
        [-2, -5.1],
        [6.9, -5.1],
        [8.5, -4.7],
        [8.5, -3],
        [-4.5, -2.5],
      ],
    ],
    [
      "#9daeb7",
      [
        [-4.5, -2.5],
        [8.5, -3],
        [7.2, -1.7],
        [-3.4, -1.5],
      ],
    ],
    [
      "#738897",
      [
        [-4.5, 2.5],
        [8.5, 3],
        [8.5, 4.7],
        [6.9, 5.1],
        [-2, 5.1],
        [-4.5, 3.8],
      ],
    ],
    [
      "#3a4b5a",
      [
        [-4.5, 2.5],
        [-3.4, 1.5],
        [7.2, 1.7],
        [8.5, 3],
      ],
    ],
    // A crosspiece joins the pale side housings behind the emitter.
    [
      "#a8b9bf",
      [
        [-2.8, -3],
        [-1.2, -3],
        [-1.2, 3],
        [-2.8, 3],
      ],
    ],
  ],
  Emitter: [
    [
      steel.dark,
      [
        [-4, -1.5],
        [12, -1.5],
        [12, 1.5],
        [-4, 1.5],
      ],
    ],
    // Parallel rails belong to one central firing path, with a short open end.
    [
      steel.face,
      [
        [0, -2.5],
        [12, -2.5],
        [12, -1.3],
        [0, -1.3],
      ],
    ],
    [
      steel.edge,
      [
        [0, -2.5],
        [11.5, -2.5],
        [12, -2],
        [0, -2],
      ],
    ],
    [
      steel.face,
      [
        [0, 1.3],
        [12, 1.3],
        [12, 2.5],
        [0, 2.5],
      ],
    ],
    [
      steel.bevel,
      [
        [0, 1.3],
        [12, 1.3],
        [11.5, 1.8],
        [0, 1.8],
      ],
    ],
    // Recessed emitter face, open down the centre rather than a bored barrel.
    [
      "#090f16",
      [
        [7.8, -1.25],
        [12, -1.25],
        [12, 1.25],
        [7.8, 1.25],
      ],
    ],
    [
      "#44505a",
      [
        [8, -1.25],
        [9, -0.8],
        [9, 0.8],
        [8, 1.25],
      ],
    ],
  ],
};
function polygon(
  ctx: CanvasRenderingContext2D,
  ink: string,
  points: readonly Point[],
) {
  ctx.fillStyle = ink;
  ctx.beginPath();
  points.forEach(([x, y], i) => {
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
}
export function drawAssembly(
  ctx: CanvasRenderingContext2D,
  part: keyof typeof ASSEMBLY,
) {
  for (const [ink, points] of ASSEMBLY[part]) polygon(ctx, ink, points);
}
export function drawForm(ctx: CanvasRenderingContext2D, _id: FormId) {
  drawAssembly(ctx, "Power pack");
  drawAssembly(ctx, "Receiver");
  drawAssembly(ctx, "Emitter");
  for (const [x, y] of REFERENCE.vents) {
    // Louver cuts in each shoulder. The front cut is the exhaust lip.
    for (const back of [3.2, 1.6, 0]) {
      polygon(ctx, "#10171e", [
        [x - back - 0.6, y - 0.65],
        [x - back, y - 0.65],
        [x - back, y + 0.65],
        [x - back - 0.6, y + 0.65],
      ]);
    }
    ctx.fillStyle = "#566673";
    ctx.fillRect(x - 0.75, y - 0.65, 0.15, 1.3);
  }
}
export function fittingPainter(
  id: FormId,
  key: string,
  inspection?: Inspection,
) {
  return (ctx: CanvasRenderingContext2D, mount: BuildMount) => {
    if (mount.key !== key) return false;
    ctx.save();
    ctx.scale(1 / BUILD_FLIGHT_SCALE, 1 / BUILD_FLIGHT_SCALE);
    drawForm(ctx, id);
    if (inspection) drawInspection(ctx, inspection);
    ctx.restore();
    return true;
  };
}
export function outletInShip(
  mount: Pick<BuildMount, "x" | "y" | "angle">,
  [x, y]: Point,
): Point {
  const c = Math.cos(mount.angle),
    s = Math.sin(mount.angle);
  return [
    mount.x * BUILD_FLIGHT_SCALE + x * c - y * s,
    mount.y * BUILD_FLIGHT_SCALE + x * s + y * c,
  ];
}
export function drawInspection(
  ctx: CanvasRenderingContext2D,
  options: Inspection,
) {
  if (options.light === "Loading" || options.light === "Mouth") {
    // Only the recessed working core lights. No luminous outline of the casing.
    ctx.fillStyle = "#ffb52e";
    ctx.fillRect(8.7, -0.45, 3.3, 0.9);
    if (options.light === "Mouth") {
      polygon(ctx, "#ffb52e", [
        [12, -1],
        [17, -0.5],
        [17, 0.5],
        [12, 1],
      ]);
      ctx.fillStyle = "#fff3dc";
      ctx.fillRect(12, -0.2, 3, 0.4);
    }
  }
  if (options.light === "Vents") {
    for (const [x, y] of REFERENCE.vents) {
      for (const back of [3.2, 1.6, 0]) {
        ctx.fillStyle = "#d37f32";
        ctx.fillRect(x - back - 0.4, y - 0.45, 0.4, 0.9);
      }
      polygon(ctx, "#ffb52e", [
        [x, y - 0.45],
        [x + 3, y - 0.2],
        [x + 3, y + 0.2],
        [x, y + 0.45],
      ]);
      ctx.fillStyle = "#fff3dc";
      ctx.fillRect(x, y - 0.12, 1.5, 0.24);
    }
  }
  if (options.anchors) {
    for (const [x, y] of [[0, 0], REFERENCE.primary, ...REFERENCE.vents]) {
      ctx.strokeStyle = "#ffc978";
      ctx.lineWidth = 0.13;
      ctx.beginPath();
      ctx.arc(x, y, 0.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 1, y);
      ctx.lineTo(x + 1, y);
      ctx.moveTo(x, y - 1);
      ctx.lineTo(x, y + 1);
      ctx.stroke();
    }
  }
}
