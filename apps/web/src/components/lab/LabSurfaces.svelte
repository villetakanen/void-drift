<script lang="ts">
import "./catalog.css";

// Reference for the elevation and display foundations (core tokens.css).
let { label = "Surfaces design system" }: { label?: string } = $props();

const steps = [
	{ token: "--color-elev-1", value: "lch(5.5% 10 290)", use: "Console" },
	{ token: "--color-elev-2", value: "lch(11% 15 290)", use: "Display" },
	{ token: "--color-elev-3", value: "lch(16.5% 20 290)", use: "Overlay pane" },
];
</script>

<section class="catalog" aria-label={label}>
	<section>
		<h2>Elevation</h2>
		<p>
			Three steps above the background (<code>--color-void</code>, lch 1.6% 4.9
			290). Each keeps the background's hue, 290, and raises lightness by 5.5
			and chroma by 5, so raised surfaces stay blue-violet rather than greying.
			<a href="/lab/studies/lab-instrument-2026-11-01#look">Study →</a>
		</p>
		<div class="steps">
			{#each steps as s, i}
				<div class="step" style={`background: var(${s.token}); --_i:${i}`}>
					<strong>{s.use}</strong>
					<code>{s.token}</code>
					<span>{s.value}</span>
				</div>
			{/each}
		</div>
	</section>

	<section>
		<h2>Instrument display</h2>
		<p>
			A display set into the console: elevation 2 with faint scanlines on the
			4px rhythm, a darkened edge, a thin dark bezel, and a black shadow beneath
			it (8px down, 24px blur, 70%).
		</p>
		<div class="example">
			<div class="display"></div>
			<p class="caption">
				<code>background: var(--surface-display)</code>
				·
				<code>box-shadow: var(--shadow-display)</code>
			</p>
		</div>
	</section>

	<section>
		<h2>Backdrop</h2>
		<p>
			Dims what an overlay covers: black at 11%, over everything outside the
			overlay.
		</p>
		<div class="example backdrop-demo">
			<div class="display small"></div>
			<div class="dim"></div>
			<p class="caption over">Right half: <code>--color-backdrop</code></p>
		</div>
	</section>
</section>

<style>
.steps {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
	background: var(--color-void);
	padding: var(--spacing-lg);
	gap: var(--spacing-lg);
}
.step {
	display: grid;
	gap: var(--spacing-xs);
	padding: var(--spacing-md);
	min-height: 8rem;
	align-content: end;
	font-family: var(--font-family-ui);
}
.step span {
	color: var(--color-text-dim);
}
.display {
	width: 448px;
	height: 256px;
	max-width: 100%;
	background: var(--surface-display);
	box-shadow: var(--shadow-display);
}
.display.small {
	width: 320px;
	height: 160px;
}
.backdrop-demo {
	position: relative;
	overflow: hidden;
}
.dim {
	position: absolute;
	inset: 0 0 0 50%;
	background: var(--color-backdrop);
}
.over {
	position: relative;
}
</style>
