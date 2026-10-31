import { z } from "zod";

/** Core visual identity, independent of any game's part catalog. */
export const PlumeStyleSchema = z.enum(["default", "ion-light", "ion-heavy"]);
export type PlumeStyle = z.infer<typeof PlumeStyleSchema>;
export type IonStyle = Exclude<PlumeStyle, "default">;

export const ION_BEAM_STYLES = {
	"ion-light": {
		length: 1,
		width: 1,
		outer: "19,174,191",
		color: "112,255,226",
		glow: "#25e9d2",
	},
	"ion-heavy": {
		length: 1.4,
		width: 1.45,
		outer: "19,157,205",
		color: "112,226,255",
		glow: "#25cfe9",
	},
} as const;

/** One complete mark; EnginePlume owns its world position, motion and fade. */
export function paintIonBeam(
	ctx: CanvasRenderingContext2D,
	size: number,
	style: IonStyle,
) {
	const palette = ION_BEAM_STYLES[style];
	const length = 48 * size * palette.length;
	for (const [width, color, alpha] of [
		[6, palette.outer, 0.12],
		[3, palette.color, 0.3],
		[1.6, palette.color, 1],
		[0.6, "234,255,249", 1],
	] as const) {
		const fade = ctx.createLinearGradient(-length, 0, 0, 0);
		fade.addColorStop(0, `rgba(${color},0)`);
		fade.addColorStop(0.3, `rgba(${color},${alpha * 0.2})`);
		fade.addColorStop(0.75, `rgba(${color},${alpha})`);
		fade.addColorStop(1, `rgba(${color},${alpha})`);
		ctx.fillStyle = fade;
		ctx.shadowColor = palette.glow;
		ctx.shadowBlur = width === 1.6 ? 9 : 0;
		const breadth = width * palette.width;
		ctx.fillRect(-length, -breadth / 2, length, breadth);
	}
	ctx.shadowBlur = 0;
}
