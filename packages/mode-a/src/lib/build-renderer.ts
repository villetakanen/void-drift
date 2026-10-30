import type { PlumeEmitter } from "@void-drift/core";
import { CRUISER } from "./cruiser";
import { FIGHTER } from "./fighter";
import { CHASSIS, type Loadout, PARTS, type PartId } from "./schemas/loadout";
export const BUILD_FLIGHT_SCALE = 0.65;
export interface BuildMount {
	key: string;
	label: string;
	x: number;
	y: number;
	angle: number;
	part: PartId | null;
	group: "side" | "hull" | "aft";
	index: number;
	width: number;
	height: number;
}
export function buildMounts(build: Loadout): BuildMount[] {
	const c = CHASSIS[build.chassis];
	return [
		{
			key: "left",
			label: "Left side · mirrored E",
			x: c.sideX,
			y: -c.arm,
			angle: (c.angle * Math.PI) / 180,
			part: build.side,
			group: "side",
			index: 0,
			width: build.chassis !== "scout" ? 14 : 10,
			height: build.chassis !== "scout" ? 9 : 8,
		},
		{
			key: "right",
			label: "Right side · mirrored E",
			x: c.sideX,
			y: c.arm,
			angle: (-c.angle * Math.PI) / 180,
			part: build.side,
			group: "side",
			index: 1,
			width: build.chassis !== "scout" ? 14 : 10,
			height: build.chassis !== "scout" ? 9 : 8,
		},
		...build.hull.map(
			(part, index): BuildMount => ({
				key: `hull-${index}`,
				label: `Hull ${index + 1} · G/U`,
				x:
					build.chassis === "tank"
						? CRUISER.hullMounts[index]
						: build.chassis === "balanced"
							? 2 - index * 12
							: 9,
				y: build.chassis !== "scout" ? 0 : (index - (c.hull - 1) / 2) * 10,
				angle: 0,
				part,
				group: "hull",
				index,
				width: build.chassis !== "scout" ? 11 : 10,
				height: build.chassis !== "scout" ? 9 : 8,
			}),
		),
		...build.aft.map(
			(part, index): BuildMount => ({
				key: `aft-${index}`,
				label: `Aft ${index + 1} · E/G/U`,
				x:
					build.chassis === "tank"
						? CRUISER.aftMounts[index][0]
						: build.chassis === "balanced"
							? -22
							: -c.length * 0.6,
				y:
					build.chassis === "tank"
						? CRUISER.aftMounts[index][1]
						: (index - (c.aft - 1) / 2) *
							(build.chassis === "balanced" ? 10 : 12),
				angle: 0,
				part,
				group: "aft",
				index,
				width: build.chassis !== "scout" ? 11 : 10,
				height: build.chassis !== "scout" ? 9 : 8,
			}),
		),
	];
}
export function drawBuild(
	ctx: CanvasRenderingContext2D,
	build: Loadout,
	x: number,
	y: number,
	rotation: number,
	scale = 1,
	selected = "",
) {
	const c = CHASSIS[build.chassis];
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(rotation);
	ctx.scale(scale, scale);
	if (build.chassis === "tank") {
		// Clip out the stern channel without painting over the scene beneath it.
		ctx.save();
		ctx.beginPath();
		ctx.rect(-100, -100, 200, 200);
		CRUISER.notch.forEach(([x, y], i) => {
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		});
		ctx.closePath();
		ctx.clip("evenodd");
		for (const facet of CRUISER.facets) polygon(ctx, facet.points, facet.color);
		ctx.restore();
	} else if (build.chassis === "balanced") {
		for (const [index, point] of FIGHTER.hull.entries()) {
			const next = FIGHTER.hull[(index + 1) % FIGHTER.hull.length];
			polygon(
				ctx,
				[[-3, 0], point, next],
				FIGHTER.facets[
					(point[1] + next[1]) / 2 < 0 ? index % 3 : 3 + (index % 3)
				],
			);
		}
		polygon(ctx, FIGHTER.ridge, "#a2d8df");
		polygon(
			ctx,
			[
				[38, 0],
				[-21, 0],
				[-15, 4],
			],
			"#51869e",
		);
		polygon(ctx, FIGHTER.cockpit, "#000000");
	} else {
		ctx.lineWidth = 1;
		ctx.strokeStyle = "#d4ff00";
		ctx.fillStyle = "#101b21";
		ctx.beginPath();
		ctx.moveTo(c.length, 0);
		ctx.lineTo(-c.length * 0.65, -c.width);
		ctx.lineTo(-c.length * 0.85, 0);
		ctx.lineTo(-c.length * 0.65, c.width);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.strokeStyle = "#537079";
		ctx.beginPath();
		ctx.moveTo(c.length * 0.6, 0);
		ctx.lineTo(-c.length * 0.5, 0);
		ctx.stroke();
	}
	for (const mount of buildMounts(build)) {
		ctx.save();
		ctx.translate(mount.x, mount.y);
		ctx.rotate(mount.angle);
		ctx.strokeStyle =
			mount.key === selected
				? "#ffffff"
				: mount.part
					? PARTS[mount.part].category === "E"
						? "#9af7ff"
						: "#d4ff00"
					: "#e0ffff";
		ctx.fillStyle = mount.part ? "#071015" : "rgb(7 16 21 / 38%)";
		ctx.lineWidth = 0.45;
		ctx.fillRect(
			-mount.width / 2,
			-mount.height / 2,
			mount.width,
			mount.height,
		);
		ctx.strokeRect(
			-mount.width / 2,
			-mount.height / 2,
			mount.width,
			mount.height,
		);
		if (mount.part === "rail" || mount.part === "laser") {
			const barrel =
				build.chassis !== "scout"
					? mount.width / 2 + (mount.part === "rail" ? 1 : 0)
					: mount.part === "rail"
						? 18
						: 10;
			ctx.fillRect(0, -2, barrel, 4);
			ctx.strokeRect(0, -2, barrel, 4);
		} else if (mount.part === "coil") {
			for (let i = -3; i <= 3; i += 3) {
				ctx.beginPath();
				ctx.ellipse(i, 0, 1.5, 3, 0, 0, Math.PI * 2);
				ctx.stroke();
			}
		} else if (mount.part === "battery") {
			ctx.beginPath();
			ctx.moveTo(-2, -2);
			ctx.lineTo(2, -2);
			ctx.moveTo(0, -4);
			ctx.lineTo(0, 0);
			ctx.stroke();
		} else if (mount.part) {
			ctx.strokeStyle = mount.part === "ion" ? "#9af7ff" : "#ffc56e";
			ctx.beginPath();
			ctx.moveTo(-mount.width / 2, -3);
			ctx.lineTo(-nozzleOffset(mount), -4);
			ctx.lineTo(-nozzleOffset(mount), 4);
			ctx.lineTo(-mount.width / 2, 3);
			ctx.stroke();
		}
		if (mount.key === selected) {
			ctx.strokeStyle = "#ffffff";
			ctx.strokeRect(
				-mount.width / 2 - 1,
				-mount.height / 2 - 1,
				mount.width + 2,
				mount.height + 2,
			);
		}
		ctx.restore();
	}
	ctx.restore();
}

/** Emission uses the same mount/nozzle geometry as the ship drawing. */
export function buildPlumeEmitters(build: Loadout): PlumeEmitter[] {
	return buildMounts(build)
		.filter((mount) => mount.part && PARTS[mount.part].category === "E")
		.map((mount) => ({
			x:
				(mount.x - nozzleOffset(mount) * Math.cos(mount.angle)) *
				BUILD_FLIGHT_SCALE,
			y:
				(mount.y - nozzleOffset(mount) * Math.sin(mount.angle)) *
				BUILD_FLIGHT_SCALE,
			angle: mount.angle,
			output: 0,
		}));
}

export function nozzleOffset(mount: BuildMount) {
	return mount.width / 2 + 3;
}
function polygon(
	ctx: CanvasRenderingContext2D,
	points: readonly (readonly [number, number])[],
	color: string,
) {
	ctx.fillStyle = color;
	ctx.beginPath();
	points.forEach(([x, y], index) => {
		if (index === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	});
	ctx.closePath();
	ctx.fill();
}
/** Conservative circular collision envelope, including the accepted forward tip. */
export function buildCollisionRadius(build: Loadout) {
	if (build.chassis === "tank") {
		const hull = Math.max(
			...CRUISER.facets.flatMap((f) =>
				f.points.map(([x, y]) => Math.hypot(x, y)),
			),
		);
		const fittings = buildMounts(build).map(
			(m) => Math.hypot(m.x, m.y) + Math.hypot(m.width / 2 + 3, m.height / 2),
		);
		return Math.max(hull, ...fittings) * BUILD_FLIGHT_SCALE;
	}
	return build.chassis === "balanced"
		? FIGHTER.length * BUILD_FLIGHT_SCALE
		: 16;
}
