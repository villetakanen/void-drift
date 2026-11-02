<script lang="ts">
type SizingRuleId =
	| "proportional"
	| "clamped-thumb"
	| "device-tiered"
	| "custom";

interface DeviceScreen {
	id: string;
	name: string;
	sub: string;
	width: number;
	height: number;
	headerHeight: number;
}

interface FlapMetrics {
	outerWidth: number;
	innerWidth: number;
	totalHeight: number;
	fHeight: number;
	lExposedEdge: number;
	bevelDropOuter: number;
	bevelDropInner: number;
	stageWidth: number;
	stageHeight: number;
	stageOffsetX: number;
	stageOffsetY: number;
	safeMarginPx: number;
	marginClearancePx: number;
}

let {
	label = "Touch-zone sizing comparison across screen sizes",
}: {
	label?: string;
} = $props();

const DEVICES: DeviceScreen[] = [
	{
		id: "phone-wide",
		name: "Phone Landscape (19.5:9)",
		sub: "852 × 393 CSS px (iPhone 15/16)",
		width: 852,
		height: 393,
		headerHeight: 44,
	},
	{
		id: "phone-16-9",
		name: "Phone Landscape (16:9)",
		sub: "667 × 375 CSS px (Compact Android / SE)",
		width: 667,
		height: 375,
		headerHeight: 44,
	},
	{
		id: "ipad-4-3",
		name: "iPad Landscape (4:3)",
		sub: "1024 × 768 CSS px (iPad Air / Pro 11”)",
		width: 1024,
		height: 768,
		headerHeight: 64,
	},
	{
		id: "desktop",
		name: "Desktop (16:10 / 16:9)",
		sub: "1440 × 900 CSS px (Laptop / Monitor)",
		width: 1440,
		height: 900,
		headerHeight: 64,
	},
];

const RULES: {
	id: SizingRuleId;
	label: string;
	summary: string;
	formula: string;
}[] = [
	{
		id: "proportional",
		label: "A · Viewport-proportional (% of stage)",
		summary:
			"Direct scale of the concept draft: width is 11.5% of viewport width and total stack height is 52% of stage height on every screen.",
		formula: "W = 11.5vw · H_total = 52% stageH · H_F = 30% stageH",
	},
	{
		id: "clamped-thumb",
		label: "B · Clamped physical thumb zone (clamp)",
		summary:
			"Sized to physical thumb reach: spans ~54% of stage height on phones, and clamps at 132 × 260 px on iPad and Desktop so pads stay thumb-sized in the lower margin.",
		formula:
			"W = clamp(92px, 12vw, 132px) · H_total = clamp(184px, 54% stageH, 260px)",
	},
	{
		id: "device-tiered",
		label: "C · Full safe margin on touch + compact Desktop",
		summary:
			"Uses generous thumb zones on Phone (108px × 56% H) and iPad (136px × 38% H), and steps down to a compact 96 × 190 px margin indicator on Desktop.",
		formula:
			"Touch: W 108–136px, H 190–270px · Desktop (hover: hover): W 96px, H 190px",
	},
	{
		id: "custom",
		label: "Custom tuner",
		summary:
			"Adjust width, stack height, F-to-L split, and inner F inset directly to inspect exact pixel coverage against the camera's ship-free margin.",
		formula: "Interactive manual parameters below",
	},
];

let rule = $state<SizingRuleId>("clamped-thumb");
let showArenaBounds = $state(true);
let activePreviewCmd = $state<"NONE" | "L" | "F" | "R">("NONE");

// Custom tuner sliders (also updated when picking a preset to show its baseline)
let customWidthVw = $state(12);
let customMaxWidthPx = $state(132);
let customHeightPct = $state(54);
let customMaxHeightPx = $state(260);
let fHeightRatio = $state(0.58);
let fWidthRatio = $state(0.88);

// 60° from vertical screen edge = 30° from horizontal: tan(30°) = 1 / sqrt(3) ≈ 0.57735
const TAN_30 = Math.tan(Math.PI / 6);

function computeMetrics(
	device: DeviceScreen,
	currentRule: SizingRuleId,
): FlapMetrics {
	const stageAreaW = device.width;
	const stageAreaH = device.height - device.headerHeight;

	// Flight stage canvas is 1920x1080 with object-fit: contain inside .flight-stage
	const stageScale = Math.min(stageAreaW / 1920, stageAreaH / 1080);
	const stageWidth = 1920 * stageScale;
	const stageHeight = 1080 * stageScale;
	const stageOffsetX = (stageAreaW - stageWidth) / 2;
	const stageOffsetY = (stageAreaH - stageHeight) / 2;

	// Camera whole-system view: minimum zoom = 1080 / (2400 + 2 * 220) = 1080 / 2840
	// Arena diameter on 1920 logical canvas = 2400 * (1080 / 2840) = 912.68 logical px.
	// Even at closer zoom levels, camera padding (220 world units) + circular arena
	// keeps the ship out of the outer ~13.5% of the 16:9 canvas on each side, plus any letterbox pillarbox.
	const closeCameraMarginLogical = 240; // ~12.5% of 1920 logical width reserved by camera padding + corner arc
	const safeMarginPx = Math.round(
		stageOffsetX + closeCameraMarginLogical * stageScale,
	);

	let outerWidth = 110;
	let totalHeight = 200;

	if (currentRule === "proportional") {
		outerWidth = Math.round(stageAreaW * 0.115);
		totalHeight = Math.round(stageAreaH * 0.52);
	} else if (currentRule === "clamped-thumb") {
		outerWidth = Math.round(Math.min(Math.max(92, stageAreaW * 0.12), 132));
		totalHeight = Math.round(Math.min(Math.max(180, stageAreaH * 0.54), 260));
	} else if (currentRule === "device-tiered") {
		if (device.id === "desktop") {
			outerWidth = 96;
			totalHeight = 190;
		} else if (device.id === "ipad-4-3") {
			outerWidth = 136;
			totalHeight = 268;
		} else {
			outerWidth = Math.round(Math.min(Math.max(96, stageAreaW * 0.125), 116));
			totalHeight = Math.round(stageAreaH * 0.56);
		}
	} else {
		outerWidth = Math.round(
			Math.min(
				Math.max(76, (stageAreaW * customWidthVw) / 100),
				customMaxWidthPx,
			),
		);
		totalHeight = Math.round(
			Math.min(
				Math.max(140, (stageAreaH * customHeightPct) / 100),
				customMaxHeightPx,
			),
		);
	}

	const innerWidth = Math.round(outerWidth * fWidthRatio);
	const fHeight = Math.round(totalHeight * fHeightRatio);
	const lExposedEdge = totalHeight - fHeight;
	const bevelDropOuter = Math.round(outerWidth * TAN_30);
	const bevelDropInner = Math.round(innerWidth * TAN_30);
	const marginClearancePx = safeMarginPx - outerWidth;

	return {
		outerWidth,
		innerWidth,
		totalHeight,
		fHeight,
		lExposedEdge,
		bevelDropOuter,
		bevelDropInner,
		stageWidth,
		stageHeight,
		stageOffsetX,
		stageOffsetY,
		safeMarginPx,
		marginClearancePx,
	};
}

function leftUpperPoints(device: DeviceScreen, m: FlapMetrics): string {
	const H = device.height;
	const yTop = H - m.totalHeight;
	const yCorner = yTop + m.bevelDropOuter;
	return `0,${yTop} ${m.outerWidth},${yCorner} ${m.outerWidth},${H} 0,${H}`;
}

function leftLowerPoints(device: DeviceScreen, m: FlapMetrics): string {
	const H = device.height;
	const yTop = H - m.fHeight;
	const yCorner = yTop + m.bevelDropInner;
	return `0,${yTop} ${m.innerWidth},${yCorner} ${m.innerWidth},${H} 0,${H}`;
}

function rightUpperPoints(device: DeviceScreen, m: FlapMetrics): string {
	const W = device.width;
	const H = device.height;
	const yTop = H - m.totalHeight;
	const yCorner = yTop + m.bevelDropOuter;
	return `${W},${yTop} ${W - m.outerWidth},${yCorner} ${W - m.outerWidth},${H} ${W},${H}`;
}

function rightLowerPoints(device: DeviceScreen, m: FlapMetrics): string {
	const W = device.width;
	const H = device.height;
	const yTop = H - m.fHeight;
	const yCorner = yTop + m.bevelDropInner;
	return `${W},${yTop} ${W - m.innerWidth},${yCorner} ${W - m.innerWidth},${H} ${W},${H}`;
}

const currentRuleMeta = $derived(
	RULES.find((item) => item.id === rule) ?? RULES[0],
);
</script>

<div class="sizing-bench">
	<section class="bench-controls" aria-label={label}>
		<div class="control-row">
			<span class="row-label">02.1 Sizing rule across screens</span>
			<div class="pill-row">
				{#each RULES as item}
					<button
						type="button"
						class="btn"
						class:btn-filled={rule === item.id}
						class:btn-ghost={rule !== item.id}
						onclick={() => (rule = item.id)}
					>
						{item.label}
					</button>
				{/each}
			</div>
		</div>

		{#if rule === "custom"}
			<div class="tuner-grid">
				<label>
					<span>Width scale ({customWidthVw}vw)</span>
					<input
						type="range"
						min="8"
						max="18"
						step="0.5"
						bind:value={customWidthVw}
					>
				</label>
				<label>
					<span>Max width cap ({customMaxWidthPx}px)</span>
					<input
						type="range"
						min="84"
						max="220"
						step="4"
						bind:value={customMaxWidthPx}
					>
				</label>
				<label>
					<span>Stack height ({customHeightPct}% stageH)</span>
					<input
						type="range"
						min="35"
						max="75"
						step="1"
						bind:value={customHeightPct}
					>
				</label>
				<label>
					<span>Max height cap ({customMaxHeightPx}px)</span>
					<input
						type="range"
						min="160"
						max="480"
						step="10"
						bind:value={customMaxHeightPx}
					>
				</label>
				<label>
					<span>F height share ({Math.round(fHeightRatio * 100)}%)</span>
					<input
						type="range"
						min="0.45"
						max="0.7"
						step="0.01"
						bind:value={fHeightRatio}
					>
				</label>
				<label>
					<span>F width inset ({Math.round(fWidthRatio * 100)}% of L/R)</span>
					<input
						type="range"
						min="0.75"
						max="1"
						step="0.01"
						bind:value={fWidthRatio}
					>
				</label>
			</div>
		{/if}

		<div class="meta-bar">
			<div>
				<p class="rule-summary">{currentRuleMeta.summary}</p>
				<p class="rule-formula">
					<code>{currentRuleMeta.formula}</code>
					· 60° flap angle (30° slope from horizontal)
				</p>
			</div>
			<div class="meta-actions">
				<label class="check-label">
					<input type="checkbox" bind:checked={showArenaBounds}>
					<span>Show ship-free side margins &amp; orbit bounds</span>
				</label>
			</div>
		</div>
	</section>

	<div class="screen-grid">
		{#each DEVICES as device}
			{@const m = computeMetrics(device, rule)}
			{@const stageCenterY =
				device.headerHeight + (device.height - device.headerHeight) / 2}
			{@const arenaRadiusPx = (m.stageHeight / 2840) * 1200}
			<article class="screen-card">
				<header class="card-header">
					<div>
						<h4>{device.name}</h4>
						<span class="device-sub">{device.sub}</span>
					</div>
					<span
						class="margin-badge"
						class:fits={m.marginClearancePx >= 0}
						class:intrudes={m.marginClearancePx < 0}
					>
						{m.marginClearancePx >= 0
							? `Fits margin (+${m.marginClearancePx}px spare)`
							: `Overlaps margin by ${Math.abs(m.marginClearancePx)}px`}
					</span>
				</header>

				<div class="svg-frame">
					<svg
						viewBox={`0 0 ${device.width} ${device.height}`}
						aria-label={`${device.name} touch zone diagram`}
					>
						<!-- Screen background -->
						<rect
							x="0"
							y="0"
							width={device.width}
							height={device.height}
							fill="var(--color-void)"
						/>

						<!-- Top header bar -->
						<rect
							x="0"
							y="0"
							width={device.width}
							height={device.headerHeight}
							fill="var(--color-elev-1)"
						/>
						<line
							x1="0"
							y1={device.headerHeight}
							x2={device.width}
							y2={device.headerHeight}
							stroke="var(--color-border)"
							stroke-width="1"
						/>
						<text
							x="16"
							y={device.headerHeight * 0.62}
							fill="var(--color-brand)"
							font-size="14"
							font-family="var(--font-family-ui)"
						>
							∅·Δ
						</text>

						{#if showArenaBounds}
							<!-- Left & Right ship-free side margins -->
							<rect
								x="0"
								y={device.headerHeight}
								width={m.safeMarginPx}
								height={device.height - device.headerHeight}
								fill="var(--color-action)"
								fill-opacity="0.04"
							/>
							<line
								x1={m.safeMarginPx}
								y1={device.headerHeight}
								x2={m.safeMarginPx}
								y2={device.height}
								stroke="var(--color-action)"
								stroke-dasharray="6 6"
								stroke-opacity="0.45"
								stroke-width="1.5"
							/>
							<text
								x={m.safeMarginPx + 6}
								y={device.headerHeight + 20}
								fill="var(--color-text-muted)"
								font-size="12"
								font-family="var(--font-family-ui)"
							>
								← {m.safeMarginPx}px safe margin
							</text>

							<rect
								x={device.width - m.safeMarginPx}
								y={device.headerHeight}
								width={m.safeMarginPx}
								height={device.height - device.headerHeight}
								fill="var(--color-action)"
								fill-opacity="0.04"
							/>
							<line
								x1={device.width - m.safeMarginPx}
								y1={device.headerHeight}
								x2={device.width - m.safeMarginPx}
								y2={device.height}
								stroke="var(--color-action)"
								stroke-dasharray="6 6"
								stroke-opacity="0.45"
								stroke-width="1.5"
							/>

							<!-- Whole-system arena boundary circle & star -->
							<circle
								cx={device.width / 2}
								cy={stageCenterY}
								r={arenaRadiusPx}
								fill="none"
								stroke="var(--color-border)"
								stroke-width="1.5"
							/>
							<circle
								cx={device.width / 2}
								cy={stageCenterY}
								r={arenaRadiusPx * 0.68}
								fill="none"
								stroke="var(--color-grid)"
								stroke-dasharray="4 4"
								stroke-width="1"
							/>
							<circle
								cx={device.width / 2}
								cy={stageCenterY}
								r={Math.max(14, arenaRadiusPx * 0.14)}
								fill="var(--color-caution-tape)"
							/>
						{/if}

						<!-- LEFT SIDE STACKED 60° FLAPS: L (upper/outer) + F (lower corner) -->
						<g class="flap-group">
							<polygon
								points={leftUpperPoints(device, m)}
								class="flap-upper"
								class:is-active={activePreviewCmd === "L"}
								onpointerenter={() => (activePreviewCmd = "L")}
								onpointerleave={() => (activePreviewCmd = "NONE")}
							/>
							<polygon
								points={leftLowerPoints(device, m)}
								class="flap-lower"
								class:is-active={activePreviewCmd === "F"}
								onpointerenter={() => (activePreviewCmd = "F")}
								onpointerleave={() => (activePreviewCmd = "NONE")}
							/>
							<text
								x={m.outerWidth * 0.45}
								y={device.height - m.fHeight - m.lExposedEdge * 0.32}
								text-anchor="middle"
								dominant-baseline="middle"
								class="flap-label"
							>
								L
							</text>
							<text
								x={m.innerWidth * 0.46}
								y={device.height - m.fHeight * 0.38}
								text-anchor="middle"
								dominant-baseline="middle"
								class="flap-label"
							>
								F
							</text>
						</g>

						<!-- RIGHT SIDE STACKED 60° FLAPS: R (upper/outer) + F (lower corner) -->
						<g class="flap-group">
							<polygon
								points={rightUpperPoints(device, m)}
								class="flap-upper"
								class:is-active={activePreviewCmd === "R"}
								onpointerenter={() => (activePreviewCmd = "R")}
								onpointerleave={() => (activePreviewCmd = "NONE")}
							/>
							<polygon
								points={rightLowerPoints(device, m)}
								class="flap-lower"
								class:is-active={activePreviewCmd === "F"}
								onpointerenter={() => (activePreviewCmd = "F")}
								onpointerleave={() => (activePreviewCmd = "NONE")}
							/>
							<text
								x={device.width - m.outerWidth * 0.45}
								y={device.height - m.fHeight - m.lExposedEdge * 0.32}
								text-anchor="middle"
								dominant-baseline="middle"
								class="flap-label"
							>
								R
							</text>
							<text
								x={device.width - m.innerWidth * 0.46}
								y={device.height - m.fHeight * 0.38}
								text-anchor="middle"
								dominant-baseline="middle"
								class="flap-label"
							>
								F
							</text>
						</g>

						<!-- Dimension callout on left stack -->
						<line
							x1={m.outerWidth + 8}
							y1={device.height - m.totalHeight}
							x2={m.outerWidth + 8}
							y2={device.height}
							stroke="var(--color-text-muted)"
							stroke-width="1"
						/>
						<text
							x={m.outerWidth + 14}
							y={device.height - m.totalHeight / 2}
							fill="var(--color-text)"
							font-size="13"
							font-family="var(--font-family-ui)"
							dominant-baseline="middle"
						>
							{m.totalHeight}px ({Math.round(
								(m.totalHeight / (device.height - device.headerHeight)) * 100,
							)}% H)
						</text>
					</svg>
				</div>

				<dl class="metrics-row">
					<div>
						<dt>Upper flap (L / R)</dt>
						<dd>{m.outerWidth}px wide · {m.lExposedEdge}px upper edge</dd>
					</div>
					<div>
						<dt>Lower corner (F)</dt>
						<dd>{m.innerWidth}px wide · {m.fHeight}px left/right edge</dd>
					</div>
					<div>
						<dt>Total stack</dt>
						<dd>
							{m.outerWidth}
							× {m.totalHeight}px ({Math.round(
								(m.outerWidth / device.width) * 100,
							)}% W ×
							{Math.round(
								(m.totalHeight / (device.height - device.headerHeight)) * 100,
							)}% H)
						</dd>
					</div>
				</dl>
			</article>
		{/each}
	</div>
</div>

<style>
.sizing-bench {
	display: grid;
	gap: var(--spacing-md);
	margin-block: var(--spacing-md) var(--spacing-lg);
	font-family: var(--font-family-ui);
}

.bench-controls {
	display: grid;
	gap: var(--spacing-md);
	padding: var(--spacing-md);
	background: var(--color-elev-1);
	border: 1px solid var(--color-border);
}

.control-row {
	display: grid;
	gap: var(--spacing-xs);
}

.row-label {
	font-size: var(--font-size-caption);
	color: var(--color-text-muted);
	letter-spacing: var(--tracking-eyebrow);
	text-transform: uppercase;
}

.pill-row {
	display: flex;
	flex-wrap: wrap;
	gap: var(--spacing-sm);
}

.tuner-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: var(--spacing-md);
	padding: var(--spacing-sm) var(--spacing-md);
	background: var(--color-void);
	border: 1px solid var(--color-border-subtle);
}

.tuner-grid label {
	display: grid;
	gap: var(--spacing-xs);
	font-size: var(--font-size-caption);
	color: var(--color-text-muted);
}

.tuner-grid input[type="range"] {
	accent-color: var(--color-action);
	width: 100%;
}

.meta-bar {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: var(--spacing-md);
	padding-top: var(--spacing-sm);
	border-top: 1px solid var(--color-border-subtle);
}

.rule-summary {
	margin: 0;
	font-family: var(--font-family-prose);
	font-size: var(--font-size-body);
	color: var(--color-text);
}

.rule-formula {
	margin: var(--spacing-xs) 0 0;
	font-size: var(--font-size-caption);
	color: var(--color-text-muted);
}

.check-label {
	display: inline-flex;
	align-items: center;
	gap: var(--spacing-xs);
	font-size: var(--font-size-caption);
	color: var(--color-text);
	cursor: pointer;
}

.screen-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(460px, 1fr));
	gap: var(--spacing-md);
}

.screen-card {
	display: grid;
	gap: var(--spacing-sm);
	padding: var(--spacing-md);
	background: var(--color-elev-1);
	border: 1px solid var(--color-border);
}

.card-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: var(--spacing-sm);
}

.card-header h4 {
	margin: 0;
	font-size: var(--font-size-body);
	color: var(--color-text);
}

.device-sub {
	font-size: var(--font-size-caption);
	color: var(--color-text-muted);
}

.margin-badge {
	font-size: var(--font-size-caption);
	padding: 2px var(--spacing-sm);
	border: 1px solid var(--color-border);
	white-space: nowrap;
}

.margin-badge.fits {
	color: var(--color-selected);
	border-color: color-mix(in lch, var(--color-selected) 45%, transparent);
}

.margin-badge.intrudes {
	color: var(--color-caution-tape);
	border-color: color-mix(in lch, var(--color-caution-tape) 45%, transparent);
}

.svg-frame {
	border: 1px solid var(--color-border);
	background: var(--color-void);
	overflow: hidden;
}

.svg-frame svg {
	width: 100%;
	height: auto;
	display: block;
}

.flap-upper {
	fill: color-mix(in lch, var(--color-selected) 24%, var(--color-void));
	stroke: color-mix(in lch, var(--color-selected) 50%, transparent);
	stroke-width: 1.5;
	cursor: pointer;
}

.flap-lower {
	fill: color-mix(in lch, var(--color-selected) 40%, var(--color-void));
	stroke: var(--color-selected);
	stroke-width: 1.5;
	cursor: pointer;
}

.flap-upper.is-active,
.flap-lower.is-active {
	fill: color-mix(in lch, var(--color-selected) 72%, var(--color-void));
}

.flap-label {
	fill: var(--color-text);
	font-family: var(--font-family-ui);
	font-size: 28px;
	font-weight: var(--font-weight-bold);
	pointer-events: none;
}

.metrics-row {
	margin: 0;
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: var(--spacing-sm);
	padding-top: var(--spacing-xs);
	border-top: 1px solid var(--color-border-subtle);
}

.metrics-row dt {
	font-size: var(--font-size-caption);
	color: var(--color-text-muted);
}

.metrics-row dd {
	margin: 2px 0 0;
	font-size: var(--font-size-caption);
	color: var(--color-text);
}

@media (max-width: 640px) {
	.screen-grid {
		grid-template-columns: 1fr;
	}
	.metrics-row {
		grid-template-columns: 1fr;
	}
}
</style>
