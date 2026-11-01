<script lang="ts">
import { TOTAL_TICKS } from "./movement-bench";
import PathInstrument from "./PathInstrument.svelte";
import PathView from "./PathView.svelte";
import { speedCeilingStudy } from "./path-fixtures";
import { derive, PathSeries } from "./path-instrument";

let { label = "Study B paths with a time marker" }: { label?: string } =
	$props();
const series = speedCeilingStudy;
const FINE = 1,
	STEP = 6; // one tick is 1/60 s; six ticks are 0.1 s
let tick = $state(0);
const seconds = $derived(tick / 60);
const measured = $derived(series.map((s) => derive(PathSeries.parse(s))));
function move(delta: number) {
	tick = Math.max(0, Math.min(TOTAL_TICKS, tick + delta));
}
</script>

<div class="layout">
	<PathView {series} {label} {tick}>
		<label class="timeline">
			Time: {seconds.toFixed(2)} s
			<input
				type="range"
				min="0"
				max={TOTAL_TICKS}
				step={FINE}
				bind:value={tick}
				aria-valuetext={`${seconds.toFixed(2)} seconds`}
			>
		</label>
		<div class="steps">
			<button type="button" onclick={() => move(-STEP)}>−0.1 s</button>
			<button type="button" onclick={() => move(-FINE)}>−0.01 s</button>
			<button type="button" onclick={() => move(FINE)}>+0.01 s</button>
			<button type="button" onclick={() => move(STEP)}>+0.1 s</button>
			<button type="button" onclick={() => (tick = 0)}>Start</button>
		</div>
	</PathView>
	<div>
		<PathInstrument
			{series}
			scale="fixed"
			part="traces"
			legend={false}
			{tick}
			label="Study B speed, acceleration and turn acceleration with a time cursor"
		/>
		<table>
			<caption>
				Values at {seconds.toFixed(2)} s
			</caption>
			<thead>
				<tr>
					<th>Vehicle</th>
					<th>Speed u/s</th>
					<th>Accel u/s²</th>
					<th>Turn °/s²</th>
				</tr>
			</thead>
			<tbody>
				{#each measured as d}
					<tr>
						<th scope="row">
							<i style={`background:${d.color}`}></i>{d.label}
						</th>
						<td>{d.traces.speed[tick].toFixed(0)}</td>
						<td>{d.traces.acceleration[tick].toFixed(0)}</td>
						<td>{d.traces.turn[tick].toFixed(0)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
.layout {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
	gap: var(--spacing-lg);
	align-items: start;
}
.timeline {
	display: grid;
	gap: var(--spacing-sm);
	margin-top: var(--spacing-md);
	font: var(--font-small) var(--font-flight);
	color: var(--color-acid-lime);
}
.timeline input {
	width: 100%;
	min-height: 44px;
	accent-color: var(--color-acid-lime);
}
.steps {
	display: flex;
	flex-wrap: wrap;
	gap: var(--spacing-xs);
	margin-top: var(--spacing-sm);
}
.steps button {
	padding: var(--spacing-xs) var(--spacing-sm);
	background: transparent;
	color: var(--color-text);
	border: 1px solid var(--color-text-dim);
	font: var(--font-small) var(--font-flight);
	cursor: pointer;
}
.steps button:focus-visible,
.timeline input:focus-visible {
	outline: 2px solid var(--color-focus-ring);
	outline-offset: 2px;
}
table {
	width: 100%;
	margin-top: var(--spacing-md);
	border-collapse: collapse;
	font: var(--font-small) var(--font-flight);
}
caption {
	text-align: left;
	color: var(--color-text-dim);
	padding-bottom: var(--spacing-xs);
}
th,
td {
	padding: var(--spacing-xs) var(--spacing-sm);
	text-align: right;
	border-bottom: 1px solid var(--color-flight-trail);
}
th:first-child {
	text-align: left;
}
tbody th {
	font-weight: normal;
}
tbody i {
	display: inline-block;
	width: 12px;
	height: 3px;
	margin-right: var(--spacing-xs);
	vertical-align: middle;
}
</style>
