<script lang="ts">
import { onMount } from "svelte";
import Logo from "../Logo.svelte";
import "./catalog.css";

// Colour roles from core tokens.css, rendered and measured in this browser.
let { label = "Colour roles" }: { label?: string } = $props();

const brandRoles = [
	{ token: "--color-brand", use: "The logomark and identity" },
	{ token: "--color-action", use: "What you can act on" },
	{ token: "--color-selected", use: "What is selected or installed" },
];
const surfaces = [
	{ token: "--color-void", name: "Void (page)" },
	{ token: "--color-elev-1", name: "Elevation 1" },
	{ token: "--color-elev-2", name: "Elevation 2" },
	{ token: "--color-elev-3", name: "Elevation 3" },
	{ token: "--color-glass", name: "Glass over void", over: "--color-void" },
];
const textRoles = [
	{ token: "--color-text", use: "Headings, values, body" },
	{ token: "--color-text-muted", use: "Eyebrows, tags, captions" },
	{ token: "--color-action", use: "Links and control labels" },
];
const borders = [
	{ token: "--color-border", use: "Panel and table edges" },
	{ token: "--color-border-subtle", use: "Dividers inside panels" },
	{ token: "--color-border-faint", use: "Lab stage grids" },
	{ token: "--color-grid", use: "Builder blueprint grid" },
];
const tints = [
	{ token: "--color-surface-hover", use: "Hover tint on any surface" },
	{ token: "--color-backdrop", use: "Scrim behind an overlay" },
];
const data = [
	"--color-resource-hull",
	"--color-resource-power",
	"--color-resource-warning",
	"--color-resource-danger",
	"--color-android-green",
	"--color-caution-tape",
	"--color-red",
];
const deprecated = [
	["--color-acid-lime", "--color-brand"],
	["--color-neon-blue", "--color-action"],
	["--color-text-dim", "--color-text-muted"],
	["--color-void-light", "--color-elev-1"],
	["--color-overlay", "--color-glass"],
	["--color-flight-glass", "--color-glass"],
	["--color-flight-trail", "--color-border-subtle"],
];

let values = $state<Record<string, string>>({});
let ratios = $state<Record<string, number>>({});

type Rgb = [number, number, number];
function luminance([r, g, b]: Rgb): number {
	const lin = (c: number) => {
		const v = c / 255;
		return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrast(a: Rgb, b: Rgb): number {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

onMount(() => {
	const style = getComputedStyle(document.documentElement);
	const read = (token: string) => style.getPropertyValue(token).trim();
	const all = [
		...brandRoles.map((r) => r.token),
		...surfaces.map((s) => s.token),
		...textRoles.map((r) => r.token),
		...borders.map((r) => r.token),
		...tints.map((r) => r.token),
		...data,
		"--color-on-brand",
	];
	values = Object.fromEntries(all.map((t) => [t, read(t)]));

	// Paint each layer the way the page composites it, then sample one pixel.
	const ctx = document.createElement("canvas").getContext("2d", {
		willReadFrequently: true,
	});
	if (!ctx) return;
	const paint = (...tokens: string[]): Rgb => {
		ctx.clearRect(0, 0, 1, 1);
		for (const token of tokens) {
			ctx.fillStyle = read(token);
			ctx.fillRect(0, 0, 1, 1);
		}
		const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
		return [r, g, b];
	};
	const next: Record<string, number> = {};
	for (const s of surfaces) {
		const base = s.over ? [s.over, s.token] : [s.token];
		const ground = paint(...base);
		for (const r of [...textRoles, ...borders])
			next[`${r.token}|${s.token}`] = contrast(paint(...base, r.token), ground);
	}
	next["--color-on-brand|--color-brand"] = contrast(
		paint("--color-brand", "--color-on-brand"),
		paint("--color-brand"),
	);
	ratios = next;
});

// Glass is translucent, so its cell shows it over the surface it covers.
const surfaceStyle = (s: { token: string; over?: string }) =>
	s.over
		? `background: linear-gradient(var(${s.token}), var(${s.token})), var(${s.over})`
		: `background: var(${s.token})`;
const rating = (ratio: number | undefined) =>
	ratio === undefined
		? ""
		: ratio >= 7
			? "AAA"
			: ratio >= 4.5
				? "AA"
				: ratio >= 3
					? "Large text"
					: "Decorative";
const fmt = (ratio: number | undefined) =>
	ratio === undefined ? "…" : `${ratio.toFixed(1)}:1`;
</script>

<section class="catalog" aria-label={label}>
	<section>
		<h2>Brand, action and selected</h2>
		<p>
			Lime is one colour with two jobs (D6). <code>--color-brand</code> holds
			it; <code>--color-action</code> and <code>--color-selected</code> alias
			it, so the logomark, what you can act on and what is selected always
			match. Informational text never uses it. Text on a lime fill uses
			<code>--color-on-brand</code>
			({fmt(ratios["--color-on-brand|--color-brand"])},
			{rating(ratios["--color-on-brand|--color-brand"])}).
		</p>
		<div class="roles">
			{#each brandRoles as r}
				<div class="role">
					<span class="swatch" style={`background: var(${r.token})`}></span>
					<code>{r.token}</code>
					<span class="muted">{values[r.token] ?? "…"}</span>
					<span class="muted">{r.use}</span>
				</div>
			{/each}
		</div>
		<div class="example uses">
			<span class="brand-mark"><Logo size="md" /></span>
			<button class="btn btn-filled" type="button">Action</button>
			<button class="btn btn-ghost" type="button">Action</button>
			<button class="btn btn-ghost" type="button" aria-pressed="true">
				Selected
			</button>
			<a href="/lab/surfaces">Surfaces page</a>
		</div>
	</section>

	<section>
		<h2>Text on each surface</h2>
		<p>
			Contrast is measured in this browser: each surface is painted, the text
			colour painted over it, and the pixels compared (WCAG 2.1). AA needs 4.5:1
			for body text and 3:1 for large text.
		</p>
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th scope="col">Role</th>
						{#each surfaces as s}
							<th scope="col">{s.name}<br><code>{s.token}</code></th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each textRoles as r}
						<tr>
							<th scope="row">
								<code>{r.token}</code><br><span class="muted">{r.use}</span>
							</th>
							{#each surfaces as s}
								{@const ratio = ratios[`${r.token}|${s.token}`]}
								<td class="cell" style={surfaceStyle(s)}>
									<span class="sample" style={`color: var(${r.token})`}
										>Aa 0.4.4</span
									>
									<span>{fmt(ratio)}</span>
									<span class="muted">{rating(ratio)}</span>
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section>
		<h2>Borders</h2>
		<p>
			Borders are white at fixed strengths, so one token reads on every surface.
			They separate areas rather than carry meaning, so they sit below the 3:1
			non-text minimum; controls get their edge from the action colour instead.
		</p>
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th scope="col">Role</th>
						{#each surfaces as s}
							<th scope="col">{s.name}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each borders as r}
						<tr>
							<th scope="row">
								<code>{r.token}</code><br><span class="muted">{r.use}</span>
							</th>
							{#each surfaces as s}
								{@const ratio = ratios[`${r.token}|${s.token}`]}
								<td class="cell" style={surfaceStyle(s)}>
									<span
										class="line"
										style={`border-top-color: var(${r.token})`}
									></span>
									<span>{fmt(ratio)}</span>
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section>
		<h2>Surfaces and scrim</h2>
		<p>
			The void is the page. The elevation steps from the
			<a href="/lab/surfaces">surfaces page</a>
			are the raised surfaces; glass is the void at 91% over the stage. Hover
			tints any surface, and the backdrop dims what an overlay covers.
		</p>
		<div class="roles">
			{#each [
				...surfaces.map((s) => ({ token: s.token, use: s.name })),
				...tints,
			] as r}
				<div class="role">
					<span
						class="swatch framed"
						style={`background: var(${r.token})`}
					></span>
					<code>{r.token}</code>
					<span class="muted">{values[r.token] ?? "…"}</span>
					<span class="muted">{r.use}</span>
				</div>
			{/each}
		</div>
	</section>

	<section>
		<h2>Game and status colours</h2>
		<p>
			Resource and status colours are data, not roles. Power still shares the
			brand lime until the resource meter (S8) gives it its own colour. Planets,
			stars and engines keep their own colours in the renderers.
		</p>
		<div class="roles">
			{#each data as token}
				<div class="role">
					<span class="swatch" style={`background: var(${token})`}></span>
					<code>{token}</code>
					<span class="muted">{values[token] ?? "…"}</span>
				</div>
			{/each}
		</div>
	</section>

	<section>
		<h2>Deprecated names</h2>
		<p>These alias a role until the last preserved study stops using them.</p>
		<ul>
			{#each deprecated as [old, role]}
				<li><code>{old}</code> → <code>{role}</code></li>
			{/each}
		</ul>
	</section>
</section>

<style>
.roles {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
	gap: var(--spacing-md);
}
.role {
	display: grid;
	gap: var(--spacing-xs);
	font-family: var(--font-family-ui);
	font-size: var(--font-size-label);
}
.swatch {
	height: 3rem;
}
.swatch.framed {
	border: 1px solid var(--color-border);
}
.muted {
	color: var(--color-text-muted);
}
.catalog .uses {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: var(--spacing-md);
}
.brand-mark {
	color: var(--color-brand);
}
.table-wrap {
	overflow-x: auto;
}
table {
	border-collapse: collapse;
	font-family: var(--font-family-ui);
	font-size: var(--font-size-label);
}
th,
td {
	padding: var(--spacing-sm) var(--spacing-md);
	text-align: left;
	vertical-align: top;
	border-bottom: 1px solid var(--color-border);
	font-weight: var(--font-weight-regular);
}
.cell {
	display: table-cell;
	min-width: 8rem;
}
.cell > span {
	display: block;
}
.sample {
	font-size: var(--font-size-body);
	margin-bottom: var(--spacing-xs);
}
.line {
	border-top: 2px solid;
	width: 4rem;
	margin-block: var(--spacing-sm);
}
</style>
