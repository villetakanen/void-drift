import { band, coil, type Face } from "./drawings";

export const surfaceStudies = ["narrow", "dark-shell", "crown"] as const;
type SurfaceStudy = (typeof surfaceStudies)[number];
const light = ["#264d6b", "#437e99", "#83c7d0", "#c8f4f0"];
const dark = [
	"rgb(27,29,31)",
	"rgb(40,42,46)",
	"rgb(61,65,71)",
	"rgb(82,87,95)",
];
const incidence = (a: number) => -Math.cos(((a - 45) * Math.PI) / 180);
function shade(a: number, palette: readonly string[], inward = false) {
	const value = incidence(a) * (inward ? -1 : 1);
	return palette[value > 0.6 ? 3 : value > 0 ? 2 : value > -0.6 ? 1 : 0];
}

export function surfaceCoil(kind: SurfaceStudy): Face[] {
	// Preserve E's eight ribbon faces and its six terminal faces exactly.
	// The final 24 faces in E are the eight three-face shells, replaced below.
	const original = coil("shell");
	const faces = original.slice(0, original.length - 24);
	const add = (points: Face["points"], color: string) =>
		faces.push({ points, color });
	for (let i = 0; i < 8; i++) {
		const a = 94 + i * 45;
		const b = a + 37;
		const m = (a + b) / 2;
		if (kind === "narrow") {
			// G isolates the proportion change: E's light assignments are unchanged.
			add(band(16, 14.8, a, b), shade(m, light));
			add(band(14.8, 9.2, a, b), shade(m, light, true));
			add(band(9.2, 8, a, b), shade(m, dark, true));
		} else if (kind === "dark-shell") {
			// H gives darkness the broad working body, not a rim around a light tile.
			// The illuminated shoulder remains ship-coloured, the shadow side merges
			// into the engine-coloured shell. E's connected yellow ribbon stays.
			add(band(16, 14.8, a, b), shade(m, incidence(m) < 0 ? dark : light));
			add(band(14.8, 9.2, a, b), shade(m, dark, true));
			add(
				band(9.2, 8, a, b),
				shade(
					m,
					["#12171e", "rgb(27,29,31)", "rgb(40,42,46)", "rgb(61,65,71)"],
					true,
				),
			);
		} else {
			// I is a different volume within the same footprint: a broad shallow
			// crown with steep returns. Its top stays light; the edges carry depth.
			add(band(16, 14.8, a, b), shade(m, incidence(m) < 0 ? dark : light));
			add(band(14.8, 9.2, a, b), incidence(m) > 0 ? "#c8f4f0" : "#83c7d0");
			add(band(9.2, 8, a, b), shade(m, dark, true));
			// A sloped end face, part of the shell, meets the yellow inner return.
			// The inset never extends outside the established sector contour.
			const end = incidence(m + 90) < 0 ? b - 4 : a;
			add(band(14.8, 9.2, end, end + 4), shade(m + 90, light));
		}
	}
	return faces;
}
