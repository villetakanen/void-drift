/** Supplied cannon paths; one housing-centred geometry for artwork and muzzle. */
export const ION_CANNON_GEOMETRY = {
	length: 16,
	sourceLength: 19.501797,
	centreX: 247.00589,
	anchorY: 41.378276 + 19.501797 * 0.68,
	tipY: 41.378276,
} as const;
export const ION_CANNON_MUZZLE =
	((ION_CANNON_GEOMETRY.anchorY - ION_CANNON_GEOMETRY.tipY) *
		ION_CANNON_GEOMETRY.length) /
	ION_CANNON_GEOMETRY.sourceLength;
export const ION_CANNON_MUZZLE_SIDE =
	((246.91822 + 0.31343 / 2 - ION_CANNON_GEOMETRY.centreX) *
		ION_CANNON_GEOMETRY.length) /
	ION_CANNON_GEOMETRY.sourceLength;
export const ION_CANNON_ART: readonly (readonly [string, string])[] = [
	["#1b1d1f", "M246.21315 41.378277h2.0370066v19.501797h-2.0370066z"],
	["#3d4147", "m247.72051 41.684128h-1.37854l-.58036 -.305851h2.48854z"],
	["#52575f", "m245.76162 41.378276v19.501797h.58035l.00001 -19.195946z"],
	["#12171e", "m248.25015 41.378276l-1.90818 19.501797h1.90818z"],
	["#29baff", "M246.91822 51.787451V41.378277h.31343v10.409174z"],
	[
		"#c8f4f0",
		"m245.76162 49.860366l-1.39489 .805336v7.383504l1.39489 .805336z",
	],
	[
		"#437e99",
		"m248.25016 49.860366l1.39489 .805336v7.383504l-1.39489 .805336z",
	],
	["#83c7d0", "M245.76161 52.732132h3.8834298v1.995883h-3.8834298z"],
];
let paths: readonly (readonly [string, Path2D])[] | undefined;
export function drawIonCannon(
	ctx: CanvasRenderingContext2D,
	flightScale: number,
) {
	paths ??= ION_CANNON_ART.map(
		([color, path]) => [color, new Path2D(path)] as const,
	);
	ctx.save();
	ctx.rotate(Math.PI / 2);
	const scale =
		ION_CANNON_GEOMETRY.length / flightScale / ION_CANNON_GEOMETRY.sourceLength;
	ctx.scale(scale, scale);
	ctx.translate(-ION_CANNON_GEOMETRY.centreX, -ION_CANNON_GEOMETRY.anchorY);
	for (const [color, path] of paths) {
		ctx.fillStyle = color;
		ctx.fill(path);
	}
	ctx.restore();
}
