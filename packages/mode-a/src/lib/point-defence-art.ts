/**
 * Ion Point Defence geometry converted from the supplied concept SVG
 * (apps/web/public/studies/ion-point-defence-2026-11-08/concept.svg, turret on
 * its round base). Source units keep the SVG frame: forward is −y, the ship's
 * right is +x. The pivot is the base centre; the muzzle is the channel tip.
 * Rim slots and the index mark are the accepted study's form B.
 */
type Point = readonly [number, number];
export const POINT_DEFENCE_GEOMETRY = {
  /** Base diameter in flight units. */
  diameter: 8,
  centreX: 246.684809,
  centreY: 102.705067,
  baseRadius: 5.4396029,
  innerRadius: 4.3516822,
  tipY: 92.876213,
  channelX: 246.59714 + 0.31343 / 2,
} as const;
/** Flight units per source unit. */
export const POINT_DEFENCE_SOURCE_SCALE =
  POINT_DEFENCE_GEOMETRY.diameter / (2 * POINT_DEFENCE_GEOMETRY.baseRadius);
export const POINT_DEFENCE_MUZZLE =
  (POINT_DEFENCE_GEOMETRY.centreY - POINT_DEFENCE_GEOMETRY.tipY) *
  POINT_DEFENCE_SOURCE_SCALE;
export const POINT_DEFENCE_MUZZLE_SIDE =
  (POINT_DEFENCE_GEOMETRY.channelX - POINT_DEFENCE_GEOMETRY.centreX) *
  POINT_DEFENCE_SOURCE_SCALE;

export interface PointDefenceDisc {
  radius: number;
  /** Linear gradient in source units; stays fixed to the ship. */
  from: Point;
  to: Point;
  stops: readonly [string, string];
}
/** Two concentric base discs; their lighting never turns with the turret. */
export const POINT_DEFENCE_BASE: readonly PointDefenceDisc[] = [
  {
    radius: POINT_DEFENCE_GEOMETRY.baseRadius,
    from: [250.643668, 106.435575],
    to: [242.333131, 98.353386],
    stops: ["#52575f", "#1b1d1f"],
  },
  {
    radius: POINT_DEFENCE_GEOMETRY.innerRadius,
    from: [249.623227, 105.914862],
    to: [243.547649, 99.689221],
    stops: ["#1b1d1f", "#52575f"],
  },
];

/** A radial bar on the base, `angle` clockwise from forward, in base radii. */
function radialBar(
  angle: number,
  inner: number,
  outer: number,
  halfWidth: number,
): Point[] {
  const { centreX, centreY, baseRadius } = POINT_DEFENCE_GEOMETRY;
  const c = Math.cos(angle),
    s = Math.sin(angle);
  return [
    [inner, -halfWidth],
    [outer, -halfWidth],
    [outer, halfWidth],
    [inner, halfWidth],
  ].map(([forward, lateral]): Point => {
    const f = (forward * c - lateral * s) * baseRadius,
      l = (forward * s + lateral * c) * baseRadius;
    return [centreX + l, centreY - f];
  });
}
export const POINT_DEFENCE_RIM_SLOTS = 6;
/** Everything that turns about the pivot: rim slots, index mark, barrel, housing. */
export const POINT_DEFENCE_TURRET: readonly (readonly [
  string,
  readonly Point[],
])[] = [
  ...Array.from(
    { length: POINT_DEFENCE_RIM_SLOTS },
    (_, i) =>
      [
        "#121519",
        radialBar(
          ((i * 2 + 1) * Math.PI) / POINT_DEFENCE_RIM_SLOTS,
          94 / 115,
          113 / 115,
          6 / 115,
        ),
      ] as const,
  ),
  ["#83c7d0", radialBar(Math.PI, 92 / 115, 113 / 115, 7 / 115)],
  [
    "#1b1d1f",
    [
      [245.89204, 92.876213],
      [247.92904, 92.876213],
      [247.92904, 109.732178],
      [245.89204, 109.732178],
    ],
  ],
  [
    "#3d4147",
    [
      [247.39943, 93.182061],
      [246.02089, 93.182061],
      [245.44053, 92.87621],
      [247.92907, 92.87621],
    ],
  ],
  [
    "#52575f",
    [
      [245.44054, 92.876208],
      [245.44054, 109.73218],
      [246.02089, 109.73218],
      [246.0209, 93.182059],
    ],
  ],
  [
    "#12171e",
    [
      [247.92907, 92.87621],
      [246.02089, 109.73218],
      [247.92907, 109.73218],
    ],
  ],
  [
    "#29baff",
    [
      [246.59714, 101.69789],
      [246.59714, POINT_DEFENCE_GEOMETRY.tipY],
      [246.91057, POINT_DEFENCE_GEOMETRY.tipY],
      [246.91057, 101.69789],
    ],
  ],
  [
    "#c8f4f0",
    [
      [245.44054, 99.770793],
      [244.04565, 100.57614],
      [244.04565, 106.90131],
      [245.44054, 107.70665],
    ],
  ],
  [
    "#437e99",
    [
      [247.92908, 99.770793],
      [249.32397, 100.57614],
      [249.32397, 106.90131],
      [247.92908, 107.70665],
    ],
  ],
  [
    "#83c7d0",
    [
      [245.44051, 102.64259],
      [249.32394, 102.64259],
      [249.32394, 104.638473],
      [245.44051, 104.638473],
    ],
  ],
];

/**
 * Draw at the mount origin facing +x. `turn` is the turret angle relative to
 * the mount direction; the base and its lighting stay with the ship.
 */
export function drawPointDefence(
  ctx: CanvasRenderingContext2D,
  flightScale: number,
  turn = 0,
) {
  const { centreX, centreY } = POINT_DEFENCE_GEOMETRY;
  ctx.save();
  ctx.rotate(Math.PI / 2);
  const scale = POINT_DEFENCE_SOURCE_SCALE / flightScale;
  ctx.scale(scale, scale);
  ctx.translate(-centreX, -centreY);
  for (const disc of POINT_DEFENCE_BASE) {
    const gradient = ctx.createLinearGradient(...disc.from, ...disc.to);
    gradient.addColorStop(0, disc.stops[0]);
    gradient.addColorStop(1, disc.stops[1]);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centreX, centreY, disc.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.translate(centreX, centreY);
  ctx.rotate(turn);
  ctx.translate(-centreX, -centreY);
  for (const [color, points] of POINT_DEFENCE_TURRET) {
    ctx.fillStyle = color;
    ctx.beginPath();
    points.forEach(([x, y], index) => {
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
