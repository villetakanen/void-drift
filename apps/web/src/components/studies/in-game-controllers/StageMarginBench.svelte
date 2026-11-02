<script lang="ts">
let {
	label = "16:9 and 4:3 stage, active camera area, and side instrumentation margin explorer",
}: {
	label?: string;
} = $props();

// Logical coordinate system normalized to 1080 height:
// 16:9 = 1920 × 1080
// 4:3  = 1440 × 1080
// Both share identical logical height (1080), so a side margin M_x and top/bottom margin M_y
// have the exact same physical/logical thickness across 16:9, 4:3, and every ratio in between.
const LOGICAL_H = 1080;
const TAN_30 = Math.tan(Math.PI / 6); // 60° from vertical edge = 30° from horizontal

let sideMargin = $state(220); // Left & right instrumentation margin (logical px at 1080h)
let topBottomMargin = $state(64); // Top & bottom visual-only margin (logical px at 1080h)
let flapStackHeightPct = $state(54); // % of total height for L+F / R+F stack
let fHeightSharePct = $state(58); // % of flap stack height given to lower F flap
let fWidthInsetPct = $state(90); // F width as % of sideMargin (L/R fills 100% of sideMargin)
let showGuides = $state(true);
let testRatio = $state(1.6); // Intermediate ratio scrubber between 4:3 (1.333) and 16:9 (1.778)

interface ScreenSpec {
	id: string;
	title: string;
	ratioLabel: string;
	width: number;
	height: number;
}

const BOUNDARY_SCREENS: ScreenSpec[] = [
	{
		id: "ratio-16-9",
		title: "16:9 · Maximum wide envelope",
		ratioLabel: "16:9 (1.78:1 · 1920 × 1080 logical)",
		width: 1920,
		height: LOGICAL_H,
	},
	{
		id: "ratio-4-3",
		title: "4:3 · Minimum narrow envelope",
		ratioLabel: "4:3 (1.33:1 · 1440 × 1080 logical)",
		width: 1440,
		height: LOGICAL_H,
	},
];

const PRESETS: {
	name: string;
	side: number;
	topBottom: number;
	stackPct: number;
	fShare: number;
	fInset: number;
}[] = [
	{
		name: "Balanced (220 side / 64 top-bottom)",
		side: 220,
		topBottom: 64,
		stackPct: 54,
		fShare: 58,
		fInset: 90,
	},
	{
		name: "Compact margins (180 side / 48 top-bottom)",
		side: 180,
		topBottom: 48,
		stackPct: 50,
		fShare: 56,
		fInset: 90,
	},
	{
		name: "Wide instrument rails (260 side / 80 top-bottom)",
		side: 260,
		topBottom: 80,
		stackPct: 58,
		fShare: 60,
		fInset: 88,
	},
];

function applyPreset(p: (typeof PRESETS)[number]) {
	sideMargin = p.side;
	topBottomMargin = p.topBottom;
	flapStackHeightPct = p.stackPct;
	fHeightSharePct = p.fShare;
	fWidthInsetPct = p.fInset;
}

function computeZones(screen: ScreenSpec) {
	const W = screen.width;
	const H = screen.height;
	const activeW = Math.max(200, W - sideMargin * 2);
	const activeH = Math.max(200, H - topBottomMargin * 2);
	const activeAspect = (activeW / activeH).toFixed(2);
	const arenaRadius = Math.min(activeW, activeH) * 0.46;

	// Flaps live inside the sideMargin (width = sideMargin)
	const outerW = sideMargin;
	const innerW = Math.round(sideMargin * (fWidthInsetPct / 100));
	const totalFlapH = Math.round(H * (flapStackHeightPct / 100));
	const fH = Math.round(totalFlapH * (fHeightSharePct / 100));
	const lExposedH = totalFlapH - fH;
	const bevelOuter = Math.round(outerW * TAN_30);
	const bevelInner = Math.round(innerW * TAN_30);

	const yTopUpper = H - totalFlapH;
	const yTopLower = H - fH;

	const leftUpperPoly = `0,${yTopUpper} ${outerW},${yTopUpper + bevelOuter} ${outerW},${H} 0,${H}`;
	const leftLowerPoly = `0,${yTopLower} ${innerW},${yTopLower + bevelInner} ${innerW},${H} 0,${H}`;

	const rightUpperPoly = `${W},${yTopUpper} ${W - outerW},${yTopUpper + bevelOuter} ${W - outerW},${H} ${W},${H}`;
	const rightLowerPoly = `${W},${yTopLower} ${W - innerW},${yTopLower + bevelInner} ${W - innerW},${H} ${W},${H}`;

	// Top instrument clearance above the upper flap on the outer edge
	const instrumentClearanceH = yTopUpper - topBottomMargin;

	return {
		W,
		H,
		activeW,
		activeH,
		activeAspect,
		arenaRadius,
		outerW,
		innerW,
		totalFlapH,
		fH,
		lExposedH,
		bevelOuter,
		bevelInner,
		yTopUpper,
		yTopLower,
		leftUpperPoly,
		leftLowerPoly,
		rightUpperPoly,
		rightLowerPoly,
		instrumentClearanceH,
	};
}
</script>

<div class="margin-bench">
	<section class="bench-controls" aria-label={label}>
		<div class="preset-bar">
			<span class="bar-label">02.2 Shared margin presets</span>
			<div class="pill-row">
				{#each PRESETS as preset}
					<button
						type="button"
						class="btn"
						class:btn-filled={sideMargin === preset.side &&
							topBottomMargin === preset.topBottom &&
							flapStackHeightPct === preset.stackPct}
						class:btn-ghost={!(
							sideMargin === preset.side &&
							topBottomMargin === preset.topBottom &&
							flapStackHeightPct === preset.stackPct
						)}
						onclick={() => applyPreset(preset)}
					>
						{preset.name}
					</button>
				{/each}
			</div>
		</div>

		<div class="slider-grid">
			<label>
				<span>
					Side instrumentation margin (<code>M_x</code>):
					<strong>{sideMargin} px</strong>
					({((sideMargin / 1080) * 100).toFixed(1)}% H)
				</span>
				<input
					type="range"
					min="120"
					max="340"
					step="4"
					bind:value={sideMargin}
				>
			</label>

			<label>
				<span>
					Top &amp; bottom visual margin (<code>M_y</code>):
					<strong>{topBottomMargin} px</strong>
					({((topBottomMargin / 1080) * 100).toFixed(1)}% H)
				</span>
				<input
					type="range"
					min="24"
					max="160"
					step="4"
					bind:value={topBottomMargin}
				>
			</label>

			<label>
				<span>
					Flap stack height:
					<strong>{flapStackHeightPct}% H</strong>
					({Math.round(1080 * (flapStackHeightPct / 100))}
					px)
				</span>
				<input
					type="range"
					min="36"
					max="72"
					step="1"
					bind:value={flapStackHeightPct}
				>
			</label>

			<label>
				<span>
					Lower <code>F</code> corner share:
					<strong>{fHeightSharePct}%</strong>
					of stack
				</span>
				<input
					type="range"
					min="45"
					max="70"
					step="1"
					bind:value={fHeightSharePct}
				>
			</label>

			<label>
				<span>
					Lower <code>F</code> width inset:
					<strong>{fWidthInsetPct}%</strong>
					of <code>M_x</code>
				</span>
				<input
					type="range"
					min="78"
					max="100"
					step="1"
					bind:value={fWidthInsetPct}
				>
			</label>

			<div class="toggle-box">
				<label class="check-toggle">
					<input type="checkbox" bind:checked={showGuides}>
					<span>Show zone boundaries &amp; dimensions</span>
				</label>
			</div>
		</div>
	</section>

	<div class="dual-screens">
		{#each BOUNDARY_SCREENS as screen}
			{@const z = computeZones(screen)}
			<article class="stage-card">
				<header class="stage-header">
					<div>
						<h4>{screen.title}</h4>
						<span class="ratio-sub">{screen.ratioLabel}</span>
					</div>
					<span class="camera-readout">
						Active camera:
						<strong>{z.activeW} × {z.activeH}</strong>
						({z.activeAspect}:1)
					</span>
				</header>

				<div class="svg-stage-wrap">
					<svg
						viewBox={`0 0 ${z.W} ${z.H}`}
						style:aspect-ratio={`${z.W} / ${z.H}`}
						aria-label={`${screen.title} margin and instrument layout`}
					>
						<!-- 1. Full Rendered Space Area (100% of clamped screen) -->
						<rect
							x="0"
							y="0"
							width={z.W}
							height={z.H}
							fill="var(--color-void)"
						/>

						<!-- Background orbit rings extending into all margins (visuals render everywhere) -->
						<circle
							cx={z.W / 2}
							cy={z.H / 2}
							r={z.arenaRadius * 1.28}
							fill="none"
							stroke="var(--color-border-faint)"
							stroke-width="2"
						/>
						<circle
							cx={z.W / 2}
							cy={z.H / 2}
							r={z.arenaRadius}
							fill="none"
							stroke="var(--color-border)"
							stroke-width="2"
						/>
						<circle
							cx={z.W / 2}
							cy={z.H / 2}
							r={z.arenaRadius * 0.66}
							fill="none"
							stroke="var(--color-grid)"
							stroke-dasharray="8 8"
							stroke-width="2"
						/>
						<circle
							cx={z.W / 2}
							cy={z.H / 2}
							r={z.arenaRadius * 0.34}
							fill="none"
							stroke="var(--color-caution-tape)"
							stroke-opacity="0.35"
							stroke-width="1.5"
						/>
						<!-- Star & Planet & Ship inside Active Camera Area -->
						<circle
							cx={z.W / 2}
							cy={z.H / 2}
							r="54"
							fill="var(--color-caution-tape)"
						/>
						<circle
							cx={z.W / 2 + z.arenaRadius * 0.66 * 0.6}
							cy={z.H / 2 - z.arenaRadius * 0.66 * 0.8}
							r="20"
							fill="var(--color-text)"
						/>
						<!-- Ship icon inside active camera area -->
						<polygon
							points={`${z.W / 2 - z.arenaRadius * 0.55},${z.H / 2 - 22} ${z.W / 2 - z.arenaRadius * 0.55 - 16},${z.H / 2 + 22} ${z.W / 2 - z.arenaRadius * 0.55 + 16},${z.H / 2 + 22}`}
							fill="var(--color-resource-hull)"
						/>

						{#if showGuides}
							<!-- 2. Top & Bottom Visual Margins (graphics only) -->
							<rect
								x={sideMargin}
								y="0"
								width={z.activeW}
								height={topBottomMargin}
								fill="var(--color-text)"
								fill-opacity="0.03"
							/>
							<rect
								x={sideMargin}
								y={z.H - topBottomMargin}
								width={z.activeW}
								height={topBottomMargin}
								fill="var(--color-text)"
								fill-opacity="0.03"
							/>

							<!-- 3. Left & Right Instrumentation Margins (M_x) -->
							<rect
								x="0"
								y="0"
								width={sideMargin}
								height={z.H}
								fill="var(--color-action)"
								fill-opacity="0.045"
							/>
							<rect
								x={z.W - sideMargin}
								y="0"
								width={sideMargin}
								height={z.H}
								fill="var(--color-action)"
								fill-opacity="0.045"
							/>

							<!-- 4. Active Camera Area boundary box -->
							<rect
								x={sideMargin}
								y={topBottomMargin}
								width={z.activeW}
								height={z.activeH}
								fill="none"
								stroke="var(--color-action)"
								stroke-dasharray="10 8"
								stroke-opacity="0.7"
								stroke-width="2.5"
							/>

							<!-- Labels for Active Camera Area & Visual Margins -->
							<text
								x={z.W / 2}
								y={topBottomMargin / 2 + 6}
								text-anchor="middle"
								fill="var(--color-text-muted)"
								font-size="20"
								font-family="var(--font-family-ui)"
							>
								TOP VISUAL MARGIN ({topBottomMargin}px)
							</text>
							<text
								x={z.W / 2}
								y={z.H - topBottomMargin / 2 + 6}
								text-anchor="middle"
								fill="var(--color-text-muted)"
								font-size="20"
								font-family="var(--font-family-ui)"
							>
								BOTTOM VISUAL MARGIN ({topBottomMargin}px)
							</text>
							<text
								x={z.W / 2}
								y={topBottomMargin + 34}
								text-anchor="middle"
								fill="var(--color-action)"
								font-size="22"
								font-family="var(--font-family-ui)"
							>
								ACTIVE CAMERA AREA ({z.activeW}
								× {z.activeH})
							</text>
						{/if}

						<!-- LEFT INSTRUMENTATION MARGIN: Top = Hull & Power -->
						<g class="hud-instrument">
							<text
								x="24"
								y={Math.max(40, topBottomMargin + 24)}
								fill="var(--color-text-muted)"
								font-size="18"
								font-family="var(--font-family-ui)"
							>
								HULL
							</text>
							<text
								x="24"
								y={Math.max(76, topBottomMargin + 60)}
								fill="var(--color-text)"
								font-size="32"
								font-weight="700"
								font-family="var(--font-family-ui)"
							>
								100%
							</text>
							<rect
								x="24"
								y={Math.max(90, topBottomMargin + 74)}
								width={Math.max(72, sideMargin - 48)}
								height="6"
								fill="var(--color-resource-hull)"
							/>

							<text
								x="24"
								y={Math.max(132, topBottomMargin + 116)}
								fill="var(--color-text-muted)"
								font-size="18"
								font-family="var(--font-family-ui)"
							>
								POWER
							</text>
							<text
								x="24"
								y={Math.max(168, topBottomMargin + 152)}
								fill="var(--color-text)"
								font-size="32"
								font-weight="700"
								font-family="var(--font-family-ui)"
							>
								139%
							</text>
							<rect
								x="24"
								y={Math.max(182, topBottomMargin + 166)}
								width={Math.max(72, sideMargin - 48)}
								height="6"
								fill="var(--color-resource-power)"
							/>
						</g>

						<!-- RIGHT INSTRUMENTATION MARGIN: Top = Survival & Score -->
						<g class="hud-instrument">
							<text
								x={z.W - 24}
								y={Math.max(40, topBottomMargin + 24)}
								text-anchor="end"
								fill="var(--color-text-muted)"
								font-size="18"
								font-family="var(--font-family-ui)"
							>
								SURVIVAL
							</text>
							<text
								x={z.W - 24}
								y={Math.max(78, topBottomMargin + 62)}
								text-anchor="end"
								fill="var(--color-text)"
								font-size="36"
								font-weight="700"
								font-family="var(--font-family-ui)"
							>
								20.3s
							</text>
							<text
								x={z.W - 24}
								y={Math.max(118, topBottomMargin + 102)}
								text-anchor="end"
								fill="var(--color-text-muted)"
								font-size="18"
								font-family="var(--font-family-ui)"
							>
								SCORE · G CLASS
							</text>
						</g>

						<!-- LEFT SIDE 60° FLAPS (inside left sideMargin) -->
						<g>
							<polygon points={z.leftUpperPoly} class="flap-upper" />
							<polygon points={z.leftLowerPoly} class="flap-lower" />
							<text
								x={z.outerW * 0.46}
								y={z.H - z.fH - z.lExposedH * 0.34}
								text-anchor="middle"
								dominant-baseline="middle"
								class="flap-glyph"
							>
								L
							</text>
							<text
								x={z.innerW * 0.46}
								y={z.H - z.fH * 0.38}
								text-anchor="middle"
								dominant-baseline="middle"
								class="flap-glyph"
							>
								F
							</text>
						</g>

						<!-- RIGHT SIDE 60° FLAPS (inside right sideMargin) -->
						<g>
							<polygon points={z.rightUpperPoly} class="flap-upper" />
							<polygon points={z.rightLowerPoly} class="flap-lower" />
							<text
								x={z.W - z.outerW * 0.46}
								y={z.H - z.fH - z.lExposedH * 0.34}
								text-anchor="middle"
								dominant-baseline="middle"
								class="flap-glyph"
							>
								R
							</text>
							<text
								x={z.W - z.innerW * 0.46}
								y={z.H - z.fH * 0.38}
								text-anchor="middle"
								dominant-baseline="middle"
								class="flap-glyph"
							>
								F
							</text>
						</g>

						{#if showGuides}
							<!-- Side margin width callout -->
							<line
								x1="0"
								y1={z.yTopUpper - 28}
								x2={sideMargin}
								y2={z.yTopUpper - 28}
								stroke="var(--color-selected)"
								stroke-width="2"
							/>
							<text
								x={sideMargin / 2}
								y={z.yTopUpper - 40}
								text-anchor="middle"
								fill="var(--color-selected)"
								font-size="20"
								font-family="var(--font-family-ui)"
							>
								{sideMargin}px
							</text>
						{/if}
					</svg>
				</div>

				<dl class="zone-stats">
					<div>
						<dt>Rendered stage</dt>
						<dd>{z.W} × {z.H} (100%)</dd>
					</div>
					<div>
						<dt>Active camera box</dt>
						<dd>
							{z.activeW}
							× {z.activeH} ({Math.round((z.activeW / z.W) * 100)}% W ×
							{Math.round((z.activeH / z.H) * 100)}% H)
						</dd>
					</div>
					<div>
						<dt>Side instrument rail</dt>
						<dd>
							{sideMargin}px wide ({Math.round((sideMargin / z.W) * 100)}% of W
							each side)
						</dd>
					</div>
					<div>
						<dt>Flap stack (L/R + F)</dt>
						<dd>
							{z.outerW}
							× {z.totalFlapH}px (L: {z.lExposedH}px, F: {z.fH}px)
						</dd>
					</div>
				</dl>
			</article>
		{/each}
	</div>

	<!-- Continuous Clamped Container Scrubber (4:3 to 16:9) -->
	<section
		class="clamp-preview"
		aria-label="Continuous aspect ratio clamp preview"
	>
		<div class="clamp-header">
			<div>
				<h4>Clamped container behavior between 4:3 (1.33) and 16:9 (1.78)</h4>
				<p>
					Slide between <code>4:3</code> and <code>16:9</code> (plus
					out-of-range phone <code>20:9</code> or square <code>1:1</code>) to
					verify how CSS clamping keeps the game frame strictly inside
					<code>4:3..16:9</code>
					with the same <code>{sideMargin}px</code> side margins and
					<code>{topBottomMargin}px</code>
					top/bottom margins.
				</p>
			</div>
			<label class="ratio-slider">
				<span>
					Window aspect ratio: <strong>{testRatio.toFixed(2)}:1</strong>
					{#if testRatio > 1.78}
						(Clamped to 16:9)
					{:else if testRatio < 1.33}
						(Clamped to 4:3)
					{:else}
						(Native inside 4:3..16:9)
					{/if}
				</span>
				<input
					type="range"
					min="1.0"
					max="2.2"
					step="0.02"
					bind:value={testRatio}
				>
			</label>
		</div>

		{#if true}
			{@const clampedRatio = Math.min(16 / 9, Math.max(4 / 3, testRatio))}
			{@const dynamicScreen = {
				id: "dynamic",
				title: "Clamped stage",
				ratioLabel: `${clampedRatio.toFixed(2)}:1`,
				width: Math.round(LOGICAL_H * clampedRatio),
				height: LOGICAL_H,
			}}
			{@const dz = computeZones(dynamicScreen)}
			<div class="clamp-window" style:aspect-ratio={`${testRatio} / 1`}>
				<svg
					class="clamped-stage-svg"
					viewBox={`0 0 ${dz.W} ${dz.H}`}
					style:aspect-ratio={`${dz.W} / ${dz.H}`}
					aria-label="Dynamically clamped game stage"
				>
					<rect
						x="0"
						y="0"
						width={dz.W}
						height={dz.H}
						fill="var(--color-void)"
					/>
					<circle
						cx={dz.W / 2}
						cy={dz.H / 2}
						r={dz.arenaRadius}
						fill="none"
						stroke="var(--color-border)"
						stroke-width="2"
					/>
					<circle
						cx={dz.W / 2}
						cy={dz.H / 2}
						r="48"
						fill="var(--color-caution-tape)"
					/>
					<rect
						x="0"
						y="0"
						width={sideMargin}
						height={dz.H}
						fill="var(--color-action)"
						fill-opacity="0.05"
					/>
					<rect
						x={dz.W - sideMargin}
						y="0"
						width={sideMargin}
						height={dz.H}
						fill="var(--color-action)"
						fill-opacity="0.05"
					/>
					<rect
						x={sideMargin}
						y={topBottomMargin}
						width={dz.activeW}
						height={dz.activeH}
						fill="none"
						stroke="var(--color-action)"
						stroke-dasharray="10 8"
						stroke-opacity="0.7"
						stroke-width="2.5"
					/>
					<polygon points={dz.leftUpperPoly} class="flap-upper" />
					<polygon points={dz.leftLowerPoly} class="flap-lower" />
					<polygon points={dz.rightUpperPoly} class="flap-upper" />
					<polygon points={dz.rightLowerPoly} class="flap-lower" />
					<text
						x={dz.outerW * 0.46}
						y={dz.H - dz.fH - dz.lExposedH * 0.34}
						text-anchor="middle"
						dominant-baseline="middle"
						class="flap-glyph"
					>
						L
					</text>
					<text
						x={dz.innerW * 0.46}
						y={dz.H - dz.fH * 0.38}
						text-anchor="middle"
						dominant-baseline="middle"
						class="flap-glyph"
					>
						F
					</text>
					<text
						x={dz.W - dz.outerW * 0.46}
						y={dz.H - dz.fH - dz.lExposedH * 0.34}
						text-anchor="middle"
						dominant-baseline="middle"
						class="flap-glyph"
					>
						R
					</text>
					<text
						x={dz.W - dz.innerW * 0.46}
						y={dz.H - dz.fH * 0.38}
						text-anchor="middle"
						dominant-baseline="middle"
						class="flap-glyph"
					>
						F
					</text>
				</svg>
			</div>
		{/if}
	</section>
</div>

<style>
.margin-bench {
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

.preset-bar {
	display: grid;
	gap: var(--spacing-xs);
}

.bar-label {
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

.slider-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	gap: var(--spacing-md);
	padding-top: var(--spacing-sm);
	border-top: 1px solid var(--color-border-subtle);
}

.slider-grid label {
	display: grid;
	gap: var(--spacing-xs);
	font-size: var(--font-size-caption);
	color: var(--color-text-muted);
}

.slider-grid strong {
	color: var(--color-text);
}

.slider-grid input[type="range"],
.ratio-slider input[type="range"] {
	accent-color: var(--color-action);
	width: 100%;
}

.toggle-box {
	display: flex;
	align-items: flex-end;
}

.check-toggle {
	display: inline-flex;
	align-items: center;
	gap: var(--spacing-xs);
	color: var(--color-text);
	cursor: pointer;
}

.dual-screens {
	display: grid;
	grid-template-columns: 1.15fr 0.85fr;
	gap: var(--spacing-md);
	align-items: start;
}

.stage-card {
	display: grid;
	gap: var(--spacing-sm);
	padding: var(--spacing-md);
	background: var(--color-elev-1);
	border: 1px solid var(--color-border);
}

.stage-header {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	justify-content: space-between;
	gap: var(--spacing-xs);
}

.stage-header h4 {
	margin: 0;
	font-size: var(--font-size-body);
	color: var(--color-text);
}

.ratio-sub {
	font-size: var(--font-size-caption);
	color: var(--color-text-muted);
}

.camera-readout {
	font-size: var(--font-size-caption);
	color: var(--color-text-muted);
}

.camera-readout strong {
	color: var(--color-action);
}

.svg-stage-wrap {
	border: 1px solid var(--color-border);
	background: var(--color-void);
	overflow: hidden;
}

.svg-stage-wrap svg {
	width: 100%;
	height: auto;
	display: block;
}

.flap-upper {
	fill: color-mix(in lch, var(--color-selected) 24%, var(--color-void));
	stroke: color-mix(in lch, var(--color-selected) 55%, transparent);
	stroke-width: 2;
}

.flap-lower {
	fill: color-mix(in lch, var(--color-selected) 42%, var(--color-void));
	stroke: var(--color-selected);
	stroke-width: 2;
}

.flap-glyph {
	fill: var(--color-text);
	font-family: var(--font-family-ui);
	font-size: 56px;
	font-weight: var(--font-weight-bold);
}

.zone-stats {
	margin: 0;
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: var(--spacing-sm);
	padding-top: var(--spacing-xs);
	border-top: 1px solid var(--color-border-subtle);
}

.zone-stats dt {
	font-size: var(--font-size-caption);
	color: var(--color-text-muted);
}

.zone-stats dd {
	margin: 2px 0 0;
	font-size: var(--font-size-caption);
	color: var(--color-text);
}

.clamp-preview {
	display: grid;
	gap: var(--spacing-md);
	padding: var(--spacing-md);
	background: var(--color-elev-1);
	border: 1px solid var(--color-border);
}

.clamp-header {
	display: flex;
	flex-wrap: wrap;
	align-items: flex-start;
	justify-content: space-between;
	gap: var(--spacing-md);
}

.clamp-header h4 {
	margin: 0 0 var(--spacing-xs);
	font-size: var(--font-size-body);
}

.clamp-header p {
	margin: 0;
	max-width: 60ch;
	font-family: var(--font-family-prose);
	font-size: var(--font-size-caption);
	color: var(--color-text-muted);
}

.ratio-slider {
	min-width: 260px;
	display: grid;
	gap: var(--spacing-xs);
	font-size: var(--font-size-caption);
	color: var(--color-text-muted);
}

.ratio-slider strong {
	color: var(--color-text);
}

.clamp-window {
	max-height: 360px;
	margin: 0 auto;
	background: lch(0% 0 0 / 0.55);
	border: 1px dashed var(--color-border);
	display: grid;
	place-items: center;
	overflow: hidden;
}

.clamped-stage-svg {
	max-width: 100%;
	max-height: 360px;
	width: auto;
	height: auto;
	border: 1px solid var(--color-action);
	display: block;
}

@media (max-width: 860px) {
	.dual-screens {
		grid-template-columns: 1fr;
	}
}
</style>
