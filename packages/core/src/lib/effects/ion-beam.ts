import { z } from "zod";
import { FX_INK } from "./arcade-fx";

export const PlumeStyleSchema = z.enum(["default", "ion-light", "ion-heavy"]);
export type PlumeStyle = z.infer<typeof PlumeStyleSchema>;
export type IonStyle = Exclude<PlumeStyle, "default">;

/** Two hard strokes make electric light; overlap supplies the distortion. */
export function paintIonBeam(
	ctx: CanvasRenderingContext2D,
	size: number,
	style: IonStyle,
) {
	paintBeam(ctx, size, style);
}
export function paintBeam(
	ctx: CanvasRenderingContext2D,
	size: number,
	style: PlumeStyle,
) {
	const heavy = style === "ion-heavy";
	const length = (heavy ? 42 : 30) * size;
	ctx.strokeStyle =
		style === "default" ? FX_INK.fire : heavy ? FX_INK.heavy : FX_INK.ion;
	ctx.lineWidth = heavy ? 2.4 : 1.6;
	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(-length, 0);
	ctx.stroke();
	ctx.strokeStyle = FX_INK.core;
	ctx.lineWidth = 0.65;
	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(-length * 0.75, 0);
	ctx.stroke();
}
