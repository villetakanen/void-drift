import { CHASSIS, type Loadout, PARTS, type PartId } from "./schemas/loadout";
export interface BuildMount {
	key: string;
	label: string;
	x: number;
	y: number;
	angle: number;
	part: PartId | null;
	group: "side" | "hull" | "aft";
	index: number;
}
export function buildMounts(build: Loadout): BuildMount[] {
	const c = CHASSIS[build.chassis];
	return [
		{
			key: "left",
			label: "Left side · mirrored E",
			x: 0,
			y: -c.arm,
			angle: (c.angle * Math.PI) / 180,
			part: build.side,
			group: "side",
			index: 0,
		},
		{
			key: "right",
			label: "Right side · mirrored E",
			x: 0,
			y: c.arm,
			angle: (-c.angle * Math.PI) / 180,
			part: build.side,
			group: "side",
			index: 1,
		},
		...build.hull.map(
			(part, index): BuildMount => ({
				key: `hull-${index}`,
				label: `Hull ${index + 1} · G/U`,
				x: 9,
				y: (index - (c.hull - 1) / 2) * 10,
				angle: 0,
				part,
				group: "hull",
				index,
			}),
		),
		...build.aft.map(
			(part, index): BuildMount => ({
				key: `aft-${index}`,
				label: `Aft ${index + 1} · E/G/U`,
				x: -c.length * 0.6,
				y: (index - (c.aft - 1) / 2) * 12,
				angle: 0,
				part,
				group: "aft",
				index,
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
	engines = { left: 0, right: 0 },
) {
	const c = CHASSIS[build.chassis];
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(rotation);
	ctx.scale(scale, scale);
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
					: "#537079";
		ctx.fillStyle = "#071015";
		ctx.fillRect(-5, -4, 10, 8);
		ctx.strokeRect(-5, -4, 10, 8);
		if (mount.part === "rail" || mount.part === "laser") {
			ctx.fillRect(0, -2, mount.part === "rail" ? 18 : 10, 4);
			ctx.strokeRect(0, -2, mount.part === "rail" ? 18 : 10, 4);
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
			ctx.moveTo(-5, -3);
			ctx.lineTo(-8, -4);
			ctx.lineTo(-8, 4);
			ctx.lineTo(-5, 3);
			ctx.stroke();
			const firing =
				mount.key === "left"
					? engines.left
					: mount.key === "right"
						? engines.right
						: engines.left && engines.right
							? 1
							: 0;
			if (firing) {
				ctx.beginPath();
				ctx.moveTo(-8, -3);
				ctx.lineTo(-14 - firing * 8, 0);
				ctx.lineTo(-8, 3);
				ctx.stroke();
			}
		}
		if (mount.key === selected) {
			ctx.strokeStyle = "#ffffff";
			ctx.strokeRect(-10, -8, 23, 16);
		}
		ctx.restore();
	}
	ctx.restore();
}
