<script lang="ts">
import { TOTAL_TICKS } from "./movement-bench";
import PathInstrument from "./PathInstrument.svelte";
import PathView from "./PathView.svelte";
import { speedCeilingStudy, thrustStudy } from "./path-fixtures";
import { derive, PathSeries } from "./path-instrument";

// The instrument is one fixed screen, laptop-shaped (16:10) and larger than an
// iPad Pro 11" landscape. The host container only decides how far it is scaled.
const SCREEN_W = 1440;
const SCREEN_H = 900;
const studies = [
	{ id: "thrust", name: "Study A · varies thrust", series: thrustStudy },
	{
		id: "ceiling",
		name: "Study B · varies speed ceiling",
		series: speedCeilingStudy,
	},
];

let studyId = $state("ceiling");
let tick = $state(0);
let hostWidth = $state(SCREEN_W);
let paneOpen = $state(false);

const series = $derived(
	(studies.find((s) => s.id === studyId) ?? studies[0]).series,
);
const measured = $derived(series.map((s) => derive(PathSeries.parse(s))));
const scale = $derived(hostWidth / SCREEN_W);
const seconds = $derived(tick / 60);
function move(delta: number) {
	tick = Math.max(0, Math.min(TOTAL_TICKS, tick + delta));
}
</script>

<div
	class="host"
	bind:clientWidth={hostWidth}
	style={`aspect-ratio:${SCREEN_W}/${SCREEN_H}`}
>
	<div
		class="screen"
		style={`width:${SCREEN_W}px;height:${SCREEN_H}px;transform:scale(${scale})`}
	>
		<header class="bar">
			<strong>Path instrument</strong>
			<button
				type="button"
				aria-expanded={paneOpen}
				aria-controls="instrument-pane"
				onclick={() => (paneOpen = !paneOpen)}
			>
				{paneOpen ? "Hide controls" : "Controls"}
			</button>
		</header>
		<div class="stage">
			<PathView {series} label="Paths with a time marker" {tick}>
				<label class="timeline">
					Time: {seconds.toFixed(2)} s
					<input
						type="range"
						min="0"
						max={TOTAL_TICKS}
						step="1"
						bind:value={tick}
						aria-valuetext={`${seconds.toFixed(2)} seconds`}
					>
				</label>
				<div class="steps">
					<button type="button" onclick={() => move(-6)}>−0.1 s</button>
					<button type="button" onclick={() => move(-1)}>−0.01 s</button>
					<button type="button" onclick={() => move(1)}>+0.01 s</button>
					<button type="button" onclick={() => move(6)}>+0.1 s</button>
				</div>
			</PathView>
			<PathInstrument
				{series}
				scale="fixed"
				part="traces"
				legend={false}
				{tick}
				label="Speed, acceleration and turn acceleration with a time cursor"
			/>
		</div>
		<aside
			id="instrument-pane"
			class="pane"
			class:open={paneOpen}
			inert={!paneOpen}
			aria-label="Controls"
		>
			<h3>Controls</h3>
			<fieldset>
				<legend>Study</legend>
				{#each studies as study}
					<label class="choice">
						<input
							type="radio"
							name="study"
							value={study.id}
							bind:group={studyId}
						>
						{study.name}
					</label>
				{/each}
			</fieldset>
			<table>
				<caption>
					Values at {seconds.toFixed(2)} s
				</caption>
				<thead>
					<tr>
						<th>Vehicle</th>
						<th>u/s</th>
						<th>u/s²</th>
						<th>°/s²</th>
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
			<p class="note">Columns: speed, acceleration, turn acceleration.</p>
		</aside>
	</div>
</div>

<style>
.host {
	width: 100%;
	overflow: hidden;
	border: var(--flight-border);
	background: var(--color-void);
	scroll-snap-align: center;
	scroll-margin-top: var(--spacing-md);
}
.screen {
	position: relative;
	box-sizing: border-box;
	overflow: hidden;
	transform-origin: top left;
	font-size: 0.875rem;
}
.bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 48px;
	padding-inline: var(--spacing-lg);
	border-bottom: var(--flight-border);
}
.stage {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: var(--spacing-lg);
	align-items: start;
	padding: var(--spacing-md) var(--spacing-lg);
}
.pane {
	position: absolute;
	inset-block: 48px 0;
	right: 0;
	width: 360px;
	box-sizing: border-box;
	overflow: auto;
	padding: var(--spacing-md);
	background: var(--color-void-light);
	border-left: var(--flight-border);
	box-shadow: -12px 0 24px #000a;
	transform: translateX(100%);
	visibility: hidden;
	transition:
		transform 0.18s ease,
		visibility 0.18s;
}
.pane.open {
	transform: none;
	visibility: visible;
}
h3 {
	margin: 0 0 var(--spacing-md);
	font-size: 1rem;
}
fieldset {
	margin: 0 0 var(--spacing-md);
	padding: 0;
	border: 0;
}
legend {
	padding: 0;
	color: var(--color-text-dim);
	font: var(--font-small) var(--font-flight);
}
.choice {
	display: flex;
	align-items: center;
	gap: var(--spacing-sm);
	min-height: 44px;
}
button {
	padding: var(--spacing-xs) var(--spacing-md);
	min-height: 32px;
	background: transparent;
	color: var(--color-text);
	border: 1px solid var(--color-text-dim);
	font: var(--font-small) var(--font-flight);
	cursor: pointer;
}
button:focus-visible,
input:focus-visible {
	outline: 2px solid var(--color-focus-ring);
	outline-offset: 2px;
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
}
table {
	width: 100%;
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
	padding: var(--spacing-xs);
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
.note {
	color: var(--color-text-dim);
	font: var(--font-small) var(--font-flight);
}
</style>
