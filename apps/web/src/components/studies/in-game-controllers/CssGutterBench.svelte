<script lang="ts">
let {
  label = "CSS-pixel side gutters and active fly area across devices",
}: {
  label?: string;
} = $props();

const TAN_30 = Math.tan(Math.PI / 6); // 60° from vertical screen edge = 30° from horizontal

type GutterMode = "fixed-css" | "clamped-min" | "logical-scaled";

let gutterMode = $state<GutterMode>("fixed-css");
let sideGutterCss = $state(180); // Target CSS-pixel side gutter (default 180 CSS px)
let minSideGutterCss = $state(108); // Minimum floor when clamped on compact phones
let topBottomGutterCss = $state(48); // Top/bottom CSS-pixel gutter
let flapHeightCss = $state(240); // Desired flap stack height in CSS px (clamped on shorter screens)
let fHeightSharePct = $state(54); // % of flap stack given to lower F corner
let fWidthInsetPct = $state(84); // % of side gutter width given to lower F flap
let showGuides = $state(true);

interface DeviceViewport {
  id: string;
  name: string;
  sub: string;
  width: number; // CSS px
  height: number; // CSS px
}

const VIEWPORTS: DeviceViewport[] = [
  {
    id: "phone-compact",
    name: "Phone Landscape · 16:9",
    sub: "667 × 375 CSS px (iPhone SE / compact)",
    width: 667,
    height: 375,
  },
  {
    id: "phone-modern",
    name: "Phone Landscape · 19.5:9",
    sub: "852 × 393 CSS px (iPhone 15 / 16)",
    width: 852,
    height: 393,
  },
  {
    id: "ipad-air",
    name: "iPad Landscape · 4:3",
    sub: "1024 × 768 CSS px (iPad Air / Mini)",
    width: 1024,
    height: 768,
  },
  {
    id: "ipad-pro-13",
    name: "iPad Pro 13” · 4:3",
    sub: "1366 × 1024 CSS px",
    width: 1366,
    height: 1024,
  },
  {
    id: "laptop",
    name: "Laptop / Desktop · 16:10",
    sub: "1440 × 900 CSS px",
    width: 1440,
    height: 900,
  },
  {
    id: "desktop-hd",
    name: "Desktop · 16:9",
    sub: "1920 × 1080 CSS px",
    width: 1920,
    height: 1080,
  },
];

const MODES: {
  id: GutterMode;
  title: string;
  summary: string;
  formula: string;
}[] = [
  {
    id: "fixed-css",
    title: "A · Fixed 180 CSS px side gutter everywhere",
    summary:
      "Both side gutters stay at a constant 180 CSS px on iPad, laptop, and desktop. Wider screens give the extra horizontal space directly to the central fly area instead of inflating the side gutters.",
    formula:
      "G_x = 180 CSS px · Fly width = W − 360 CSS px · Fly height = H − 2·G_y",
  },
  {
    id: "clamped-min",
    title: "B · 180 CSS px target with compact-phone minimum floor",
    summary:
      "Locks 180 CSS px on iPad (1024w+) and desktop, while letting short landscape phones (375–393 CSS px tall) step down to a minimum thumb gutter (e.g. 108–128 CSS px) so HUD and flaps don’t crowd a 667px phone.",
    formula:
      "G_x = clamp(108px, 16vw, 180px) CSS px · G_y = clamp(24px, 6vh, 48px)",
  },
  {
    id: "logical-scaled",
    title: "C · Stage-scaled logical 180u (02.2 reference)",
    summary:
      "Scales gutter with stage height (H / 6). Shrinks to 62 CSS px on a 375px phone (cramping flaps) and grows on tall displays.",
    formula:
      "G_x = H / 6 CSS px (62px on phone, 128px on iPad, 180px at 1080p)",
  },
];

function computeViewport(vp: DeviceViewport) {
  const W = vp.width;
  const H = vp.height;

  let gx = sideGutterCss;
  let gy = topBottomGutterCss;

  if (gutterMode === "clamped-min") {
    gx = Math.round(
      Math.min(sideGutterCss, Math.max(minSideGutterCss, W * 0.16)),
    );
    gy = Math.round(Math.min(topBottomGutterCss, Math.max(20, H * 0.06)));
  } else if (gutterMode === "logical-scaled") {
    gx = Math.round((H / 1080) * sideGutterCss);
    gy = Math.round((H / 1080) * topBottomGutterCss);
  }

  const flyW = Math.max(160, W - gx * 2);
  const flyH = Math.max(140, H - gy * 2);
  const flyAspect = (flyW / flyH).toFixed(2);
  const arenaRadius = Math.min(flyW, flyH) * 0.45;

  // Flap stack in CSS px: capped so it leaves top HUD room on short phones
  const maxFlapH = Math.round(H * 0.62);
  const stackH = Math.min(flapHeightCss, maxFlapH);
  const outerW = gx;
  const innerW = Math.round(outerW * (fWidthInsetPct / 100));
  const fH = Math.round(stackH * (fHeightSharePct / 100));
  const lExposedH = stackH - fH;
  const bevelOuter = Math.round(outerW * TAN_30);
  const bevelInner = Math.round(innerW * TAN_30);

  const yTopUpper = H - stackH;
  const yTopLower = H - fH;

  const leftUpperPoly = `0,${yTopUpper} ${outerW},${yTopUpper + bevelOuter} ${outerW},${H} 0,${H}`;
  const leftLowerPoly = `0,${yTopLower} ${innerW},${yTopLower + bevelInner} ${innerW},${H} 0,${H}`;

  const rightUpperPoly = `${W},${yTopUpper} ${W - outerW},${yTopUpper + bevelOuter} ${W - outerW},${H} ${W},${H}`;
  const rightLowerPoly = `${W},${yTopLower} ${W - innerW},${yTopLower + bevelInner} ${W - innerW},${H} ${W},${H}`;

  // Top HUD clearance above upper flap
  const hudBottomY = Math.max(gy + 86, 102);
  const hudClearance = yTopUpper - hudBottomY;

  return {
    W,
    H,
    gx,
    gy,
    flyW,
    flyH,
    flyAspect,
    arenaRadius,
    stackH,
    outerW,
    innerW,
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
    hudClearance,
  };
}

const activeModeMeta = $derived(
  MODES.find((m) => m.id === gutterMode) ?? MODES[0],
);
</script>

<div class="css-gutter-bench">
  <section class="bench-controls" aria-label={label}>
    <div class="mode-bar">
      <span class="bar-label"
        >02.3 CSS-pixel gutter &amp; minimum-bound rules</span
      >
      <div class="pill-row">
        {#each MODES as mode}
          <button
            type="button"
            class="btn"
            class:btn-filled={gutterMode === mode.id}
            class:btn-ghost={gutterMode !== mode.id}
            onclick={() => (gutterMode = mode.id)}
          >
            {mode.title}
          </button>
        {/each}
      </div>
    </div>

    <div class="mode-summary-row">
      <div>
        <p class="summary-copy">{activeModeMeta.summary}</p>
        <p class="formula-copy"><code>{activeModeMeta.formula}</code></p>
      </div>
      <label class="check-toggle">
        <input type="checkbox" bind:checked={showGuides}>
        <span>Show CSS-pixel gutter &amp; fly-area bounds</span>
      </label>
    </div>

    <div class="slider-grid">
      <label>
        <span>
          Target side gutter (<code>G_x</code>):
          <strong>{sideGutterCss} CSS px</strong>
        </span>
        <input
          type="range"
          min="120"
          max="240"
          step="4"
          bind:value={sideGutterCss}
        >
      </label>

      {#if gutterMode === "clamped-min"}
        <label>
          <span>
            Phone minimum gutter floor:
            <strong>{minSideGutterCss} CSS px</strong>
          </span>
          <input
            type="range"
            min="88"
            max="180"
            step="4"
            bind:value={minSideGutterCss}
          >
        </label>
      {/if}

      <label>
        <span>
          Top &amp; bottom gutter (<code>G_y</code>):
          <strong>{topBottomGutterCss} CSS px</strong>
        </span>
        <input
          type="range"
          min="16"
          max="96"
          step="4"
          bind:value={topBottomGutterCss}
        >
      </label>

      <label>
        <span>
          Flap stack height:
          <strong>{flapHeightCss} CSS px</strong>
          (capped at 62% H on short phones)
        </span>
        <input
          type="range"
          min="160"
          max="360"
          step="8"
          bind:value={flapHeightCss}
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
    </div>
  </section>

  <div class="viewport-grid">
    {#each VIEWPORTS as vp}
      {@const z = computeViewport(vp)}
      <article class="vp-card">
        <header class="vp-header">
          <div>
            <h4>{vp.name}</h4>
            <span class="vp-sub">{vp.sub}</span>
          </div>
          <span class="fly-badge">
            Fly area:
            <strong>{z.flyW} × {z.flyH} CSS px</strong>
            ({z.flyAspect}:1)
          </span>
        </header>

        <div class="svg-wrap">
          <svg
            viewBox={`0 0 ${z.W} ${z.H}`}
            role="img"
            aria-label={`${vp.name} CSS pixel gutter diagram`}
          >
            <rect
              x="0"
              y="0"
              width={z.W}
              height={z.H}
              fill="var(--color-void)"
            />

            <!-- World orbit rings render across the full viewport behind gutters -->
            <circle
              cx={z.W / 2}
              cy={z.H / 2}
              r={z.arenaRadius * 1.25}
              fill="none"
              stroke="var(--color-border-faint)"
              stroke-width="1.5"
            />
            <circle
              cx={z.W / 2}
              cy={z.H / 2}
              r={z.arenaRadius}
              fill="none"
              stroke="var(--color-border)"
              stroke-width="1.5"
            />
            <circle
              cx={z.W / 2}
              cy={z.H / 2}
              r={z.arenaRadius * 0.65}
              fill="none"
              stroke="var(--color-grid)"
              stroke-dasharray="6 6"
              stroke-width="1.5"
            />
            <circle
              cx={z.W / 2}
              cy={z.H / 2}
              r={Math.max(16, z.arenaRadius * 0.14)}
              fill="var(--color-caution-tape)"
            />

            <g class:is-hidden={!showGuides}>
              <!-- Left & Right CSS-pixel gutters -->
              <rect
                x="0"
                y="0"
                width={z.gx}
                height={z.H}
                fill="var(--color-action)"
                fill-opacity="0.05"
              />
              <rect
                x={z.W - z.gx}
                y="0"
                width={z.gx}
                height={z.H}
                fill="var(--color-action)"
                fill-opacity="0.05"
              />

              <!-- Top & Bottom CSS-pixel gutters -->
              <rect
                x={z.gx}
                y="0"
                width={z.flyW}
                height={z.gy}
                fill="var(--color-text)"
                fill-opacity="0.03"
              />
              <rect
                x={z.gx}
                y={z.H - z.gy}
                width={z.flyW}
                height={z.gy}
                fill="var(--color-text)"
                fill-opacity="0.03"
              />

              <!-- Active Fly Area box -->
              <rect
                x={z.gx}
                y={z.gy}
                width={z.flyW}
                height={z.flyH}
                fill="none"
                stroke="var(--color-action)"
                stroke-dasharray="7 6"
                stroke-opacity="0.7"
                stroke-width="2"
              />

              <text
                x={z.W / 2}
                y={z.gy + 22}
                text-anchor="middle"
                fill="var(--color-action)"
                font-size="14"
                font-family="var(--font-family-ui)"
              >
                FLY AREA {z.flyW} × {z.flyH} CSS px
              </text>
            </g>

            <!-- Top-left HUD inside left gutter -->
            <g>
              <text
                x="14"
                y={Math.max(22, z.gy + 12)}
                fill="var(--color-text-muted)"
                font-size="11"
                font-family="var(--font-family-ui)"
              >
                HULL 100%
              </text>
              <rect
                x="14"
                y={Math.max(28, z.gy + 18)}
                width={Math.max(56, z.gx - 28)}
                height="4"
                fill="var(--color-resource-hull)"
              />
              <text
                x="14"
                y={Math.max(48, z.gy + 38)}
                fill="var(--color-text-muted)"
                font-size="11"
                font-family="var(--font-family-ui)"
              >
                POWER 100%
              </text>
              <rect
                x="14"
                y={Math.max(54, z.gy + 44)}
                width={Math.max(56, z.gx - 28)}
                height="4"
                fill="var(--color-resource-power)"
              />
            </g>

            <!-- Top-right HUD inside right gutter -->
            <g>
              <text
                x={z.W - 14}
                y={Math.max(22, z.gy + 12)}
                text-anchor="end"
                fill="var(--color-text-muted)"
                font-size="11"
                font-family="var(--font-family-ui)"
              >
                SURVIVAL
              </text>
              <text
                x={z.W - 14}
                y={Math.max(44, z.gy + 34)}
                text-anchor="end"
                fill="var(--color-text)"
                font-size="18"
                font-weight="700"
                font-family="var(--font-family-ui)"
              >
                20.3s
              </text>
            </g>

            <!-- Left 60° flaps -->
            <g>
              <polygon points={z.leftUpperPoly} class="flap-upper" />
              <polygon points={z.leftLowerPoly} class="flap-lower" />
              <text
                x={z.outerW * 0.45}
                y={z.H - z.fH - z.lExposedH * 0.34}
                text-anchor="middle"
                dominant-baseline="middle"
                class="flap-glyph"
              >
                L
              </text>
              <text
                x={z.innerW * 0.45}
                y={z.H - z.fH * 0.38}
                text-anchor="middle"
                dominant-baseline="middle"
                class="flap-glyph"
              >
                F
              </text>
            </g>

            <!-- Right 60° flaps -->
            <g>
              <polygon points={z.rightUpperPoly} class="flap-upper" />
              <polygon points={z.rightLowerPoly} class="flap-lower" />
              <text
                x={z.W - z.outerW * 0.45}
                y={z.H - z.fH - z.lExposedH * 0.34}
                text-anchor="middle"
                dominant-baseline="middle"
                class="flap-glyph"
              >
                R
              </text>
              <text
                x={z.W - z.innerW * 0.45}
                y={z.H - z.fH * 0.38}
                text-anchor="middle"
                dominant-baseline="middle"
                class="flap-glyph"
              >
                F
              </text>
            </g>

            <g class:is-hidden={!showGuides}>
              <line
                x1="0"
                y1={z.yTopUpper - 14}
                x2={z.gx}
                y2={z.yTopUpper - 14}
                stroke="var(--color-selected)"
                stroke-width="1.5"
              />
              <text
                x={z.gx / 2}
                y={z.yTopUpper - 22}
                text-anchor="middle"
                fill="var(--color-selected)"
                font-size="13"
                font-family="var(--font-family-ui)"
              >
                {z.gx}px
              </text>
            </g>
          </svg>
        </div>

        <dl class="vp-stats">
          <div>
            <dt>Side gutter</dt>
            <dd>
              {z.gx}
              CSS px ({Math.round((z.gx / z.W) * 100)}% of width each side)
            </dd>
          </div>
          <div>
            <dt>Top / bottom gutter</dt>
            <dd>{z.gy} CSS px each</dd>
          </div>
          <div>
            <dt>Flap stack (L/R + F)</dt>
            <dd>
              {z.outerW}
              × {z.stackH} CSS px (L: {z.lExposedH}px, F: {z.fH}px)
            </dd>
          </div>
          <div>
            <dt>HUD clearance</dt>
            <dd>
              {z.hudClearance >= 0
                ? `+${z.hudClearance} CSS px above L/R`
                : `Overlaps by ${Math.abs(z.hudClearance)} CSS px`}
            </dd>
          </div>
        </dl>
      </article>
    {/each}
  </div>
</div>

<style>
.css-gutter-bench {
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

.mode-bar {
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

.mode-summary-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--color-border-subtle);
}

.summary-copy {
  margin: 0;
  max-width: 68ch;
  font-family: var(--font-family-prose);
  font-size: var(--font-size-body);
  color: var(--color-text);
}

.formula-copy {
  margin: var(--spacing-xs) 0 0;
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
}

.check-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-caption);
  color: var(--color-text);
  cursor: pointer;
}

.slider-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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

.slider-grid input[type="range"] {
  accent-color: var(--color-action);
  width: 100%;
}

.viewport-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(440px, 1fr));
  gap: var(--spacing-md);
  align-items: start;
}

.vp-card {
  display: grid;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-elev-1);
  border: 1px solid var(--color-border);
}

.vp-header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--spacing-xs);
}

.vp-header h4 {
  margin: 0;
  font-size: var(--font-size-body);
  color: var(--color-text);
}

.vp-sub {
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
}

.fly-badge {
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
}

.fly-badge strong {
  color: var(--color-action);
}

.svg-wrap {
  border: 1px solid var(--color-border);
  background: var(--color-void);
  overflow: hidden;
}

.svg-wrap svg {
  width: 100%;
  display: block;
}

.is-hidden {
  display: none;
}

.flap-upper {
  fill: color-mix(in lch, var(--color-selected) 24%, var(--color-void));
  stroke: color-mix(in lch, var(--color-selected) 55%, transparent);
  stroke-width: 1.5;
}

.flap-lower {
  fill: color-mix(in lch, var(--color-selected) 42%, var(--color-void));
  stroke: var(--color-selected);
  stroke-width: 1.5;
}

.flap-glyph {
  fill: var(--color-text);
  font-family: var(--font-family-ui);
  font-size: 22px;
  font-weight: var(--font-weight-bold);
}

.vp-stats {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
  padding-top: var(--spacing-xs);
  border-top: 1px solid var(--color-border-subtle);
}

.vp-stats dt {
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
}

.vp-stats dd {
  margin: 2px 0 0;
  font-size: var(--font-size-caption);
  color: var(--color-text);
}
</style>
