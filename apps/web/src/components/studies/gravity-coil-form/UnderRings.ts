import type { Face } from "./drawings";

// One new layer beneath the original E, in E's artwork coordinates.
// The aperture stays open. Width changes the exposed outside rim only.
export const underRings = [
  {
    id: "rim-narrow",
    label: "J / Narrow rim",
    radius: 16.75,
    note: "A close edge beneath E.",
  },
  {
    id: "rim-medium",
    label: "K / Medium rim",
    radius: 18,
    note: "A visible ring beneath the sectors.",
  },
  {
    id: "rim-wide",
    label: "L / Wide rim",
    radius: 20,
    note: "A substantial surrounding ring.",
  },
  {
    id: "rim-inset",
    label: "M / Inset ring",
    radius: 15.25,
    note: "Connection through gaps; no exposed outer rim.",
  },
] as const;
const p = (r: number, a: number): [number, number] => [
  r * Math.cos((a * Math.PI) / 180),
  r * Math.sin((a * Math.PI) / 180),
];
export function underRing(radius: number): Face[] {
  const faces: Face[] = [];
  // A continuous 24-sided open annulus. Broad top + restrained edge facet,
  // using Light ion charcoals. Light is upper left in the final upright view.
  for (let i = 0; i < 24; i++) {
    const a = i * 15;
    const b = a + 15;
    const light = -Math.cos((((a + b) / 2 - 45) * Math.PI) / 180);
    faces.push({
      points: [p(radius - 0.6, a), p(radius - 0.6, b), p(8, b), p(8, a)],
      color: "rgb(61,65,71)",
    });
    faces.push({
      points: [
        p(radius, a),
        p(radius, b),
        p(radius - 0.6, b),
        p(radius - 0.6, a),
      ],
      color:
        light > 0.5
          ? "rgb(82,87,95)"
          : light > -0.5
            ? "rgb(40,42,46)"
            : "rgb(27,29,31)",
    });
  }
  return faces;
}
