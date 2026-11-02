import { CRUISER } from "./cruiser";
import { FIGHTER } from "./fighter";
import type { ShipProfileId } from "./schemas/ship-profile";
import { SCOUT } from "./scout";
import { WASP } from "./wasp";

export const STABILIZER_PLACEMENTS = {
	fighter: { back: 77, inset: 10, angle: 37.7 },
	scout: { back: 67, inset: 38, angle: 67 },
	corvette: { back: 76, inset: 23, angle: 63 },
} as const;
export function stabilizerMount(chassis: ShipProfileId) {
	if (chassis === "wasp") {
		return {
			x: WASP.stabilizers.front.x,
			y: WASP.stabilizers.front.y,
			fx: WASP.stabilizers.front.fx,
			fy: WASP.stabilizers.front.fy,
			lever: WASP.stabilizers.coupledLever,
			inertiaPerMass: WASP.stabilizers.inertiaPerMass,
		};
	}
	const points =
		chassis === "fighter"
			? FIGHTER.hull
			: (chassis === "scout" ? SCOUT : CRUISER).facets.flatMap(
					(face) => face.points,
				);
	const nose = Math.max(...points.map((p) => p[0]));
	const stern = Math.min(...points.map((p) => p[0]));
	const width = 2 * Math.max(...points.map((p) => Math.abs(p[1])));
	const length = nose - stern;
	const placement = STABILIZER_PLACEMENTS[chassis];
	const x = nose - (length * placement.back) / 100;
	const y = width * (0.5 - placement.inset / 100);
	const angle = (placement.angle * Math.PI) / 180;
	const fx = -Math.cos(angle),
		fy = Math.sin(angle);
	return {
		x,
		y,
		fx,
		fy,
		lever: x * fy + y * fx,
		inertiaPerMass: (length ** 2 + width ** 2) / 12 + ((nose + stern) / 2) ** 2,
	};
}
export function drawWaspStabilizerSlits(ctx: CanvasRenderingContext2D) {
	drawStabilizerSlits(ctx, WASP.stabilizers.front);
	drawStabilizerSlits(ctx, WASP.stabilizers.rear);
}
export function drawStabilizerSlits(
	ctx: CanvasRenderingContext2D,
	geometry: { x: number; y: number; fx: number; fy: number },
) {
	for (const side of [-1, 1]) {
		ctx.save();
		ctx.translate(geometry.x, side * geometry.y);
		// Local +x is the force axis. Exhaust points backwards from the recessed slit.
		ctx.rotate(Math.atan2(-side * geometry.fy, geometry.fx));
		ctx.fillStyle = "#080b13";
		ctx.beginPath();
		ctx.moveTo(-1.2, -3.2);
		ctx.lineTo(1, -2.6);
		ctx.lineTo(1, 2.6);
		ctx.lineTo(-1.2, 3.2);
		ctx.closePath();
		ctx.fill();
		ctx.fillStyle = "#303d4c";
		ctx.fillRect(-0.45, -2.2, 0.9, 4.4);
		ctx.strokeStyle = "#718594";
		ctx.lineWidth = 0.25;
		ctx.beginPath();
		ctx.moveTo(0.65, -2.5);
		ctx.lineTo(0.65, 2.5);
		ctx.stroke();
		ctx.strokeStyle = "#69cfff";
		ctx.lineWidth = 0.45;
		ctx.beginPath();
		ctx.moveTo(-0.7, -2.3);
		ctx.lineTo(-0.7, 2.3);
		ctx.stroke();

		ctx.restore();
	}
}
