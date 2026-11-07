import { massWellReach, SUN_CONFIG, SURVIVAL_CONFIG } from "@void-drift/core";
import {
	buildCollisionRadius,
	buildDrain,
	buildStats,
	defaultLoadout,
	GRAVITY_TUNING,
	PARTS,
} from "@void-drift/mode-a";
import { wellPull } from "../../../lib/gravity-tuning/flight";
import {
	type BurnId,
	calculate,
	DT,
	inputAt,
	TRACK_COLORS,
	type Track,
} from "../../../lib/instrument";

export const loadout = defaultLoadout("wasp");
export const radius = SUN_CONFIG.G.radius;
export const reach = massWellReach(
	GRAVITY_TUNING.sunMass,
	GRAVITY_TUNING.cutoff,
	GRAVITY_TUNING.falloff,
);
export const initialPeak =
	SURVIVAL_CONFIG.POWER_REGEN_ZONE_1 *
	SUN_CONFIG.G.powerMultiplier *
	buildStats(loadout).coils;
export const coastDrain = buildDrain(loadout, {
	leftThruster: false,
	rightThruster: false,
	fire: false,
});
export const poweredDrain = buildDrain(loadout, {
	leftThruster: true,
	rightThruster: true,
	fire: false,
});
export const FIELD_PROFILES = {
	reference: { edge: 0, shoulder: 0 },
	edge: { edge: 0.1, shoulder: 0 },
	shoulder: { edge: 0.1, shoulder: 20 },
} as const;
export type FieldProfile = keyof typeof FIELD_PROFILES;
export function collection(
	distance: number,
	peak: number,
	profile: FieldProfile = "reference",
) {
	if (distance > reach) return 0;
	const { edge, shoulder } = FIELD_PROFILES[profile];
	const ramp = Math.max(
		0,
		Math.min(1, (reach - distance) / (reach - radius - shoulder)),
	);
	return peak * (edge + (1 - edge) * ramp);
}
export function breakEven(
	drain: number,
	peak: number,
	profile: FieldProfile = "reference",
) {
	if (peak <= drain) return null;
	const { edge, shoulder } = FIELD_PROFILES[profile];
	if (drain <= peak * edge) return reach;
	return (
		reach - ((drain / peak - edge) / (1 - edge)) * (reach - radius - shoulder)
	);
}
export const initialIonDraw = PARTS.ion.draw;

export function chargingRuns(
	burn: BurnId,
	peak: number,
	lifeSupport = coastDrain,
	ionDraw = initialIonDraw,
	profile: FieldProfile = "reference",
): Track[] {
	return [100, 220, 300].map((offset, i) => {
		const well = {
			x: 400,
			y: -offset,
			radius,
			strength: GRAVITY_TUNING.sunMass,
			cutoff: GRAVITY_TUNING.cutoff,
			falloff: GRAVITY_TUNING.falloff,
		};
		const shipRadius = buildCollisionRadius(loadout);
		const raw = calculate({ label: "Wasp", loadout }, burn, {
			startSpeed: 120,
			pull: (x, y) => wellPull(well, x, y, shipRadius),
		});
		const contact = raw.findIndex(
			(s) => Math.hypot(s.x - well.x, s.y - well.y) <= radius + shipRadius,
		);
		const samples = raw
			.slice(0, contact < 0 ? undefined : contact + 1)
			.map((s) => ({ ...s, x: s.x - well.x, y: s.y - well.y }));
		const gross = samples.map((s) =>
			collection(Math.hypot(s.x, s.y), peak, profile),
		);
		const consumption = samples.map((s, t) => {
			const input = inputAt(burn, Math.max(0, t - 1));
			const productionDrain = buildDrain(
				loadout,
				{ leftThruster: input.left, rightThruster: input.right, fire: false },
				(s.spin * Math.PI) / 180,
				DT / 4,
			);
			return (
				lifeSupport +
				((productionDrain - coastDrain) * ionDraw) / initialIonDraw
			);
		});
		const netPower = gross.map((v, t) => v - consumption[t]);
		let total = 0;
		const batteryChange = netPower.map((net, t) => {
			if (t > 0) total += net * DT;
			return total;
		});
		return {
			label: `Offset ${offset} u`,
			color: TRACK_COLORS[i],
			samples,
			contacts: contact < 0 ? [] : [contact],
			traces: {
				collection: gross,
				consumption,
				netPower,
				batteryChange,
			},
		};
	});
}
