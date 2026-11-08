// M / Inset ring, accepted at 100% in gravity-coil-form-2026-11-03, 02.6.
// Construct in the reviewed nose-up view, then convert to ship-local +x forward.
export const GRAVITY_COIL_SCALE = 0.5;
type Point = [number, number];
interface Face {
  contours: Point[][];
  color: string;
  fillRule: "nonzero";
}
const point = (radius: number, angle: number): Point => [
  radius * Math.cos((angle * Math.PI) / 180),
  radius * Math.sin((angle * Math.PI) / 180),
];
const band = (outer: number, inner: number, a: number, b: number) => [
  ...Array.from({ length: 4 }, (_, i) => point(outer, a + ((b - a) * i) / 3)),
  ...Array.from({ length: 4 }, (_, i) => point(inner, b - ((b - a) * i) / 3)),
];
const blue = ["#264d6b", "#437e99", "#83c7d0", "#c8f4f0"];
const charcoal = ["#1b1d1f", "#282a2e", "#3d4147", "#52575f"];
const yellow = ["#87920f", "#a5af20", "#cedb17", "#d7df62"];
function tone(angle: number, palette: string[], inward = false) {
  const dot = -Math.cos(((angle - 45) * Math.PI) / 180) * (inward ? -1 : 1);
  return palette[dot > 0.6 ? 3 : dot > 0 ? 2 : dot > -0.6 ? 1 : 0];
}

/** Parsed with UtilityFaceSchema by the shared artwork registry. */
export function gravityCoilFaces(): Face[] {
  const faces: Face[] = [];
  const add = (points: Point[], color: string) => {
    faces.push({
      contours: [points.map(([x, y]): Point => [-y, x])],
      color,
      fillRule: "nonzero",
    });
  };
  // Continuous open annulus, entirely inside E's silhouette. Paint it first.
  for (let i = 0; i < 24; i++) {
    const a = i * 15;
    const b = a + 15;
    const light = -Math.cos((((a + b) / 2 - 45) * Math.PI) / 180);
    add(
      [point(14.65, a), point(14.65, b), point(8, b), point(8, a)],
      charcoal[2],
    );
    add(
      [point(15.25, a), point(15.25, b), point(14.65, b), point(14.65, a)],
      charcoal[light > 0.5 ? 3 : light > -0.5 ? 1 : 0],
    );
  }
  // Connected yellow inner ribbon and its two terminals; centre stays open.
  for (let i = 0; i < 8; i++) {
    const a = i * 45;
    add(
      [point(9, a), point(9, a + 45), point(7, a + 45), point(7, a)],
      tone(a + 22.5, yellow, true),
    );
  }
  for (const sign of [-1, 1]) {
    add(
      [
        [-1, sign * 8],
        [1, sign * 8],
        [1, sign * 16],
        [-1, sign * 16],
      ],
      "#a5af20",
    );
    add(
      [
        [-3, sign * 13],
        [3, sign * 13],
        [3, sign * 18],
        [-3, sign * 18],
      ],
      sign < 0 ? "#cedb17" : "#a5af20",
    );
    add(
      [
        [-3, sign * 13],
        [-1.5, sign * 13],
        [-1.5, sign * 18],
        [-3, sign * 18],
      ],
      "#d7df62",
    );
  }
  // E's eight creased sector shells, unchanged from the accepted reference.
  for (let i = 0; i < 8; i++) {
    const a = 94 + i * 45;
    const b = a + 37;
    const middle = (a + b) / 2;
    add(band(16, 12.7, a, b), tone(middle, blue));
    add(band(12.7, 9.2, a, b), tone(middle, blue, true));
    add(band(9.2, 8, a, b), tone(middle, charcoal, true));
  }
  return faces;
}
