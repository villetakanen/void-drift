<script lang="ts">
// Explicit Astro hydration attributes avoid the empty-props integration mismatch.
let _props: { slot?: string; "client:only"?: string; "client:load"?: boolean } =
	$props();

import { canvasFont, FONT_FAMILY_UI } from "@void-drift/core";
import { onMount } from "svelte";
import Canvas from "../Canvas.svelte";

const ROLES = [
	{
		role: "ui",
		token: "--font-family-ui",
		face: "B612 Mono",
		use: "All game and interface text",
		sample: "HULL 100  POWER 74  T+01:23.4  0O 1lI",
		class: "role-ui",
	},
	{
		role: "prose",
		token: "--font-family-prose",
		face: "Noto Sans",
		use: "Studies, help and docs",
		sample:
			"Gravity pulls every ship toward the star; thrust only bends the fall.",
		class: "role-prose",
	},
	{
		role: "display",
		token: "--font-family-display",
		face: "Noto Sans 800",
		use: "Headlines",
		sample: "Dance with gravity.",
		class: "role-display",
	},
] as const;

const SIZES = ["caption", "label", "body", "lead", "heading", "display"];
const LINE_HEIGHTS = ["display", "heading", "ui", "prose"];
const TRACKING = ["eyebrow", "display"];
const FACES = [
	'400 16px "B612 Mono"',
	'italic 400 16px "B612 Mono"',
	'700 16px "B612 Mono"',
	'italic 700 16px "B612 Mono"',
	'400 16px "Noto Sans"',
	'800 16px "Noto Sans"',
];

let faceStatus = $state<Record<string, boolean>>({});
let computed = $state<Record<string, string>>({});
let probe: HTMLElement;

onMount(() => {
	const style = getComputedStyle(probe);
	const values: Record<string, string> = {};
	for (const name of [
		...SIZES.map((s) => `--font-size-${s}`),
		...LINE_HEIGHTS.map((s) => `--line-height-${s}`),
		...TRACKING.map((s) => `--tracking-${s}`),
		"--font-family-ui",
		"--font-family-prose",
		"--font-family-display",
	])
		values[name] = style.getPropertyValue(name).trim();
	computed = values;
	Promise.all(
		FACES.map(async (face) => {
			await document.fonts.load(face);
			return [face, document.fonts.check(face)] as const;
		}),
	).then((entries) => {
		faceStatus = Object.fromEntries(entries);
	});
});

function drawCanvasSample(ctx: CanvasRenderingContext2D) {
	ctx.fillStyle = getComputedStyle(document.documentElement)
		.getPropertyValue("--color-text")
		.trim();
	ctx.textBaseline = "top";
	ctx.font = canvasFont(11);
	ctx.fillText("canvasFont(11)  SLOT 01  ENGINE", 12, 12);
	ctx.font = canvasFont(32, 700);
	ctx.fillText("E W Q +", 12, 36);
	ctx.font = canvasFont(8);
	ctx.fillText("canvasFont(8)  ION · HEAVY ION", 12, 82);
}
</script>

<div class="typography" bind:this={probe}>
	<section>
		<h2 class="section-title">Roles</h2>
		<p class="note">
			Rendered with the production tokens from
			<code>core/styles/tokens.css</code>. Faces are self-hosted woff2 files
			(SIL OFL 1.1).
		</p>
		<div class="roles">
			{#each ROLES as item}
				<article class="role">
					<header>
						<strong>{item.role}</strong>
						<span>{item.face} · {item.use}</span>
					</header>
					<p class={item.class}>{item.sample}</p>
					<code>{item.token}: {computed[item.token]}</code>
				</article>
			{/each}
			<article class="role">
				<header>
					<strong>logotype</strong>
					<span>Noto Sans Math · ∅·Δ only</span>
				</header>
				<p class="note">
					Shipped as SVG outlines (opening-screen S2); the font itself is never
					served.
				</p>
			</article>
		</div>
	</section>

	<section>
		<h2 class="section-title">Loaded faces</h2>
		<ul class="faces">
			{#each FACES as face}
				<li>
					<span
						class:ok={faceStatus[face]}
						class:missing={faceStatus[face] === false}
					>
						{faceStatus[face] === undefined
							? "…"
							: faceStatus[face]
								? "loaded"
								: "missing"}
					</span>
					<code>{face}</code>
				</li>
			{/each}
		</ul>
	</section>

	<section>
		<h2 class="section-title">Size steps</h2>
		<table>
			<thead>
				<tr>
					<th>Token</th>
					<th>Value</th>
					<th>ui</th>
					<th>prose</th>
				</tr>
			</thead>
			<tbody>
				{#each SIZES as size}
					<tr>
						<td><code>--font-size-{size}</code></td>
						<td><code>{computed[`--font-size-${size}`]}</code></td>
						<td class="role-ui" style:font-size="var(--font-size-{size})">
							Drift 0123
						</td>
						<td class="role-prose" style:font-size="var(--font-size-{size})">
							Drift 0123
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>

	<section>
		<h2 class="section-title">Line height and tracking</h2>
		<div class="pairs">
			{#each LINE_HEIGHTS as lh}
				<div class="pair">
					<code>--line-height-{lh}: {computed[`--line-height-${lh}`]}</code>
					<p
						class={lh === "ui" ? "role-ui" : "role-prose"}
						style:line-height="var(--line-height-{lh})"
					>
						Two lines of sample text wrap here so the leading between them is
						visible at this measure.
					</p>
				</div>
			{/each}
			{#each TRACKING as tr}
				<div class="pair">
					<code>--tracking-{tr}: {computed[`--tracking-${tr}`]}</code>
					<p
						class={tr === "display" ? "role-display" : "role-ui"}
						style:letter-spacing="var(--tracking-{tr})"
					>
						{tr === "display" ? "Dance with gravity." : "SURVIVAL / 0.4.4"}
					</p>
				</div>
			{/each}
		</div>
	</section>

	<section>
		<h2 class="section-title">.prose</h2>
		<div class="prose prose-sample">
			<h1>Study headline</h1>
			<p class="lead">
				A lead paragraph introduces the question in the prose role at the lead
				size.
			</p>
			<section>
				<h2>Section heading</h2>
				<p>
					Body paragraphs keep a 70ch measure and generous leading so long
					explanations stay readable. Links such as
					<a href="/lab/studies">design studies</a>
					use the link colour.
				</p>
				<ul>
					<li>List items share the prose line height.</li>
					<li>Local component styles still win over these defaults.</li>
				</ul>
			</section>
		</div>
	</section>

	<section>
		<h2 class="section-title">Canvas</h2>
		<p class="note">
			<code>canvasFont(size, weight)</code>
			mirrors
			<code>{FONT_FAMILY_UI}</code>.
		</p>
		<Canvas width={420} height={100} draw={drawCanvasSample} />
	</section>
</div>

<style>
.typography {
	padding: var(--spacing-lg);
	display: grid;
	gap: var(--spacing-lg);
	color: var(--color-text);
}

.section-title {
	font-size: var(--font-size-caption);
	letter-spacing: var(--tracking-eyebrow);
	text-transform: uppercase;
	color: var(--color-text-dim);
	border-bottom: var(--flight-border);
	padding-bottom: var(--spacing-sm);
	margin-bottom: var(--spacing-md);
}

.note {
	color: var(--color-text-dim);
	font-size: var(--font-size-caption);
	margin-bottom: var(--spacing-md);
}

code {
	font-family: var(--font-family-ui);
	font-size: var(--font-size-caption);
	color: var(--color-text-dim);
	overflow-wrap: anywhere;
}

.role-ui {
	font-family: var(--font-family-ui);
	font-size: var(--font-size-body);
}

.role-prose {
	font-family: var(--font-family-prose);
	font-size: var(--font-size-body);
	line-height: var(--line-height-prose);
}

.role-display {
	font-family: var(--font-family-display);
	font-weight: var(--font-weight-display);
	font-size: var(--font-size-display);
	line-height: var(--line-height-display);
	letter-spacing: var(--tracking-display);
}

.roles {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
	gap: var(--spacing-md);
}

.role {
	border: var(--flight-border);
	padding: var(--spacing-md);
	display: grid;
	gap: var(--spacing-sm);
	align-content: start;
}

.role header {
	display: grid;
	gap: var(--spacing-xs);
}

.role header strong {
	color: var(--color-acid-lime);
}

.role header span {
	font-size: var(--font-size-caption);
	color: var(--color-text-dim);
}

.faces {
	list-style: none;
	padding: 0;
	display: grid;
	gap: var(--spacing-xs);
}

.faces li {
	display: flex;
	gap: var(--spacing-md);
	align-items: baseline;
}

.status {
	min-width: 8ch;
	font-size: var(--font-size-caption);
}

.status.ok {
	color: var(--color-android-green);
}

.status.missing {
	color: var(--color-red);
}

table {
	border-collapse: collapse;
	width: 100%;
}

th,
td {
	text-align: left;
	padding: var(--spacing-sm);
	border-bottom: var(--flight-border);
	vertical-align: baseline;
}

th {
	font-size: var(--font-size-caption);
	color: var(--color-text-dim);
	font-weight: var(--font-weight-regular);
}

.pairs {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
	gap: var(--spacing-md);
}

.pair {
	display: grid;
	gap: var(--spacing-sm);
	align-content: start;
}

.pair p {
	max-width: 32ch;
}

.prose-sample {
	border: var(--flight-border);
	padding: var(--spacing-lg);
}
</style>
