<script lang="ts">
import { buildMounts, defaultBuilds } from "@void-drift/mode-a";
import { FIGHTER } from "../../../../../packages/mode-a/src/lib/fighter";

let { label = "Engine surface playground" }: { label?: string } = $props();
type Engine = "light" | "heavy" | "fission" | "chambered";
type Point = readonly [number, number];
const mounts = buildMounts(defaultBuilds().balanced).filter(
	(m) => m.group !== "hull",
);
const names: Record<Engine, string> = {
	light: "Light ion",
	heavy: "Heavy ion",
	fission: "Fission",
	chambered: "Chambered",
};
let fitted = $state<Engine[]>(["light", "light", "light", "light"]);
let sideLayer = $state("above");
let aftLayer = $state("above");
let shape = $state("ridge");
let material = $state("charcoal");
let accent = $state("rails");
let accentColor = $state("#29baff");
let sun = $state(210);
let rotation = $state(0);
let size = $state(1);
let canvas: HTMLCanvasElement;
const palette: Record<string, readonly [number, number, number]> = {
	charcoal: [64, 68, 74],
	graphite: [94, 99, 105],
	steel: [66, 83, 99],
};
function reset() {
	fitted = ["light", "light", "light", "light"];
	sideLayer = aftLayer = "above";
	shape = "ridge";
	material = "charcoal";
	accent = "rails";
	accentColor = "#29baff";
	sun = 210;
	rotation = 0;
	size = 1;
}
function draw(ctx: CanvasRenderingContext2D) {
	ctx.clearRect(0, 0, 1000, 700);
	const lightAngle = (sun * Math.PI) / 180;
	const shipAngle = ((rotation - 90) * Math.PI) / 180;
	function shade(base: readonly number[], normalAngle: number, slope = 0.8) {
		const amount =
			0.42 +
			1.05 * Math.max(0, Math.cos(normalAngle - lightAngle) * slope + 0.25);
		return `rgb(${base.map((v) => Math.round(Math.min(255, v * amount))).join(",")})`;
	}
	function poly(vertices: readonly Point[], color: string) {
		ctx.beginPath();
		vertices.forEach(([x, y], i) => {
			if (i) ctx.lineTo(x, y);
			else ctx.moveTo(x, y);
		});
		ctx.closePath();
		ctx.fillStyle = color;
		ctx.fill();
	}
	function body(type: Engine, angle: number) {
		const length = type === "heavy" ? 11 : type === "fission" ? 7 : 9;
		const width = type === "heavy" ? 5 : type === "fission" ? 5.5 : 3.5;
		const base = palette[material];
		const outline: Point[] = [
			[length, 0],
			[length - 3, -width],
			[-length + 2, -width],
			[-length, -width * 0.65],
			[-length, width * 0.65],
			[-length + 2, width],
			[length - 3, width],
		];
		const spine: Point = [shape === "ridge" ? 1 : -2, 0];
		outline.forEach((p, i) => {
			const q = outline[(i + 1) % outline.length];
			const outward = Math.atan2((p[1] + q[1]) / 2, (p[0] + q[0]) / 2);
			poly(
				[spine, p, q],
				shade(base, angle + outward, shape === "ridge" ? 0.85 : 0.5),
			);
		});
		if (shape === "deck")
			poly(
				[
					[length - 3, -width * 0.35],
					[-length + 3, -width * 0.35],
					[-length + 3, width * 0.35],
					[length - 3, width * 0.35],
				],
				shade(base, angle, 0.15),
			);
		// A recessed outlet is body geometry, not an exhaust effect.
		poly(
			[
				[-length, -width * 0.65],
				[-length + 1, -width * 0.45],
				[-length + 1, width * 0.45],
				[-length, width * 0.65],
			],
			"#101318",
		);
		if (type === "chambered")
			poly(
				[
					[-1, -width],
					[1, -width],
					[1, width],
					[-1, width],
				],
				"#171b20",
			);
		if (type === "fission") {
			poly(
				[
					[3, -width],
					[4, -width],
					[4, width],
					[3, width],
				],
				shade(base, angle, 0.3),
			);
		}
		if (accent !== "none") {
			ctx.fillStyle = accentColor;
			if (accent === "rails") {
				ctx.fillRect(-length + 3, -width * 0.58, length, 0.55);
				ctx.fillRect(-length + 3, width * 0.58 - 0.55, length, 0.55);
			} else if (accent === "collar")
				ctx.fillRect(-length + 1, -width * 0.7, 1, width * 1.4);
			else
				poly(
					[
						[length - 3, 0],
						[1, -0.7],
						[-2, 0],
						[1, 0.7],
					],
					accentColor,
				);
		}
	}
	function engine(index: number) {
		const m = mounts[index];
		ctx.save();
		ctx.translate(m.x, m.y);
		ctx.rotate(m.angle);
		ctx.scale(size, size);
		body(fitted[index], shipAngle + m.angle);
		ctx.restore();
	}
	ctx.save();
	ctx.translate(340, 360);
	ctx.rotate(shipAngle);
	ctx.scale(5.4, 5.4);
	mounts.forEach((m, i) => {
		if ((m.group === "side" ? sideLayer : aftLayer) === "below") engine(i);
	});
	FIGHTER.hull.forEach((p, i) => {
		const q = FIGHTER.hull[(i + 1) % FIGHTER.hull.length];
		poly(
			[[-3, 0], p, q],
			shade(
				[105, 160, 177],
				shipAngle + Math.atan2((p[1] + q[1]) / 2, (p[0] + q[0]) / 2),
				0.85,
			),
		);
	});
	poly(FIGHTER.ridge, shade([130, 185, 195], shipAngle, 0.2));
	poly(FIGHTER.cockpit, "#030609");
	mounts.forEach((m, i) => {
		if ((m.group === "side" ? sideLayer : aftLayer) === "above") engine(i);
	});
	ctx.restore();
	// Same material and light model in the independent catalog inspection.
	ctx.save();
	ctx.translate(810, 300);
	ctx.rotate(shipAngle);
	ctx.scale(9, 9);
	body(fitted[0], shipAngle);
	ctx.restore();
	ctx.font = "18px system-ui";
	ctx.textAlign = "center";
	ctx.fillStyle = "#c4cbd1";
	ctx.fillText("Fighter · four fitted engines", 340, 625);
	ctx.fillText(`${names[fitted[0]]} · isolated`, 810, 460);
	const sx = 340 + Math.cos(lightAngle) * 285,
		sy = 350 + Math.sin(lightAngle) * 285;
	ctx.beginPath();
	ctx.arc(sx, sy, 10, 0, Math.PI * 2);
	ctx.fillStyle = "#eeff41";
	ctx.fill();
	ctx.font = "14px system-ui";
	ctx.fillText("SUN", sx, sy - 18);
}
$effect(() => {
	const ctx = canvas?.getContext("2d");
	if (ctx) draw(ctx);
});
</script>

<section class="playground" aria-label={label}>
	<div class="preview">
		<canvas
			bind:this={canvas}
			width="1000"
			height="700"
			aria-label="Faceted Fighter with four engines and an isolated engine, lit by the same movable sun"
		></canvas>
		<p>
			Light ion starting point · all four mounts occupied · left side engine
			enlarged at right
		</p>
	</div>
	<div class="controls">
		<fieldset>
			<legend>Engine bodies</legend>
			{#each mounts as mount, i}
				<label
					>{mount.group === "side"
						? i === 0
							? "Left side"
							: "Right side"
						: `Aft ${mount.index + 1}`}
					<select bind:value={fitted[i]}>
						{#each Object.entries(names) as [id, name]}
							<option value={id}>{name}</option>
						{/each}
					</select>
				</label>
			{/each}
			<button
				type="button"
				onclick={() => (fitted = ["light", "heavy", "fission", "chambered"])}
			>
				Try all four types
			</button>
		</fieldset>
		<fieldset>
			<legend>Surface and color</legend>
			<label
				>Faceting<select bind:value={shape}>
					<option value="ridge">Raised ridge</option>
					<option value="deck">Beveled flat deck</option>
				</select></label
			>
			<label
				>Body palette<select bind:value={material}>
					<option value="charcoal">Dark charcoal</option>
					<option value="graphite">Mid-tone graphite</option>
					<option value="steel">Cool blue-gray</option>
				</select></label
			>
			<label
				>Accent placement<select bind:value={accent}>
					<option value="rails">Twin rails</option>
					<option value="collar">Outlet collar</option>
					<option value="inset">Inset on spine</option>
					<option value="none">No accent</option>
				</select></label
			>
			<label>Accent color<input type="color" bind:value={accentColor}></label>
		</fieldset>
		<fieldset>
			<legend>Hull relationship</legend>
			<label
				>Side pair<select bind:value={sideLayer}>
					<option value="above">Above hull</option>
					<option value="below">Below hull</option>
				</select></label
			>
			<label
				>Aft pair<select bind:value={aftLayer}>
					<option value="above">Above hull</option>
					<option value="below">Below hull</option>
				</select></label
			>
			<label
				>Engine size · {size.toFixed(2)}×<input
					type="range"
					min="0.7"
					max="1.5"
					step="0.05"
					bind:value={size}
				></label
			>
		</fieldset>
		<fieldset>
			<legend>Shared light</legend>
			<label
				>Sun direction · {sun}°<input
					type="range"
					min="0"
					max="360"
					step="5"
					bind:value={sun}
				></label
			>
			<label
				>Ship rotation · {rotation}°<input
					type="range"
					min="-180"
					max="180"
					step="5"
					bind:value={rotation}
				></label
			>
		</fieldset>
		<button type="button" onclick={reset}>Reset to light ion</button>
	</div>
</section>

<style>
.playground {
	border: var(--flight-border);
	margin-block: var(--spacing-lg);
}
.preview {
	background: var(--color-void-light);
	padding: var(--spacing-md);
}
canvas {
	display: block;
	width: 100%;
	height: auto;
	max-height: 44vh;
	object-fit: contain;
}
.preview p {
	color: var(--color-text-dim);
	font-size: var(--font-small);
}
.controls {
	max-height: 40vh;
	overflow-y: auto;
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: var(--spacing-md);
	padding: var(--spacing-md);
}
fieldset {
	border: var(--flight-border);
	min-width: 0;
	padding: var(--spacing-md);
}
legend {
	color: var(--color-acid-lime);
}
label {
	display: grid;
	gap: var(--spacing-xs);
	margin-bottom: var(--spacing-sm);
}
select,
input,
button {
	min-height: var(--control-min-height);
	width: 100%;
	font: inherit;
}
select,
button {
	background: var(--color-void-light);
	color: var(--color-text);
	border: var(--flight-border);
	padding: var(--spacing-sm);
}
button {
	cursor: pointer;
}
:focus-visible {
	outline: 2px solid var(--color-acid-lime);
	outline-offset: 2px;
}
input {
	accent-color: var(--color-acid-lime);
}
@media (max-width: 620px) {
	.controls {
		max-height: 40vh;
		overflow-y: auto;
		grid-template-columns: 1fr;
	}
}
</style>
