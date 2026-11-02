import { Vec2 } from "@void-drift/core";
import { CHASSIS, engineImpulse } from "@void-drift/mode-a";
import { z } from "astro/zod";
import { FIGHTER } from "../../../../../packages/mode-a/src/lib/fighter";
import {
	ceilingFor,
	ceilingVariants,
	DirectionalSettings,
} from "./ceiling-bench";
import { DT, type Sample, sequence, TOTAL_TICKS } from "./movement-bench";

export const RotationMode = z.enum([
	"free",
	"free-stabilized",
	"held",
	"held-stabilized",
]);
export const RotationSettings = DirectionalSettings.extend({
	rotationMode: RotationMode.default("free"),
	mainStrength: z.number().positive().default(1),
	stabilizerStrength: z.number().nonnegative().max(1).default(0.25),
	brakeOnLR: z.boolean().default(false),
	maxTurn: z.number().finite().min(5).max(720).default(120),
	stabilizerBack: z.number().finite().min(0).max(100).default(85),
	stabilizerInset: z.number().finite().min(0).max(50).default(15),
	stabilizerAngle: z
		.number()
		.finite()
		.min(-180)
		.max(180)
		.default((Math.atan2(14.05, 14) * 180) / Math.PI),
});
export const rotationModes = [
	{ value: "free", label: "Free fall rotation" },
	{ value: "free-stabilized", label: "Free fall + 0.25-strength stabilizers" },
	{ value: "held", label: "No free fall" },
	{ value: "held-stabilized", label: "No free fall + stabilizers" },
] as const;
const nose = Math.max(...FIGHTER.hull.map((p) => p[0]));
const stern = Math.min(...FIGHTER.hull.map((p) => p[0]));
const halfWidth = Math.max(...FIGHTER.hull.map((p) => Math.abs(p[1])));
const length = nose - stern;
const width = halfWidth * 2;
// Uniform rectangle about the existing ship origin: explicit study inertia proxy.
export const ROTATION_GEOMETRY = {
	inertiaPerMass: (length ** 2 + width ** 2) / 12 + ((nose + stern) / 2) ** 2,
	stabilizerX: nose - 0.85 * length,
	stabilizerY: width * 0.35,
};
export function stabilizerGeometry(
	back: number,
	inset: number,
	degrees: number,
) {
	const x = nose - (back / 100) * length;
	const y = width * (0.5 - inset / 100);
	const angle = (degrees * Math.PI) / 180;
	// Angle describes outward exhaust; thrust is opposite, toward the hull.
	const fx = -Math.cos(angle),
		fy = Math.sin(angle);
	return { x, y, fx, fy, lever: x * fy + y * fx, hull: FIGHTER.hull };
}
export const stabilizerVariants = [
	{ label: "Free fall · no stabilizers", color: "#5ce5e7" },
	{ label: "Free fall · stabilizers", color: "#ffbd69" },
];
export const StabilizerSettings = RotationSettings.extend({
	fixture: z.enum(["side", "all", "aft"]).default("side"),
});
export function simulateStabilizers(raw: unknown): Sample[][] {
	const settings = StabilizerSettings.parse(raw);
	const index =
		settings.fixture === "side" ? 2 : settings.fixture === "all" ? 3 : 1;
	return ["free", "free-stabilized"].map(
		(rotationMode) => simulateRotation({ ...settings, rotationMode })[index],
	);
}
export function simulateRotation(raw: unknown): Sample[][] {
	const settings = RotationSettings.parse(raw);
	const { acceleration, maxSpeed, bonus, falloff, maxTurn, rotationMode } =
		settings;
	const free = rotationMode.startsWith("free");
	const stabilized = rotationMode.endsWith("stabilized");
	const limitSpin = (maxTurn * Math.PI) / 180;
	const chassis = CHASSIS.fighter;
	const angle = (chassis.angle * Math.PI) / 180;
	const mainLever =
		Math.cos(angle) * chassis.arm + Math.sin(angle) * chassis.sideX;
	const { inertiaPerMass } = ROTATION_GEOMETRY;
	const mount = stabilizerGeometry(
		settings.stabilizerBack,
		settings.stabilizerInset,
		settings.stabilizerAngle,
	);
	const stabilizerLever = Math.abs(mount.lever);
	return ceilingVariants.map((variant, index) => {
		const artificial = index === 4;
		const ship = {
			pos: new Vec2(0, 0),
			vel: new Vec2(0, 0),
			acc: new Vec2(0, 0),
			rotation: 0,
			radius: 1,
		};
		let emissions = [0, 0, 0, 0, 0, 0];
		let spin = 0,
			distance = 0;
		function forces(tick: number) {
			const { left, right } = sequence(Math.min(tick, TOTAL_TICKS - 1));
			const command = Number(left) - Number(right);
			const l = Number(variant.sides && left) * settings.mainStrength,
				r = Number(variant.sides && right) * settings.mainStrength;
			let x =
				(l + r) * Math.cos(angle) +
				(left && right ? variant.aft * settings.mainStrength : 0);
			let y = (l - r) * Math.sin(angle);
			let torque = (l - r) * mainLever;
			let output = 0;
			let stabilizerSide = 0;
			const braking =
				stabilized &&
				free &&
				(settings.brakeOnLR ? command === 0 : !left && !right) &&
				spin !== 0 &&
				stabilizerLever > 1e-9;
			const assist = stabilized && command !== 0;
			if ((assist || braking) && stabilizerLever > 1e-9) {
				const direction = braking ? -Math.sign(spin) : command;
				stabilizerSide = -direction * Math.sign(mount.lever);
				// Select the mirrored nozzle whose actual force produces the requested torque.
				output = braking
					? Math.min(
							settings.stabilizerStrength,
							(Math.abs(spin) * inertiaPerMass) /
								(acceleration * stabilizerLever * (DT / 4)),
						)
					: settings.stabilizerStrength;
				x += output * mount.fx;
				y += output * direction * Math.sign(mount.lever) * mount.fy;
				torque += direction * output * stabilizerLever;
			}
			return {
				x,
				y,
				torque,
				output,
				braking,
				command,
				left,
				right,
				stabilizerSide,
			};
		}
		const samples: Sample[] = [];
		function record(tick: number) {
			const f = forces(tick);
			samples.push({
				x: ship.pos.x,
				vx: ship.vel.x,
				vy: ship.vel.y,
				emissions: [...emissions],
				y: ship.pos.y,
				heading: ship.rotation,
				speed: ship.vel.mag(),
				distance,
				spin: (spin * 180) / Math.PI,
				stabilizer: artificial ? 0 : f.output,
				...(artificial
					? {}
					: {
							ceiling: ceilingFor(
								Math.hypot(f.x, f.y),
								maxSpeed,
								bonus,
								falloff,
							),
						}),
			});
		}
		record(0);
		for (let tick = 0; tick < TOTAL_TICKS; tick++) {
			emissions = [0, 0, 0, 0, 0, 0];
			for (let sub = 0; sub < 4; sub++) {
				const dt = DT / 4;
				const f = forces(tick);
				if (artificial) {
					spin = f.command * limitSpin * 0.5;
					ship.rotation += spin * dt;
					if (f.left || f.right) {
						const speed =
							0.5 * ceilingFor(2 * Math.cos(angle), maxSpeed, bonus, falloff);
						ship.vel.x = Math.cos(ship.rotation) * speed;
						ship.vel.y = Math.sin(ship.rotation) * speed;
					}
				} else {
					if (!free && f.command === 0) spin = 0;
					else {
						const previous = spin;
						spin = Math.max(
							-limitSpin,
							Math.min(
								limitSpin,
								spin + ((acceleration * f.torque) / inertiaPerMass) * dt,
							),
						);
						if (
							f.braking &&
							(Math.sign(previous) !== Math.sign(spin) ||
								Math.abs(spin) < 1e-10)
						)
							spin = 0;
					}
					ship.rotation += spin * dt;
					const strength = Math.hypot(f.x, f.y);
					let delivered = 0;
					if (strength > 0)
						delivered = engineImpulse(
							ship,
							ship.rotation + Math.atan2(f.y, f.x),
							acceleration * strength,
							ceilingFor(strength, maxSpeed, bonus, falloff),
							dt,
						);

					emissions[0] += (Number(variant.sides && f.left) * delivered) / 4;
					emissions[1] += (Number(variant.sides && f.right) * delivered) / 4;
					emissions[2] +=
						(Number(f.left && f.right && variant.aft > 0) * delivered) / 4;
					emissions[3] +=
						(Number(f.left && f.right && variant.aft > 1) * delivered) / 4;
					if (f.stabilizerSide)
						emissions[f.stabilizerSide === -1 ? 4 : 5] +=
							(f.output * delivered) / 4;
				}
				ship.pos.x += ship.vel.x * dt;
				ship.pos.y += ship.vel.y * dt;
				distance += ship.vel.mag() * dt;
			}
			record(tick + 1);
		}
		return samples;
	});
}
