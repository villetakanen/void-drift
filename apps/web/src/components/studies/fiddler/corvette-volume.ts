import { FIGHTER, type SlotType } from "@void-drift/mode-a";
import { LHI_FORM, type LhiFace } from "./lhi-form";

type Point = readonly [number, number];
export type VolumeVariant = "twin" | "centre";
export interface VolumeMount {
	x: number;
	y: number;
	type: SlotType;
}
const [, top, left, dark, right, mid] = FIGHTER.facets;

// Named parts of the preserved draft reconstruction. Keep its actual contours and
// plane boundaries: 7 shoulder faces, 10 pincer faces, then the command body.
const shoulders = LHI_FORM.draft.slice(0, 7);
const pincers = LHI_FORM.draft.slice(7, 17);
const command = LHI_FORM.draft.slice(17);
const remap = (
	faces: readonly LhiFace[],
	transform: (p: Point) => Point,
): LhiFace[] =>
	faces.map((face) => ({ ...face, points: face.points.map(transform) }));

export function corvetteVolume(variant: VolumeVariant) {
	const twin = variant === "twin";
	const faces: LhiFace[] = [];
	const add = (points: readonly Point[], color: string) =>
		faces.push({ points, color });
	// Inner shoulders: flat deck over a deeper lower chine. The command body remains
	// the same separate object, rather than becoming a broad replacement canopy shell.
	if (!twin) {
		add(
			[
				[-26, -10],
				[-10, -14],
				[10, -14],
				[26, -10],
				[43, 23],
				[33, 42],
				[12, 51],
				[-12, 51],
				[-33, 42],
				[-43, 23],
			],
			mid,
		);
		add(
			[
				[-26, -10],
				[-10, -14],
				[-6, 30],
				[-12, 51],
				[-33, 42],
				[-43, 23],
			],
			left,
		);
		add(
			[
				[10, -14],
				[26, -10],
				[43, 23],
				[33, 42],
				[12, 51],
				[6, 30],
			],
			dark,
		);
		add(
			[
				[-23, -8],
				[-10, -14],
				[-6, 30],
				[-12, 43],
				[-28, 35],
				[-35, 21],
			],
			top,
		);
		add(
			[
				[10, -14],
				[23, -8],
				[35, 21],
				[28, 35],
				[12, 43],
				[6, 30],
			],
			mid,
		);
	}
	const shoulderFaces = remap(shoulders, ([x, y]) => {
		const across =
			Math.abs(x) <= 12
				? x
				: Math.sign(x) * (12 + (Math.abs(x) - 12) * (twin ? 1.9 : 1.7));
		return [across, y + 3];
	});
	faces.push(...shoulderFaces);

	// The front five vertices of each bow are a translation of the draft, not a
	// new pod outline. Added breadth begins BEHIND the copied front plane.
	const pincerFaces = remap(pincers, ([x, y]) => {
		const amount = Math.max(0, Math.min(1, (y + 33.8) / 47.2));
		const breadth = 1 + amount * (twin ? 1.25 : 0.12);
		return [Math.sign(x) * (27 + (Math.abs(x) - 17) * breadth), y - 4.4];
	});
	faces.push(...pincerFaces);
	// A gives each forward hull a calm equipment deck inside its original angular
	// outer section. B instead carries its additional deck beside the command body.
	if (twin) {
		add(
			[
				[-31, -37],
				[-28, -9],
				[-35, 15],
				[-45, 22],
				[-41, -5],
			],
			mid,
		);
		add(
			[
				[-31, -37],
				[-28, -9],
				[-35, 15],
				[-39, 13],
				[-36, -7],
			],
			top,
		);
		add(
			[
				[31, -37],
				[41, -5],
				[45, 22],
				[35, 15],
				[28, -9],
			],
			right,
		);
		add(
			[
				[31, -37],
				[36, -7],
				[39, 13],
				[35, 15],
				[28, -9],
			],
			mid,
		);
	}
	faces.push(...command);
	const inherited = [pincerFaces[0], pincerFaces[5], ...command];
	const mounts: VolumeMount[] = [];
	for (const side of [-1, 1]) {
		mounts.push(
			{ x: side * 32.5, y: -29, type: "equipment" },
			{ x: side * (twin ? 34 : 32), y: -12, type: "equipment" },
			{ x: side * (twin ? 34 : 21), y: 14, type: "equipment" },
			{ x: side * (twin ? 19 : 17), y: 32, type: "universal" },
			{ x: side * 30, y: 28, type: "engine" },
		);
	}
	return {
		faces,
		inherited,
		mounts,
		front: { x: 40, y: 35.2, fx: 0, fy: 1 },
		rear: { x: -22, y: twin ? 44 : 40, fx: 0, fy: 1 },
	};
}
