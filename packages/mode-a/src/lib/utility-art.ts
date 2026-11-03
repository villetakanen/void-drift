import { z } from "zod";
import { GRAVITY_COIL_SCALE, gravityCoilFaces } from "./gravity-coil-art";
import { drawPotentialWell, POTENTIAL_WELL_SCALE } from "./potential-well-art";

// Artwork identifiers only: these do not add game devices or loadout entries.
export const UtilityArtworkIdSchema = z.enum([
	"storage",
	"solar",
	"gravity",
	"repair",
]);
export type UtilityArtworkId = z.infer<typeof UtilityArtworkIdSchema>;
export const UtilityFaceSchema = z.object({
	contours: z
		.array(z.array(z.tuple([z.number().finite(), z.number().finite()])).min(3))
		.min(1),
	color: z.string().regex(/^#[0-9a-f]{6}$/i),
	fillRule: z.enum(["nonzero", "evenodd"]),
});
const UtilityArtSchema = z.object({
	storage: z.array(UtilityFaceSchema),
	solar: z.array(UtilityFaceSchema),
	gravity: z.array(UtilityFaceSchema),
	repair: z.array(UtilityFaceSchema),
});
export const UTILITY_ACCENT = "#cedb17";
export const UTILITY_MOUNT_SCALE = 0.35;
// Resting faces; Gravity coil superseded by the accepted M / Inset ring. Local +x points forward, as in ship/engine artwork.
export const UTILITY_ART = UtilityArtSchema.parse({
	storage: [
		{
			contours: [
				[
					[11.0, -8.0],
					[12.0, -7.0],
					[12.0, -2.0],
					[11.0, -1.0],
					[-12.0, -1.0],
					[-12.0, -8.0],
				],
			],
			color: "#304759",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[11.0, -8.0],
					[12.0, -7.0],
					[-11.0, -7.0],
					[-12.0, -8.0],
				],
			],
			color: "#d1e5ec",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[12.0, -7.0],
					[12.0, -2.0],
					[-11.0, -2.0],
					[-11.0, -7.0],
				],
			],
			color: "#7894a4",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[11.0, 1.0],
					[12.0, 2.0],
					[12.0, 7.0],
					[11.0, 8.0],
					[-12.0, 8.0],
					[-12.0, 1.0],
				],
			],
			color: "#304759",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[11.0, 1.0],
					[12.0, 2.0],
					[-11.0, 2.0],
					[-12.0, 1.0],
				],
			],
			color: "#d1e5ec",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[12.0, 2.0],
					[12.0, 7.0],
					[-11.0, 7.0],
					[-11.0, 2.0],
				],
			],
			color: "#7894a4",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[7.0, -10.0],
					[8.0, -9.0],
					[8.0, 9.0],
					[7.0, 10.0],
					[4.0, 10.0],
					[4.0, -10.0],
				],
			],
			color: "#71780d",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[7.0, -10.0],
					[8.0, -9.0],
					[5.0, -9.0],
					[4.0, -10.0],
				],
			],
			color: "#edfc1a",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[8.0, -9.0],
					[8.0, 9.0],
					[5.0, 9.0],
					[5.0, -9.0],
				],
			],
			color: "#cedb17",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[-6.0, -10.0],
					[-5.0, -9.0],
					[-5.0, 9.0],
					[-6.0, 10.0],
					[-9.0, 10.0],
					[-9.0, -10.0],
				],
			],
			color: "#71780d",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[-6.0, -10.0],
					[-5.0, -9.0],
					[-8.0, -9.0],
					[-9.0, -10.0],
				],
			],
			color: "#edfc1a",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[-5.0, -9.0],
					[-5.0, 9.0],
					[-8.0, 9.0],
					[-8.0, -9.0],
				],
			],
			color: "#cedb17",
			fillRule: "nonzero",
		},
	],
	solar: [
		{
			contours: [
				[
					[9.0, 1.4],
					[10.0, 1.75],
					[10.0, 6.65],
					[9.0, 7.0],
					[-10.0, 7.0],
					[-10.0, 1.4],
				],
			],
			color: "#304759",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[9.0, 1.4],
					[10.0, 1.75],
					[-9.0, 1.75],
					[-10.0, 1.4],
				],
			],
			color: "#d1e5ec",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[10.0, 1.75],
					[10.0, 6.65],
					[-9.0, 6.65],
					[-9.0, 1.75],
				],
			],
			color: "#7894a4",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[7.0, 2.1],
					[7.0, 6.3],
					[3.0, 6.3],
					[3.0, 2.1],
				],
				[
					[1.0, 2.1],
					[1.0, 6.3],
					[-3.0, 6.3],
					[-3.0, 2.1],
				],
				[
					[-5.0, 2.1],
					[-5.0, 6.3],
					[-8.0, 6.3],
					[-8.0, 2.1],
				],
			],
			color: "#174c70",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[9.0, -7.0],
					[10.0, -6.65],
					[10.0, -1.75],
					[9.0, -1.4],
					[-10.0, -1.4],
					[-10.0, -7.0],
				],
			],
			color: "#304759",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[9.0, -7.0],
					[10.0, -6.65],
					[-9.0, -6.65],
					[-10.0, -7.0],
				],
			],
			color: "#d1e5ec",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[10.0, -6.65],
					[10.0, -1.75],
					[-9.0, -1.75],
					[-9.0, -6.65],
				],
			],
			color: "#7894a4",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[7.0, -6.3],
					[7.0, -2.1],
					[3.0, -2.1],
					[3.0, -6.3],
				],
				[
					[1.0, -6.3],
					[1.0, -2.1],
					[-3.0, -2.1],
					[-3.0, -6.3],
				],
				[
					[-5.0, -6.3],
					[-5.0, -2.1],
					[-8.0, -2.1],
					[-8.0, -6.3],
				],
			],
			color: "#174c70",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[11.0, -4.0],
					[12.0, -3.0],
					[12.0, 3.0],
					[11.0, 4.0],
					[-12.0, 4.0],
					[-12.0, -4.0],
				],
			],
			color: "#304759",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[11.0, -4.0],
					[12.0, -3.0],
					[-11.0, -3.0],
					[-12.0, -4.0],
				],
			],
			color: "#d1e5ec",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[12.0, -3.0],
					[12.0, 3.0],
					[-11.0, 3.0],
					[-11.0, -3.0],
				],
			],
			color: "#7894a4",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[2.0, -7.0],
					[3.0, -6.0],
					[3.0, -3.0],
					[2.0, -2.0],
					[-4.0, -2.0],
					[-4.0, -7.0],
				],
			],
			color: "#71780d",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[2.0, -7.0],
					[3.0, -6.0],
					[-3.0, -6.0],
					[-4.0, -7.0],
				],
			],
			color: "#edfc1a",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[3.0, -6.0],
					[3.0, -3.0],
					[-3.0, -3.0],
					[-3.0, -6.0],
				],
			],
			color: "#cedb17",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[2.0, 2.0],
					[3.0, 3.0],
					[3.0, 6.0],
					[2.0, 7.0],
					[-4.0, 7.0],
					[-4.0, 2.0],
				],
			],
			color: "#71780d",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[2.0, 2.0],
					[3.0, 3.0],
					[-3.0, 3.0],
					[-4.0, 2.0],
				],
			],
			color: "#edfc1a",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[3.0, 3.0],
					[3.0, 6.0],
					[-3.0, 6.0],
					[-3.0, 3.0],
				],
			],
			color: "#cedb17",
			fillRule: "nonzero",
		},
	],
	gravity: gravityCoilFaces(),
	repair: [
		{
			contours: [
				[
					[6.0, -7.0],
					[7.0, -6.0],
					[7.0, 6.0],
					[6.0, 7.0],
					[-7.0, 7.0],
					[-7.0, -7.0],
				],
			],
			color: "#304759",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[6.0, -7.0],
					[7.0, -6.0],
					[-6.0, -6.0],
					[-7.0, -7.0],
				],
			],
			color: "#d1e5ec",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[7.0, -6.0],
					[7.0, 6.0],
					[-6.0, 6.0],
					[-6.0, -6.0],
				],
			],
			color: "#7894a4",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[2.0, -10.0],
					[3.0, -9.0],
					[3.0, 9.0],
					[2.0, 10.0],
					[-3.0, 10.0],
					[-3.0, -10.0],
				],
			],
			color: "#71780d",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[2.0, -10.0],
					[3.0, -9.0],
					[-2.0, -9.0],
					[-3.0, -10.0],
				],
			],
			color: "#edfc1a",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[3.0, -9.0],
					[3.0, 9.0],
					[-2.0, 9.0],
					[-2.0, -9.0],
				],
			],
			color: "#cedb17",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[11.0, -2.0],
					[12.0, -1.0],
					[12.0, 1.0],
					[11.0, 2.0],
					[6.0, 2.0],
					[6.0, -2.0],
				],
			],
			color: "#304759",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[11.0, -2.0],
					[12.0, -1.0],
					[7.0, -1.0],
					[6.0, -2.0],
				],
			],
			color: "#d1e5ec",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[12.0, -1.0],
					[12.0, 1.0],
					[7.0, 1.0],
					[7.0, -1.0],
				],
			],
			color: "#7894a4",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[8.0, -2.0],
					[9.0, -1.0],
					[9.0, 1.0],
					[8.0, 2.0],
					[7.0, 2.0],
					[7.0, -2.0],
				],
			],
			color: "#71780d",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[8.0, -2.0],
					[9.0, -1.0],
					[8.0, -1.0],
					[7.0, -2.0],
				],
			],
			color: "#edfc1a",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[9.0, -1.0],
					[9.0, 1.0],
					[8.0, 1.0],
					[8.0, -1.0],
				],
			],
			color: "#cedb17",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[2.0, 11.0],
					[1.0, 12.0],
					[-1.0, 12.0],
					[-2.0, 11.0],
					[-2.0, 6.0],
					[2.0, 6.0],
				],
			],
			color: "#304759",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[2.0, 11.0],
					[1.0, 12.0],
					[1.0, 7.0],
					[2.0, 6.0],
				],
			],
			color: "#d1e5ec",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[1.0, 12.0],
					[-1.0, 12.0],
					[-1.0, 7.0],
					[1.0, 7.0],
				],
			],
			color: "#7894a4",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[2.0, 8.0],
					[1.0, 9.0],
					[-1.0, 9.0],
					[-2.0, 8.0],
					[-2.0, 7.0],
					[2.0, 7.0],
				],
			],
			color: "#71780d",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[2.0, 8.0],
					[1.0, 9.0],
					[1.0, 8.0],
					[2.0, 7.0],
				],
			],
			color: "#edfc1a",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[1.0, 9.0],
					[-1.0, 9.0],
					[-1.0, 8.0],
					[1.0, 8.0],
				],
			],
			color: "#cedb17",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[-11.0, 2.0],
					[-12.0, 1.0],
					[-12.0, -1.0],
					[-11.0, -2.0],
					[-6.0, -2.0],
					[-6.0, 2.0],
				],
			],
			color: "#304759",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[-11.0, 2.0],
					[-12.0, 1.0],
					[-7.0, 1.0],
					[-6.0, 2.0],
				],
			],
			color: "#d1e5ec",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[-12.0, 1.0],
					[-12.0, -1.0],
					[-7.0, -1.0],
					[-7.0, 1.0],
				],
			],
			color: "#7894a4",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[-8.0, 2.0],
					[-9.0, 1.0],
					[-9.0, -1.0],
					[-8.0, -2.0],
					[-7.0, -2.0],
					[-7.0, 2.0],
				],
			],
			color: "#71780d",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[-8.0, 2.0],
					[-9.0, 1.0],
					[-8.0, 1.0],
					[-7.0, 2.0],
				],
			],
			color: "#edfc1a",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[-9.0, 1.0],
					[-9.0, -1.0],
					[-8.0, -1.0],
					[-8.0, 1.0],
				],
			],
			color: "#cedb17",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[-2.0, -11.0],
					[-1.0, -12.0],
					[1.0, -12.0],
					[2.0, -11.0],
					[2.0, -6.0],
					[-2.0, -6.0],
				],
			],
			color: "#304759",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[-2.0, -11.0],
					[-1.0, -12.0],
					[-1.0, -7.0],
					[-2.0, -6.0],
				],
			],
			color: "#d1e5ec",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[-1.0, -12.0],
					[1.0, -12.0],
					[1.0, -7.0],
					[-1.0, -7.0],
				],
			],
			color: "#7894a4",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[-2.0, -8.0],
					[-1.0, -9.0],
					[1.0, -9.0],
					[2.0, -8.0],
					[2.0, -7.0],
					[-2.0, -7.0],
				],
			],
			color: "#71780d",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[-2.0, -8.0],
					[-1.0, -9.0],
					[-1.0, -8.0],
					[-2.0, -7.0],
				],
			],
			color: "#edfc1a",
			fillRule: "nonzero",
		},
		{
			contours: [
				[
					[-1.0, -9.0],
					[1.0, -9.0],
					[1.0, -8.0],
					[-1.0, -8.0],
				],
			],
			color: "#cedb17",
			fillRule: "nonzero",
		},
	],
});

export function utilityArtworkScale(id: UtilityArtworkId): number {
	if (id === "storage") return POTENTIAL_WELL_SCALE;
	if (id === "gravity") return GRAVITY_COIL_SCALE;
	return UTILITY_MOUNT_SCALE;
}

export function drawUtilityArtwork(
	ctx: CanvasRenderingContext2D,
	id: UtilityArtworkId,
	scale = utilityArtworkScale(id),
) {
	ctx.save();
	if (id === "storage") {
		ctx.scale(scale / POTENTIAL_WELL_SCALE, scale / POTENTIAL_WELL_SCALE);
		drawPotentialWell(ctx);
		ctx.restore();
		return;
	}
	ctx.scale(scale, scale);
	for (const face of UTILITY_ART[id]) {
		ctx.fillStyle = face.color;
		ctx.beginPath();
		for (const contour of face.contours) {
			contour.forEach(([x, y], i) => {
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			});
			ctx.closePath();
		}
		ctx.fill(face.fillRule);
	}
	ctx.restore();
}
