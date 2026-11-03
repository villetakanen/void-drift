<script lang="ts">
import { paintIonBeam } from "@void-drift/core";
import { drawUtilityArtwork } from "@void-drift/mode-a";
import { onMount } from "svelte";

let { label = "Offset fold visibility" }: { label?: string } = $props();
let host: HTMLElement;
let enabled = $state(false);
let engines = $state(true);
let hue = $state(173);
let brightness = $state(250);
let time = 0;
let paint = () => {};
const variants = [
	{
		title: "E / Original fold, offset",
		note: "Original grain, palette, density and tumbling motion, translated downstream. Continuous playback replaces the timed envelope.",
	},
	{
		title: "J / Dispersed soft fold",
		note: "The same emission rate spread over a wider volume, with soft grain and a gradual fade into dark space.",
	},
];
const noise = (n: number) => {
	const v = Math.sin(n * 127.1 + 41.7) * 43758.5453;
	return v - Math.floor(v);
};
// Rotate the existing palette together, retaining its light/dark relationships.
function tint(rgb: string): string {
	const [r, g, b] = rgb.split(",").map((v) => Number(v) / 255);
	const hi = Math.max(r, g, b),
		lo = Math.min(r, g, b),
		d = hi - lo;
	const l = (hi + lo) / 2;
	const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
	const h =
		d === 0
			? 0
			: hi === r
				? ((g - b) / d) % 6
				: hi === g
					? (b - r) / d + 2
					: (r - g) / d + 4;
	return `${(h * 60 + hue - 273 + 720) % 360} ${sat * 100}% ${l * 100}%`;
}
onMount(() => {
	const fx = document.createElement("canvas");
	fx.width = 420;
	fx.height = 300;
	const light = fx.getContext("2d");
	paint = () => {
		if (!light) return;
		for (const [variant, canvas] of Array.from(
			host.querySelectorAll("canvas"),
		).entries()) {
			const ctx = canvas.getContext("2d");
			if (!ctx) continue;
			ctx.clearRect(0, 0, 420, 300);
			light.clearRect(0, 0, 420, 300);
			ctx.fillStyle = "#83c7d0";
			ctx.font = "12px sans-serif";
			ctx.fillText("FIELD ORIGIN ←     AWAY FROM ORIGIN →", 12, 20);
			ctx.fillText("4× fitted equipment", 12, 42);
			ctx.fillText("0.65× flight equipment", 12, 229);
			for (const scale of [1, 0.1625]) {
				const originX = scale === 1 ? 0 : 175;
				const originY = scale === 1 ? 45 : 240;
				ctx.save();
				ctx.translate(originX, originY);
				ctx.scale(scale, scale);
				ctx.translate(150, 80);
				drawUtilityArtwork(ctx, "gravity", 2);
				ctx.restore();
				light.save();
				light.translate(originX, originY);
				light.scale(scale, scale);
				light.globalCompositeOperation = "lighter";
				if (engines) {
					light.save();
					light.translate(170, 110);
					light.scale(3.5, 3.5);
					light.globalAlpha = 0.65;
					paintIonBeam(light, 1, "ion-light");
					light.restore();
				}
				if (enabled) {
					const rate = 200;
					const tick = Math.floor(time * rate);
					for (
						let i = Math.max(0, tick - Math.ceil(rate * 1.5));
						i <= tick;
						i++
					) {
						const age = time - i / rate;
						const lifetime = 0.7 + noise(i + 6) * 0.8;
						if (age < 0 || age >= lifetime) continue;
						const p = age / lifetime;
						const flicker = noise(i * 17 + Math.floor(time * 14));
						if (flicker < 0.23) continue;
						const angle =
							noise(i + 90) * Math.PI * 2 +
							age * (noise(i + 30) > 0.5 ? 2 : -2);
						const radius =
							(variant === 0 ? 12 : 24) +
							Math.sqrt(noise(i + 50)) *
								(variant === 0 ? 65 : 110) *
								Math.sin(p * Math.PI);
						const x = 210 + Math.cos(angle) * radius;
						const y =
							80 +
							Math.sin(angle) *
								radius *
								(0.45 + 0.3 * Math.sin(time + radius / 20));
						const edge = variant === 0 ? 1 : (1 - (radius / 150) ** 2) ** 2;
						light.globalAlpha =
							Math.sin(p * Math.PI) * (0.2 + flicker * 0.55) * edge;
						const color =
							i % 7 === 0
								? "238,219,255"
								: i % 3 === 0
									? "133,102,217"
									: "199,131,255";
						const size = i % 9 === 0 ? 3 : 1.5;
						if (variant === 0) {
							light.fillStyle = `rgb(${color})`;
							light.fillRect(Math.round(x), Math.round(y), size, size);
						} else {
							const glow = light.createRadialGradient(
								x,
								y,
								0,
								x,
								y,
								size * 2.5,
							);
							light.globalAlpha = Math.min(
								1,
								(light.globalAlpha * brightness) / 100,
							);
							const shade = tint(color);
							glow.addColorStop(0, `hsl(${shade} / 0.8)`);
							glow.addColorStop(0.25, `hsl(${shade} / 0.45)`);
							glow.addColorStop(1, `hsl(${shade} / 0)`);
							light.fillStyle = glow;
							light.fillRect(
								x - size * 2.5,
								y - size * 2.5,
								size * 5,
								size * 5,
							);
						}
					}
				}
				light.restore();
			}
			ctx.drawImage(fx, 0, 0);
		}
	};
	paint();
	let previous = performance.now();
	let frame = 0;
	const tick = (now: number) => {
		if (enabled) {
			time += Math.min((now - previous) / 1000, 0.1);
			paint();
		}
		previous = now;
		frame = requestAnimationFrame(tick);
	};
	frame = requestAnimationFrame(tick);
	return () => cancelAnimationFrame(frame);
});
$effect(() => {
	enabled;
	engines;
	hue;
	brightness;
	if (!enabled) time = 0;
	paint();
});
</script>
<div class="controls">
	<label><input type="checkbox" bind:checked={enabled}> Fold FX on</label>
	<label><input type="checkbox" bind:checked={engines}> Engine FX</label>
	<span>{enabled ? "Continuous conversion" : "Fold off"}</span>
</div>
<section class="variants" aria-label={label} bind:this={host}>
	{#each variants as variant, index}
		<figure>
			<figcaption>
				<strong>{variant.title}</strong>
				<p>{variant.note}</p>
			</figcaption>
			{#if index === 1}
				<div class="tuning">
					<label
						>Colour
						<input
							class="hue"
							type="range"
							min="0"
							max="360"
							step="1"
							bind:value={hue}
						>
						<output>{hue}°</output></label
					>
					<label
						>Top brightness
						<input
							type="range"
							min="0"
							max="300"
							step="5"
							bind:value={brightness}
						>
						<output>{brightness}%</output></label
					>
					<button
						type="button"
						onclick={() => {
							hue = 273;
							brightness = 100;
						}}
					>
						Reset J
					</button>
					<small
						>100% is J’s original brightness. Colour rotates the palette; the
						soft edge fade stays.</small
					>
				</div>
			{/if}
			<div class="view">
				<canvas width="420" height="300" aria-label={variant.title}></canvas>
			</div>
		</figure>
	{/each}
</section>
<style>
.controls {
	display: flex;
	flex-wrap: wrap;
	gap: 24px;
	margin-block: 24px;
}
label {
	display: flex;
	align-items: center;
	gap: 8px;
}
input:focus-visible {
	outline: 2px solid var(--color-action);
	outline-offset: 3px;
}
.variants {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(min(100%, 445px), 1fr));
	gap: 24px;
}
figure {
	min-width: 0;
	margin: 0;
	border: 1px solid var(--color-border);
	padding: 12px;
}
figcaption {
	min-height: 100px;
}
figcaption p,
.controls span {
	font-size: 14px;
	color: var(--color-text-muted);
}
.view {
	overflow-x: auto;
}
canvas {
	display: block;
	width: 420px;
	height: 300px;
	max-width: none;
	margin-inline: auto;
}
.tuning {
	display: grid;
	gap: 12px;
	margin-bottom: 16px;
}
.tuning label {
	display: grid;
	grid-template-columns: 105px minmax(70px, 1fr) 45px;
}
.tuning input {
	min-width: 0;
	width: 100%;
}
.tuning small {
	color: var(--color-text-muted);
}
.tuning button {
	justify-self: start;
	padding: 6px 12px;
	background: var(--color-void);
	color: var(--color-text);
	border: 1px solid var(--color-border);
	cursor: pointer;
}
.tuning button:focus-visible {
	outline: 2px solid var(--color-action);
	outline-offset: 3px;
}
</style>
