// Study-only geometry. The silhouette uses the original 1A sector radii and gaps.
// Screen coordinates: x right, y down; illumination comes from upper left.
export interface Face {
	points: readonly (readonly number[])[];
	color: string;
}
const point = (r: number, a: number): [number, number] => [
	r * Math.cos((a * Math.PI) / 180),
	r * Math.sin((a * Math.PI) / 180),
];
export const band = (outer: number, inner: number, a: number, b: number) => [
	...Array.from({ length: 4 }, (_, i) => point(outer, a + ((b - a) * i) / 3)),
	...Array.from({ length: 4 }, (_, i) => point(inner, b - ((b - a) * i) / 3)),
];
const blue = ["#264d6b", "#437e99", "#83c7d0", "#c8f4f0"];
const charcoal = [
	"rgb(27,29,31)",
	"rgb(40,42,46)",
	"rgb(61,65,71)",
	"rgb(82,87,95)",
];
const yellow = ["#87920f", "#a5af20", "#cedb17", "#d7df62"];
function tone(angle: number, palette: string[], inward = false) {
	const dot = -Math.cos(((angle - 45) * Math.PI) / 180) * (inward ? -1 : 1);
	return palette[dot > 0.6 ? 3 : dot > 0 ? 2 : dot > -0.6 ? 1 : 0];
}
export function coil(construction: "shell" | "saddle"): Face[] {
	const faces: Face[] = [];
	const add = (points: Face["points"], color: string) =>
		faces.push({ points, color });
	// Continuous yellow inner ribbon connects every sector without filling the aperture.
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
	for (let i = 0; i < 8; i++) {
		const a = 94 + i * 45;
		const b = a + 37;
		const m = (a + b) / 2;
		if (construction === "shell") {
			// Two broad sloping faces meet at a crest. Inner and outer normals oppose.
			add(band(16, 12.7, a, b), tone(m, blue));
			add(band(12.7, 9.2, a, b), tone(m, blue, true));
			add(band(9.2, 8, a, b), tone(m, charcoal, true));
		} else {
			// A blue saddle stays within each original sector; the charcoal inset
			// exposes the saddle at its two ends and its inner shoulder.
			add(band(16, 12.7, a, b), tone(m, blue));
			add(band(12.7, 8, a, b), tone(m, blue, true));
			add(band(15.7, 12.7, a + 5, b - 5), tone(m, charcoal));
			add(band(12.7, 9.8, a + 5, b - 5), tone(m, charcoal, true));
		}
	}
	return faces;
}
export const points = (ps: Face["points"]) =>
	ps.map((p) => p.join(",")).join(" ");
