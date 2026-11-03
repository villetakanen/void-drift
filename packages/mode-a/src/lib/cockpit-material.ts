import { CRUISER } from "./cruiser";
import { FIDDLER } from "./fiddler";
import { FIGHTER } from "./fighter";
import { SCOUT } from "./scout";
import { WASP } from "./wasp";

type Point = readonly [number, number];
function glass(
	ctx: CanvasRenderingContext2D,
	ship: "scout" | "fighter" | "wasp" | "fiddler" | "corvette",
) {
	const panes: readonly (readonly Point[])[] =
		ship === "fighter"
			? [FIGHTER.cockpit]
			: ship === "wasp"
				? WASP.facets.slice(-2).map((f) => f.points)
				: ship === "fiddler"
					? FIDDLER.facets.slice(-1).map((f) => f.points)
					: ship === "corvette"
						? CRUISER.facets.slice(-2).map((f) => f.points)
						: [];
	const all = panes.flat();
	const front =
		ship === "scout"
			? SCOUT.cockpit.x + SCOUT.cockpit.radius
			: Math.max(...all.map((p) => p[0]));
	const back =
		ship === "scout"
			? SCOUT.cockpit.x - SCOUT.cockpit.radius
			: Math.min(...all.map((p) => p[0]));
	ctx.save();
	ctx.beginPath();
	if (ship === "scout")
		ctx.arc(
			SCOUT.cockpit.x,
			SCOUT.cockpit.y,
			SCOUT.cockpit.radius,
			0,
			Math.PI * 2,
		);
	else
		for (const pane of panes) {
			pane.forEach(([x, y], i) => {
				if (i) ctx.lineTo(x, y);
				else ctx.moveTo(x, y);
			});
			ctx.closePath();
		}
	ctx.clip();
	const base = ctx.createLinearGradient(front, 0, back, 0);
	for (const [stop, color] of [
		[0, "#ecd365"],
		[0.21, "#827331"],
		[0.43, "#07121a"],
		[0.57, "#03070c"],
		[0.82, "#127045"],
		[1, "#71b76c"],
	] as const)
		base.addColorStop(stop, color);
	ctx.fillStyle = base;
	ctx.fillRect(back, -50, front - back, 100);
	if (ship === "scout") {
		const c = SCOUT.cockpit;
		const roll = ctx.createRadialGradient(c.x + 2, -2, 1, c.x, c.y, c.radius);
		roll.addColorStop(0, "#02070e00");
		roll.addColorStop(0.65, "#02070e30");
		roll.addColorStop(1, "#02070ed9");
		ctx.fillStyle = roll;
		ctx.fillRect(back, -50, front - back, 100);
	} else {
		const shade = ctx.createLinearGradient(front, 0, back, 0);
		for (const [stop, color] of [
			[0, "#527c35"],
			[0.3, "#123b2c"],
			[0.62, "#02070d"],
			[1, "#244952"],
		] as const)
			shade.addColorStop(stop, color);
		ctx.fillStyle = shade;
		ctx.fillRect(back, 0, front - back, 50);
	}
	ctx.restore();
}

export function drawScoutGlass(
	ctx: CanvasRenderingContext2D,
	angle = -70,
	reflectionAngle = -30,
	useGold = true,
	useReflection = true,
) {
	const c = SCOUT.cockpit;
	const rotation = (angle * Math.PI) / 180;
	const reflectionRotation = (reflectionAngle * Math.PI) / 180;
	ctx.save();
	ctx.translate(c.x, c.y);
	ctx.rotate(rotation);
	ctx.translate(-c.x, -c.y);
	if (useGold) {
		const rim = ctx.createLinearGradient(
			c.x + c.collarRadius,
			-c.collarRadius,
			c.x - c.collarRadius,
			c.collarRadius,
		);
		rim.addColorStop(0, "#f4df8c");
		rim.addColorStop(0.35, "#c4a64b");
		rim.addColorStop(0.65, "#76602c");
		rim.addColorStop(1, "#342c1c");
		ctx.beginPath();
		ctx.arc(c.x, c.y, c.collarRadius, 0, Math.PI * 2);
		ctx.fillStyle = rim;
		ctx.fill();
	}
	glass(ctx, "scout");
	if (useReflection) {
		ctx.save();
		ctx.translate(c.x, c.y);
		ctx.rotate(reflectionRotation - rotation);
		ctx.translate(-c.x, -c.y);
		ctx.beginPath();
		ctx.arc(c.x, c.y, c.collarRadius, 0, Math.PI * 2);
		ctx.clip();
		// A hard-edged bowed reflection band, matching the round atlas sample.
		// Clip once to the outer collar so the edge crosses glass and metal.
		const r = c.collarRadius;
		ctx.beginPath();
		ctx.moveTo(c.x + 0.1 * r, c.y - 1.2 * r);
		ctx.quadraticCurveTo(c.x - 0.65 * r, c.y, c.x + 0.1 * r, c.y + 1.2 * r);
		ctx.lineTo(c.x - 0.3 * r, c.y + 1.2 * r);
		ctx.quadraticCurveTo(c.x - 1.05 * r, c.y, c.x - 0.3 * r, c.y - 1.2 * r);
		ctx.closePath();
		ctx.fillStyle = "rgba(3, 7, 12, 0.65)";
		ctx.fill();
		ctx.restore();
	}
	ctx.restore();
}

export function drawAegisGlass(
	ctx: CanvasRenderingContext2D,
	gradientDegrees: number,
	reflectionDegrees: number,
	colour: string,
	opacity: number,
) {
	const outline = FIGHTER.cockpit;
	ctx.save();
	ctx.beginPath();
	outline.forEach(([x, y], i) => {
		if (i) ctx.lineTo(x, y);
		else ctx.moveTo(x, y);
	});
	ctx.closePath();
	ctx.clip();
	const a = (gradientDegrees * Math.PI) / 180;
	const projections = outline.map(
		([x, y]) => (x - 17.5) * Math.cos(a) + y * Math.sin(a),
	);
	const lo = Math.min(...projections),
		hi = Math.max(...projections);
	const gradient = ctx.createLinearGradient(
		17.5 + hi * Math.cos(a),
		hi * Math.sin(a),
		17.5 + lo * Math.cos(a),
		lo * Math.sin(a),
	);
	for (const [stop, color] of [
		[0, "#ecd365"],
		[0.21, "#827331"],
		[0.43, "#07121a"],
		[0.57, "#03070c"],
		[0.82, "#127045"],
		[1, "#71b76c"],
	] as const)
		gradient.addColorStop(stop, color);
	ctx.fillStyle = gradient;
	ctx.fillRect(8, -5, 19, 10);
	ctx.save();
	ctx.translate(17.5, 0);
	ctx.rotate((reflectionDegrees * Math.PI) / 180);
	ctx.beginPath();
	ctx.moveTo(2, -20);
	ctx.quadraticCurveTo(-4, 0, 2, 20);
	ctx.lineTo(-2, 20);
	ctx.quadraticCurveTo(-8, 0, -2, -20);
	ctx.closePath();
	ctx.globalAlpha = opacity;
	ctx.fillStyle = colour;
	ctx.fill();
	ctx.restore();
	ctx.restore();
	ctx.beginPath();
	outline.forEach(([x, y], i) => {
		if (i) ctx.lineTo(x, y);
		else ctx.moveTo(x, y);
	});
	ctx.closePath();
	ctx.strokeStyle = "#bba14e";
	ctx.lineWidth = 0.35;
	ctx.lineJoin = "miter";
	ctx.stroke();
}

export function drawLhiGlass(
	ctx: CanvasRenderingContext2D,
	offset: boolean,
	ship: "wasp" | "fiddler" = "wasp",
) {
	const fiddlerGlass = FIDDLER.facets[FIDDLER.facets.length - 1].points;
	const panes =
		ship === "wasp"
			? WASP.facets.slice(-2)
			: [
					{
						points: [
							fiddlerGlass[0],
							fiddlerGlass[5],
							fiddlerGlass[4],
							fiddlerGlass[3],
						],
					},
					{ points: fiddlerGlass.slice(0, 4) },
				];
	const points = panes.flatMap((p) => p.points);
	const front = Math.max(...points.map((p) => p[0]));
	const back = Math.min(...points.map((p) => p[0]));
	const length = front - back;
	for (const [index, pane] of panes.entries()) {
		ctx.save();
		ctx.beginPath();
		pane.points.forEach(([x, y], i) => {
			if (i) ctx.lineTo(x, y);
			else ctx.moveTo(x, y);
		});
		ctx.closePath();
		ctx.clip();
		const gradient = ctx.createLinearGradient(
			front,
			index === 0 ? -2 : 3,
			back,
			index === 0 ? 2 : -3,
		);
		for (const [stop, color] of [
			[0, "#ecd365"],
			[0.21, "#827331"],
			[0.43, "#07121a"],
			[0.57, "#03070c"],
			[0.82, "#127045"],
			[1, "#71b76c"],
		] as const)
			gradient.addColorStop(stop, color);
		ctx.fillStyle = gradient;
		ctx.fillRect(back, -5, length, 10);
		if (index === 1) {
			ctx.fillStyle = "rgba(2,7,14,.35)";
			ctx.fillRect(back, -5, length, 10);
		}
		const shift = offset && index === 1 ? length * 0.13 : 0;
		const edge = back + length * 0.43 + shift;
		// Opposite slopes meet on the ridge in A; the second pane steps aft in B.
		ctx.beginPath();
		ctx.moveTo(edge + length * 0.23, 0);
		ctx.lineTo(edge + length * 0.23 + 1.8, index === 0 ? -5 : 5);
		ctx.lineTo(edge + 1.8, index === 0 ? -5 : 5);
		ctx.lineTo(edge, 0);
		ctx.closePath();
		ctx.fillStyle = "rgba(3,7,12,.65)";
		ctx.fill();
		ctx.restore();
	}
	// Only the external perimeter receives gold; the ridge is a change in glass.
	const outline = [...panes[1].points, panes[0].points[2], panes[0].points[1]];
	ctx.beginPath();
	outline.forEach(([x, y], i) => {
		if (i) ctx.lineTo(x, y);
		else ctx.moveTo(x, y);
	});
	ctx.closePath();
	ctx.strokeStyle = "#bba14e";
	ctx.lineWidth = 0.35;
	ctx.lineJoin = "miter";
	ctx.stroke();
}

/** Approved 2026-11-03 manufacturer glass. Coordinates: +x forward. */
export function drawCockpitMaterial(
	ctx: CanvasRenderingContext2D,
	ship: string,
) {
	if (ship === "scout") drawScoutGlass(ctx);
	else if (ship === "fighter") drawAegisGlass(ctx, -79, -39, "#427fe0", 0.32);
	else if (ship === "wasp" || ship === "fiddler") drawLhiGlass(ctx, true, ship);
}
