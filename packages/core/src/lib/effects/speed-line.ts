import { COLOR } from "../ui/colors";
import type { FxPass } from "./arcade-fx";

/** Arrival cue: fresh light behind a moving source; the surface owns its history. */
export function paintSpeedLine(
	ctx: CanvasRenderingContext2D,
	pass: FxPass,
	x: number,
	y: number,
	vx: number,
	vy: number,
	opacity: number,
) {
	const speed = Math.hypot(vx, vy);
	if (
		speed < 1 ||
		opacity <= 0 ||
		!pass.visible(x, y, 420) ||
		!pass.budget.take(true)
	)
		return;
	const length = Math.min(420, speed * 0.7);
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(Math.atan2(vy, vx));
	ctx.strokeStyle = COLOR.countdown;
	ctx.lineCap = "round";
	// A bounded stepped tail: strongest at the stern, fading toward interstellar space.
	for (let segment = 0; segment < 12; segment++) {
		const strength = (1 - segment / 12) ** 2;
		ctx.globalAlpha = pass.opacity * opacity * strength * 0.45;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo((-length * segment) / 12, 0);
		ctx.lineTo((-length * (segment + 1)) / 12, 0);
		ctx.stroke();
	}
	ctx.restore();
}
