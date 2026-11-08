<script lang="ts">
import { onMount } from "svelte";
import RingSlider from "../../inputs/RingSlider.svelte";
import Switch from "../../inputs/Switch.svelte";
import Toggle from "../../inputs/Toggle.svelte";

interface Props {
  label?: string;
}

const {
  label = "02.4 Nested visual tab inside outer L/R tab vs end-to-end touch partition",
}: Props = $props();

const NESTING_OPTIONS = [
  "A · Corner-nested F (84% W, 54% H)",
  "B · Inset pocket F (12px margin)",
  "C · Bezel-anchored stepped F (78% W)",
] as const;

const OVERLAY_OPTIONS = [
  "Visual nested tabs",
  "Visual + touch seam",
  "Touch areas only (end-to-end)",
] as const;

const VIEWPORT_OPTIONS = ["iPad (1024×768)", "Phone (852×393)"] as const;

let nestingMode = $state<string>("A · Corner-nested F (84% W, 54% H)");
let overlayMode = $state<string>("Visual + touch seam");
let viewportPreset = $state<string>("iPad (1024×768)");
let slideTransitions = $state(true);

let fHeightSharePct = $state(54);
let fWidthInsetPct = $state(84);

const GUTTER_PX = 180;
const TAN_30 = Math.tan(Math.PI / 6); // tan(30°) ≈ 0.57735

// Keep slider synced when switching presets unless user tweaks slider
function handleNestingChange(mode: string) {
  if (mode.startsWith("A ·")) {
    fWidthInsetPct = 84;
    fHeightSharePct = 54;
  } else if (mode.startsWith("B ·")) {
    fWidthInsetPct = 84;
    fHeightSharePct = 54;
  } else if (mode.startsWith("C ·")) {
    fWidthInsetPct = 78;
    fHeightSharePct = 54;
  }
}

$effect(() => {
  handleNestingChange(nestingMode);
});

type FlapCmd = "L" | "R" | "FL" | "FR";
let activePointers = $state<Record<number, FlapCmd>>({});
let activeKeys = $state<Record<string, boolean>>({});
let hoverCmd = $state<FlapCmd | null>(null);

function setPointerCmd(pointerId: number, cmd: FlapCmd | null) {
  const next = { ...activePointers };
  if (cmd) {
    next[pointerId] = cmd;
  } else {
    delete next[pointerId];
  }
  activePointers = next;
}

onMount(() => {
  const onKeyDown = (event: KeyboardEvent) => {
    if (
      event.target instanceof HTMLElement &&
      event.target.closest("input,select,textarea")
    ) {
      return;
    }
    if (
      ["KeyA", "KeyD", "KeyW", "ArrowLeft", "ArrowRight", "ArrowUp"].includes(
        event.code,
      )
    ) {
      activeKeys = { ...activeKeys, [event.code]: true };
    }
  };
  const onKeyUp = (event: KeyboardEvent) => {
    if (activeKeys[event.code]) {
      const next = { ...activeKeys };
      delete next[event.code];
      activeKeys = next;
    }
  };
  const onBlur = () => {
    activeKeys = {};
    activePointers = {};
  };
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", onBlur);
  };
});

const isLActive = $derived(
  Object.values(activePointers).includes("L") ||
    Boolean(activeKeys.KeyA || activeKeys.ArrowLeft),
);
const isRActive = $derived(
  Object.values(activePointers).includes("R") ||
    Boolean(activeKeys.KeyD || activeKeys.ArrowRight),
);
const isFLActive = $derived(
  Object.values(activePointers).includes("FL") ||
    Boolean(activeKeys.KeyW || activeKeys.ArrowUp),
);
const isFRActive = $derived(
  Object.values(activePointers).includes("FR") ||
    Boolean(activeKeys.KeyW || activeKeys.ArrowUp),
);

// When F (up+left / up+right equivalent) is pressed, both engines fire;
// Visually, since F sits inside the L/R outer tab, the outer tab also lights its border/underlay when F fires!
const leftThrusterFiring = $derived(isLActive || isFLActive || isFRActive);
const rightThrusterFiring = $derived(isRActive || isFLActive || isFRActive);

function buildNestedGeometry(W: number, H: number, stackH: number) {
  const outerW = GUTTER_PX;
  const innerW = Math.round(outerW * (fWidthInsetPct / 100));
  const fH = Math.round(stackH * (fHeightSharePct / 100));
  const lExposedH = stackH - fH;

  const bevelOuter = Math.round(outerW * TAN_30);
  const bevelInner = Math.round(innerW * TAN_30);

  const yTopOuter = H - stackH;
  const yTopInner = H - fH;

  const isPocket = nestingMode.startsWith("B ·");
  const pocketPad = isPocket ? 12 : 0;

  // VISUAL OUTER TAB (L / R): spans from yTopOuter ALL THE WAY TO H (the bottom of the screen),
  // so visually F sits *inside* the L / R tab!
  const leftOuterVisualPoly = `0,${yTopOuter} ${outerW},${yTopOuter + bevelOuter} ${outerW},${H} 0,${H}`;
  const rightOuterVisualPoly = `${W},${yTopOuter} ${W - outerW},${yTopOuter + bevelOuter} ${W - outerW},${H} ${W},${H}`;

  // VISUAL INNER TAB (F): nested inside the lower portion of the outer L / R tab
  const leftInnerVisualPoly = isPocket
    ? `${pocketPad},${yTopInner} ${innerW},${yTopInner + Math.round((innerW - pocketPad) * TAN_30)} ${innerW},${H - pocketPad} ${pocketPad},${H - pocketPad}`
    : `0,${yTopInner} ${innerW},${yTopInner + bevelInner} ${innerW},${H} 0,${H}`;

  const rightInnerVisualPoly = isPocket
    ? `${W - pocketPad},${yTopInner} ${W - innerW},${yTopInner + Math.round((innerW - pocketPad) * TAN_30)} ${W - innerW},${H - pocketPad} ${W - pocketPad},${H - pocketPad}`
    : `${W},${yTopInner} ${W - innerW},${yTopInner + bevelInner} ${W - innerW},${H} ${W},${H}`;

  // TOUCH HIT AREAS (end-to-end full 180 CSS px gutter width, split cleanly along the 30° seam line):
  // Upper touch zone (L / R): from yTopOuter down to yTopInner along the full 180px width
  const leftUpperTouchPoly = `0,${yTopOuter} ${outerW},${yTopOuter + bevelOuter} ${outerW},${yTopInner + bevelOuter} 0,${yTopInner}`;
  // Lower touch zone (F): from yTopInner down to H along the full 180px width
  const leftLowerTouchPoly = `0,${yTopInner} ${outerW},${yTopInner + bevelOuter} ${outerW},${H} 0,${H}`;

  const rightUpperTouchPoly = `${W},${yTopOuter} ${W - outerW},${yTopOuter + bevelOuter} ${W - outerW},${yTopInner + bevelOuter} ${W},${yTopInner}`;
  const rightLowerTouchPoly = `${W},${yTopInner} ${W - outerW},${yTopInner + bevelOuter} ${W - outerW},${H} ${W},${H}`;

  // Label anchor positions in the exposed upper portion of L/R and inside F
  const lLabelX = Math.round(outerW * 0.46);
  const lLabelY = Math.round(yTopOuter + lExposedH * 0.62);
  const fLabelX = Math.round((pocketPad + innerW) * 0.46);
  const fLabelY = Math.round(H - fH * 0.38);

  return {
    W,
    H,
    stackH,
    outerW,
    innerW,
    riserWidthPx: outerW - innerW,
    fH,
    lExposedH,
    bevelOuter,
    bevelInner,
    yTopOuter,
    yTopInner,
    leftOuterVisualPoly,
    rightOuterVisualPoly,
    leftInnerVisualPoly,
    rightInnerVisualPoly,
    leftUpperTouchPoly,
    leftLowerTouchPoly,
    rightUpperTouchPoly,
    rightLowerTouchPoly,
    lLabelX,
    lLabelY,
    fLabelX,
    fLabelY,
  };
}

const CLOSEUP_W = 260;
const CLOSEUP_H = 420;
const stackHeightPx = $derived(
  viewportPreset === "Phone (852×393)" ? 248 : 340,
);
const closeup = $derived(
  buildNestedGeometry(CLOSEUP_W, CLOSEUP_H, stackHeightPx),
);

const stageDims = $derived(
  viewportPreset === "Phone (852×393)"
    ? { W: 852, H: 393, stackH: 248, topGutter: 32 }
    : { W: 1024, H: 768, stackH: 340, topGutter: 48 },
);
const stageGeo = $derived(
  buildNestedGeometry(stageDims.W, stageDims.H, stageDims.stackH),
);

// End-to-end touch hit-testing across the full 180 CSS px gutter width
function classifyTouchInStage(
  svgEl: SVGSVGElement,
  clientX: number,
  clientY: number,
): FlapCmd | null {
  const rect = svgEl.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  const x = ((clientX - rect.left) / rect.width) * stageGeo.W;
  const y = ((clientY - rect.top) / rect.height) * stageGeo.H;

  // Left 180 CSS px gutter: end-to-end split at the 30° seam y = yTopInner + x * TAN_30
  if (x >= 0 && x <= GUTTER_PX) {
    const topEdgeY = stageGeo.yTopOuter + x * TAN_30;
    const seamY = stageGeo.yTopInner + x * TAN_30;
    if (y >= seamY && y <= stageGeo.H) return "FL";
    if (y >= topEdgeY && y < seamY) return "L";
  }

  // Right 180 CSS px gutter: end-to-end split at the 30° seam y = yTopInner + (W - x) * TAN_30
  const dxRight = stageGeo.W - x;
  if (dxRight >= 0 && dxRight <= GUTTER_PX) {
    const topEdgeY = stageGeo.yTopOuter + dxRight * TAN_30;
    const seamY = stageGeo.yTopInner + dxRight * TAN_30;
    if (y >= seamY && y <= stageGeo.H) return "FR";
    if (y >= topEdgeY && y < seamY) return "R";
  }

  return null;
}

function handleStagePointerDown(event: PointerEvent) {
  const svgEl = event.currentTarget as SVGSVGElement;
  const cmd = classifyTouchInStage(svgEl, event.clientX, event.clientY);
  if (!cmd) return;
  event.preventDefault();
  svgEl.setPointerCapture(event.pointerId);
  setPointerCmd(event.pointerId, cmd);
}

function handleStagePointerMove(event: PointerEvent) {
  const svgEl = event.currentTarget as SVGSVGElement;
  const cmd = classifyTouchInStage(svgEl, event.clientX, event.clientY);
  hoverCmd = cmd;
  if (activePointers[event.pointerId] !== undefined && slideTransitions) {
    setPointerCmd(event.pointerId, cmd);
  }
}

function handleStagePointerUp(event: PointerEvent) {
  setPointerCmd(event.pointerId, null);
}
</script>

<div class="flap-bench">
  <section class="bench-controls" aria-label={label}>
    <div class="control-row">
      <div class="control-block">
        <span class="control-caption">
          02.4A Visual nesting of inner <code>F</code> tab inside outer
          <code>L / R</code>
          tab
        </span>
        <Toggle
          compact
          label="Visual nesting style"
          options={[...NESTING_OPTIONS]}
          bind:value={nestingMode}
        />
      </div>

      <div class="control-block">
        <span class="control-caption">
          02.4B Visual nested shapes vs. end-to-end touch areas
        </span>
        <Toggle
          compact
          label="Overlay mode"
          options={[...OVERLAY_OPTIONS]}
          bind:value={overlayMode}
        />
      </div>

      <div class="control-block">
        <span class="control-caption">Viewport height context</span>
        <Toggle
          compact
          label="Viewport preset"
          options={[...VIEWPORT_OPTIONS]}
          bind:value={viewportPreset}
        />
      </div>
    </div>

    <div class="control-row secondary">
      <div class="slider-block">
        <RingSlider
          label="Inner F tab width (% of 180px outer tab)"
          unit="%"
          digits={0}
          min={70}
          max={96}
          step={2}
          bind:value={fWidthInsetPct}
        />
      </div>

      <div class="slider-block">
        <RingSlider
          label="Inner F tab height (% of total tab height)"
          unit="%"
          digits={0}
          min={44}
          max={68}
          step={2}
          bind:value={fHeightSharePct}
        />
      </div>

      <label class="switch-block" for="slide-transitions-switch">
        <span class="switch-copy">
          <span class="switch-title">Thumb slide across seam</span>
          <span class="switch-sub">
            Slide thumb across the end-to-end seam to switch L/R ↔ F
          </span>
        </span>
        <Switch id="slide-transitions-switch" bind:checked={slideTransitions} />
      </label>
    </div>
  </section>

  <div class="bench-grid">
    <!-- Left column: 1:1 CSS-pixel scale close-up of the 180px left gutter -->
    <article class="inspector-card">
      <header class="card-header">
        <div>
          <h4>1:1 CSS-pixel left gutter close-up (<code>180 CSS px</code>)</h4>
          <span class="card-sub">
            Outer <code>L</code> tab (<code>{closeup.outerW}px</code>
            wide to bottom) · Inner nested <code>F</code> tab (<code
              >{closeup.innerW}px</code
            >
            wide, <code>{closeup.riserWidthPx}px</code> outer step)
          </span>
        </div>
      </header>

      <div class="closeup-wrap">
        <svg
          viewBox={`0 0 ${CLOSEUP_W} ${CLOSEUP_H}`}
          role="img"
          aria-label="1 to 1 CSS pixel close-up showing inner F tab nested visually inside outer L tab while touch zones meet end-to-end"
        >
          <rect
            x="0"
            y="0"
            width={CLOSEUP_W}
            height={CLOSEUP_H}
            fill="var(--color-void)"
          />

          <!-- 180 CSS px gutter boundary line -->
          <rect
            x="0"
            y="0"
            width={GUTTER_PX}
            height={CLOSEUP_H}
            fill="var(--color-action)"
            fill-opacity="0.03"
          />
          <line
            x1={GUTTER_PX}
            y1="0"
            x2={GUTTER_PX}
            y2={CLOSEUP_H}
            stroke="var(--color-action)"
            stroke-dasharray="6 6"
            stroke-opacity="0.55"
            stroke-width="1.5"
          />
          <text
            x={GUTTER_PX + 8}
            y="24"
            fill="var(--color-action)"
            font-size="11"
            font-family="var(--font-family-ui)"
          >
            180 CSS px
          </text>
          <text
            x={GUTTER_PX + 8}
            y="40"
            fill="var(--color-text-muted)"
            font-size="11"
            font-family="var(--font-family-ui)"
          >
            gutter edge
          </text>

          <!-- VISUAL SHAPES: Outer L tab extends all the way to bottom (H), Inner F tab sits inside it -->
          <g class:is-faint={overlayMode === "Touch areas only (end-to-end)"}>
            <!-- Outer L tab (full 180px width, runs to bottom of screen) -->
            <polygon
              points={closeup.leftOuterVisualPoly}
              class="flap-outer"
              class:is-hovered={hoverCmd === "L"}
              class:is-active={isLActive}
              class:is-parent-coupled={isFLActive}
            />

            <!-- Inner nested F tab (inset width innerW, nested inside lower corner of L) -->
            <polygon
              points={closeup.leftInnerVisualPoly}
              class="flap-inner"
              class:is-hovered={hoverCmd === "FL"}
              class:is-active={isFLActive}
            />
          </g>

          <!-- END-TO-END TOUCH PARTITION OVERLAY -->
          <g class:is-hidden={overlayMode === "Visual nested tabs"}>
            <!-- Upper touch zone (L) across full 180px width -->
            <polygon
              points={closeup.leftUpperTouchPoly}
              class="touch-zone-upper"
              class:show-fill={overlayMode === "Touch areas only (end-to-end)"}
            />
            <!-- Lower touch zone (F) across full 180px width (includes the 18px outer riser strip) -->
            <polygon
              points={closeup.leftLowerTouchPoly}
              class="touch-zone-lower"
              class:show-fill={overlayMode === "Touch areas only (end-to-end)"}
            />
            <!-- The single end-to-end 30° touch split line across the full 180px gutter -->
            <line
              x1="0"
              y1={closeup.yTopInner}
              x2={closeup.outerW}
              y2={closeup.yTopInner + closeup.bevelOuter}
              stroke="var(--color-caution-tape)"
              stroke-dasharray="5 4"
              stroke-width="2"
            />
            <text
              x={closeup.outerW + 6}
              y={closeup.yTopInner + closeup.bevelOuter + 4}
              fill="var(--color-caution-tape)"
              font-size="10"
              font-family="var(--font-family-ui)"
            >
              ← end-to-end touch split
            </text>
          </g>

          <!-- Callout for the visual nesting step (outer L rim wrapping F) -->
          <text
            x="12"
            y={closeup.yTopOuter - 10}
            fill="var(--color-text-muted)"
            font-size="11"
            font-family="var(--font-family-ui)"
          >
            Outer L tab: {closeup.outerW}px wide × {closeup.stackH}px tall
          </text>
          <text
            x="12"
            y={closeup.yTopOuter - 26}
            fill="var(--color-selected)"
            font-size="11"
            font-family="var(--font-family-ui)"
          >
            Inner F tab: {closeup.innerW}px wide ({closeup.riserWidthPx}px
            nested step)
          </text>

          <!-- Labels -->
          <text
            x={closeup.lLabelX}
            y={closeup.lLabelY}
            text-anchor="middle"
            dominant-baseline="middle"
            class="flap-glyph"
          >
            L
          </text>
          <text
            x={closeup.fLabelX}
            y={closeup.fLabelY}
            text-anchor="middle"
            dominant-baseline="middle"
            class="flap-glyph"
          >
            F
          </text>
        </svg>
      </div>

      <dl class="closeup-metrics">
        <div>
          <dt>Visual hierarchy (nested)</dt>
          <dd>
            Outer <code>L</code> tab spans <code>0..{closeup.outerW}px</code> to
            the bottom; <code>F</code> (<code>0..{closeup.innerW}px</code>) sits
            visually inside <code>L</code> with a
            <code>{closeup.riserWidthPx} CSS px</code>
            outer rim.
          </dd>
        </div>
        <div>
          <dt>Touch hit-boxes (end-to-end)</dt>
          <dd>
            One 30° line splits the full <code>180 CSS px</code> width cleanly
            into upper <code>L</code> and lower <code>F</code>—no dead zones or
            sliver misses on the <code>{closeup.riserWidthPx}px</code> rim.
          </dd>
        </div>
      </dl>
    </article>

    <!-- Right column: Full interactive two-gutter stage -->
    <article class="stage-card">
      <header class="card-header">
        <div>
          <h4>
            Interactive stage (<code>{stageGeo.W} × {stageGeo.H} CSS px</code>)
          </h4>
          <span class="card-sub">
            Press &amp; drag across <code>L/R</code> and nested <code>F</code>
            (or hold <code>A</code> / <code>D</code> / <code>W</code>)
          </span>
        </div>

        <div class="thruster-readout" aria-live="polite">
          <span class="thruster-pill" class:firing={leftThrusterFiring}>
            LEFT ENGINE: {leftThrusterFiring ? "FIRING" : "IDLE"}
          </span>
          <span class="thruster-pill" class:firing={rightThrusterFiring}>
            RIGHT ENGINE: {rightThrusterFiring ? "FIRING" : "IDLE"}
          </span>
        </div>
      </header>

      <div class="interactive-stage-wrap">
        <svg
          class="interactive-stage-svg"
          viewBox={`0 0 ${stageGeo.W} ${stageGeo.H}`}
          role="img"
          aria-label="Interactive flight stage with F nested visually inside L and R while touch zones meet end to end"
          onpointerdown={handleStagePointerDown}
          onpointermove={handleStagePointerMove}
          onpointerup={handleStagePointerUp}
          onpointercancel={handleStagePointerUp}
          onlostpointercapture={handleStagePointerUp}
          onpointerleave={() => {
            hoverCmd = null;
          }}
        >
          <rect
            x="0"
            y="0"
            width={stageGeo.W}
            height={stageGeo.H}
            fill="var(--color-void)"
          />

          <!-- Top HUD bars -->
          <text
            x="24"
            y="32"
            fill="var(--color-text-muted)"
            font-size="12"
            font-family="var(--font-family-ui)"
          >
            HULL 100% · POWER 94%
          </text>
          <text
            x={stageGeo.W - 24}
            y="32"
            text-anchor="end"
            fill="var(--color-text-muted)"
            font-size="12"
            font-family="var(--font-family-ui)"
          >
            SURVIVAL 42.8s
          </text>

          <!-- 180 CSS px side gutters & central fly area -->
          <rect
            x="0"
            y="0"
            width={GUTTER_PX}
            height={stageGeo.H}
            fill="var(--color-action)"
            fill-opacity="0.03"
          />
          <rect
            x={stageGeo.W - GUTTER_PX}
            y="0"
            width={GUTTER_PX}
            height={stageGeo.H}
            fill="var(--color-action)"
            fill-opacity="0.03"
          />
          <rect
            x={GUTTER_PX}
            y={stageDims.topGutter}
            width={stageGeo.W - GUTTER_PX * 2}
            height={stageGeo.H - stageDims.topGutter * 2}
            fill="none"
            stroke="var(--color-action)"
            stroke-dasharray="6 6"
            stroke-opacity="0.45"
            stroke-width="1.5"
          />

          <!-- Central arena star + ship preview -->
          <circle
            cx={stageGeo.W / 2}
            cy={stageGeo.H / 2}
            r={Math.min(
              stageGeo.W - GUTTER_PX * 2,
              stageGeo.H - stageDims.topGutter * 2,
            ) * 0.42}
            fill="none"
            stroke="var(--color-border)"
            stroke-width="1.5"
          />
          <circle
            cx={stageGeo.W / 2}
            cy={stageGeo.H / 2}
            r="26"
            fill="var(--color-caution-tape)"
          />

          <!-- Ship silhouette with live left/right engine plumes -->
          <g transform={`translate(${stageGeo.W / 2}, ${stageGeo.H * 0.34})`}>
            <polygon
              class:is-hidden={!leftThrusterFiring}
              points="-12,18 -4,18 -8,46"
              fill="var(--color-brand)"
            />
            <polygon
              class:is-hidden={!rightThrusterFiring}
              points="4,18 12,18 8,46"
              fill="var(--color-brand)"
            />
            <polygon
              points="0,-20 16,18 6,14 -6,14 -16,18"
              fill="var(--color-elev-3)"
              stroke="var(--color-text)"
              stroke-width="1.5"
            />
          </g>

          <!-- LEFT GUTTER: Outer L tab + Nested Inner F tab -->
          <g class:is-faint={overlayMode === "Touch areas only (end-to-end)"}>
            <polygon
              points={stageGeo.leftOuterVisualPoly}
              class="flap-outer"
              class:is-hovered={hoverCmd === "L"}
              class:is-active={isLActive}
              class:is-parent-coupled={isFLActive}
            />
            <polygon
              points={stageGeo.leftInnerVisualPoly}
              class="flap-inner"
              class:is-hovered={hoverCmd === "FL"}
              class:is-active={isFLActive}
            />

            <!-- RIGHT GUTTER: Outer R tab + Nested Inner F tab -->
            <polygon
              points={stageGeo.rightOuterVisualPoly}
              class="flap-outer"
              class:is-hovered={hoverCmd === "R"}
              class:is-active={isRActive}
              class:is-parent-coupled={isFRActive}
            />
            <polygon
              points={stageGeo.rightInnerVisualPoly}
              class="flap-inner"
              class:is-hovered={hoverCmd === "FR"}
              class:is-active={isFRActive}
            />
          </g>

          <!-- END-TO-END TOUCH SEAM OVERLAY ON STAGE -->
          <g class:is-hidden={overlayMode === "Visual nested tabs"}>
            <polygon
              points={stageGeo.leftUpperTouchPoly}
              class="touch-zone-upper"
              class:show-fill={overlayMode === "Touch areas only (end-to-end)"}
            />
            <polygon
              points={stageGeo.leftLowerTouchPoly}
              class="touch-zone-lower"
              class:show-fill={overlayMode === "Touch areas only (end-to-end)"}
            />
            <line
              x1="0"
              y1={stageGeo.yTopInner}
              x2={stageGeo.outerW}
              y2={stageGeo.yTopInner + stageGeo.bevelOuter}
              stroke="var(--color-caution-tape)"
              stroke-dasharray="5 4"
              stroke-width="2"
            />

            <polygon
              points={stageGeo.rightUpperTouchPoly}
              class="touch-zone-upper"
              class:show-fill={overlayMode === "Touch areas only (end-to-end)"}
            />
            <polygon
              points={stageGeo.rightLowerTouchPoly}
              class="touch-zone-lower"
              class:show-fill={overlayMode === "Touch areas only (end-to-end)"}
            />
            <line
              x1={stageGeo.W}
              y1={stageGeo.yTopInner}
              x2={stageGeo.W - stageGeo.outerW}
              y2={stageGeo.yTopInner + stageGeo.bevelOuter}
              stroke="var(--color-caution-tape)"
              stroke-dasharray="5 4"
              stroke-width="2"
            />
          </g>

          <!-- Glyphs -->
          <text
            x={stageGeo.lLabelX}
            y={stageGeo.lLabelY}
            text-anchor="middle"
            dominant-baseline="middle"
            class="flap-glyph"
          >
            L
          </text>
          <text
            x={stageGeo.fLabelX}
            y={stageGeo.fLabelY}
            text-anchor="middle"
            dominant-baseline="middle"
            class="flap-glyph"
          >
            F
          </text>

          <text
            x={stageGeo.W - stageGeo.lLabelX}
            y={stageGeo.lLabelY}
            text-anchor="middle"
            dominant-baseline="middle"
            class="flap-glyph"
          >
            R
          </text>
          <text
            x={stageGeo.W - stageGeo.fLabelX}
            y={stageGeo.fLabelY}
            text-anchor="middle"
            dominant-baseline="middle"
            class="flap-glyph"
          >
            F
          </text>
        </svg>
      </div>
    </article>
  </div>
</div>

<style>
.flap-bench {
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
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  align-items: flex-end;
}

.control-row.secondary {
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--color-border-subtle);
  align-items: center;
}

.control-block {
  display: grid;
  gap: var(--spacing-xs);
}

.control-caption {
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
}

.slider-block {
  flex: 1 1 220px;
  min-width: 200px;
}

.switch-block {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
}

.switch-copy {
  display: grid;
  gap: 2px;
}

.switch-title {
  font-size: var(--font-size-caption);
  color: var(--color-text);
}

.switch-sub {
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
}

.bench-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: var(--spacing-md);
  align-items: start;
}

.inspector-card,
.stage-card {
  display: grid;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-elev-1);
  border: 1px solid var(--color-border);
}

.card-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.card-header h4 {
  margin: 0;
  font-size: var(--font-size-body);
  color: var(--color-text);
}

.card-sub {
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
}

.closeup-wrap {
  width: 260px;
  margin: 0 auto;
  border: 1px solid var(--color-border);
  background: var(--color-void);
}

.closeup-wrap svg {
  width: 100%;
  display: block;
}

.closeup-metrics {
  margin: 0;
  display: grid;
  gap: var(--spacing-xs);
  padding-top: var(--spacing-xs);
  border-top: 1px solid var(--color-border-subtle);
}

.closeup-metrics dt {
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
}

.closeup-metrics dd {
  margin: 2px 0 0;
  font-size: var(--font-size-caption);
  color: var(--color-text);
}

.thruster-readout {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.thruster-pill {
  padding: 2px var(--spacing-sm);
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  background: var(--color-void);
}

.thruster-pill.firing {
  color: var(--color-on-brand);
  background: var(--color-selected);
  border-color: var(--color-selected);
  font-weight: var(--font-weight-bold);
}

.interactive-stage-wrap {
  border: 1px solid var(--color-border);
  background: var(--color-void);
  overflow: hidden;
}

.interactive-stage-svg {
  width: 100%;
  display: block;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  cursor: pointer;
}

/* Outer L / R tab (extends to bottom of screen, encloses F visually) */
.flap-outer {
  fill: color-mix(in lch, var(--color-selected) 22%, var(--color-void));
  stroke: color-mix(in lch, var(--color-selected) 52%, transparent);
  stroke-width: 1.5;
  transition:
    fill var(--duration-fast) var(--ease-standard),
    stroke var(--duration-fast) var(--ease-standard);
}

/* Inner F tab nested visually inside the lower corner of L / R */
.flap-inner {
  fill: color-mix(in lch, var(--color-selected) 40%, var(--color-void));
  stroke: var(--color-selected);
  stroke-width: 2;
  transition:
    fill var(--duration-fast) var(--ease-standard),
    stroke var(--duration-fast) var(--ease-standard);
}

.flap-outer.is-hovered:not(.is-active),
.flap-inner.is-hovered:not(.is-active) {
  filter: brightness(1.18);
}

/* When F is pressed, L/R is part of the forward burn, so the outer parent tab also highlights its border */
.flap-outer.is-parent-coupled {
  fill: color-mix(in lch, var(--color-selected) 32%, var(--color-void));
  stroke: var(--color-selected);
}

.flap-outer.is-active,
.flap-inner.is-active {
  fill: color-mix(in lch, var(--color-selected) 68%, var(--color-void));
  stroke: var(--color-selected);
}

.touch-zone-upper,
.touch-zone-lower {
  fill: transparent;
  stroke: none;
  pointer-events: none;
}

.touch-zone-upper.show-fill {
  fill: color-mix(in lch, var(--color-action) 18%, transparent);
  stroke: var(--color-action);
  stroke-width: 1.5;
}

.touch-zone-lower.show-fill {
  fill: color-mix(in lch, var(--color-caution-tape) 22%, transparent);
  stroke: var(--color-caution-tape);
  stroke-width: 1.5;
}

.is-faint {
  opacity: 0.25;
}

.flap-glyph {
  fill: var(--color-text);
  font-family: var(--font-family-ui);
  font-size: 28px;
  font-weight: var(--font-weight-bold);
  pointer-events: none;
}

.is-hidden {
  display: none;
}
</style>
