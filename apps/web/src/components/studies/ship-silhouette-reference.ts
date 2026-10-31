// Frozen pre-integration geometry for the preserved 02.1–02.3 study evidence.
import {
	type Loadout,
	type PartId,
	CHASSIS as productionChassis,
} from "../../../../../packages/mode-a/src/lib/schemas/loadout";

export { defaultLoadout } from "../../../../../packages/mode-a/src/lib/schemas/loadout";
export const CHASSIS = {
	...productionChassis,
	balanced: {
		...productionChassis.balanced,
		angle: 26,
		arm: 16,
		length: 32,
		width: 19,
	},
};
export interface BuildMount {
	key: string;
	label: string;
	x: number;
	y: number;
	angle: number;
	part: PartId | null;
	group: "side" | "hull" | "aft";
	index: number;
}
export function buildMounts(build: Loadout): BuildMount[] {
	const c = CHASSIS[build.chassis];
	return [
		{
			key: "left",
			label: "Left side · mirrored E",
			x: 0,
			y: -c.arm,
			angle: (c.angle * Math.PI) / 180,
			part: build.side,
			group: "side",
			index: 0,
		},
		{
			key: "right",
			label: "Right side · mirrored E",
			x: 0,
			y: c.arm,
			angle: (-c.angle * Math.PI) / 180,
			part: build.side,
			group: "side",
			index: 1,
		},
		...build.hull.map(
			(part, index): BuildMount => ({
				key: `hull-${index}`,
				label: `Hull ${index + 1} · G/U`,
				x: 9,
				y: (index - (c.hull - 1) / 2) * 10,
				angle: 0,
				part,
				group: "hull",
				index,
			}),
		),
		...build.aft.map(
			(part, index): BuildMount => ({
				key: `aft-${index}`,
				label: `Aft ${index + 1} · E/G/U`,
				x: -c.length * 0.6,
				y: (index - (c.aft - 1) / 2) * 12,
				angle: 0,
				part,
				group: "aft",
				index,
			}),
		),
	];
}
