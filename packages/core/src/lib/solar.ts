import type { Star } from "./physics/Physics";
import type { EnergyField } from "./schemas/sun";

export const STANDARD_SUN = {
	radius: 35,
	shoulder: 55,
	damageReach: 100,
	damagePeak: 1.5,
	collectionPeak: 7.5,
	outerFraction: 0.1,
} as const;

export function fieldRate(distance: number, field: EnergyField): number {
	if (distance > field.reach) return 0;
	if (distance <= field.shoulder) return field.peak;
	const fraction = (distance - field.shoulder) / (field.reach - field.shoulder);
	return field.peak * (1 - fraction * (1 - field.outerFraction));
}
export function solarField(star: Star): EnergyField {
	return {
		reach: star.influenceRadius,
		shoulder: STANDARD_SUN.shoulder,
		peak: STANDARD_SUN.collectionPeak,
		outerFraction: STANDARD_SUN.outerFraction,
	};
}
export function solarCollectionRate(
	distance: number,
	star: Star,
	collectors = 1,
) {
	return fieldRate(distance, solarField(star)) * collectors;
}
export function solarDamageRate(distance: number) {
	return fieldRate(distance, {
		reach: STANDARD_SUN.damageReach,
		shoulder: STANDARD_SUN.shoulder,
		peak: STANDARD_SUN.damagePeak,
		outerFraction: 0,
	});
}
