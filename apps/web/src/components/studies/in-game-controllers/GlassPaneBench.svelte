<script lang="ts">
import { onMount } from "svelte";
import RingSlider from "../../inputs/RingSlider.svelte";
import Toggle from "../../inputs/Toggle.svelte";

interface Props {
  label?: string;
}

const {
  label = "02.6 Borderless translucent blue-glass panes, yellow-glass active tint, and technical text color explorer",
}: Props = $props();

const TEXT_INK_OPTIONS = [
  "A · White (--color-text)",
  "B · Android green (--color-android-green)",
  "C · Full brand (--color-brand)",
] as const;

const OVERLAP_MODEL_OPTIONS = [
  "Overlapping glass panes (F stacks over L/R)",
  "Disjoint non-overlapping panes",
] as const;

let textInkMode = $state<string>("A · White (--color-text)");
let overlapModel = $state<string>("Disjoint non-overlapping panes");
let restingUpperBluePct = $state(22);
let restingLowerBluePct = $state(36);
let activeUpperBrandPct = $state(9);
let activeLowerBrandPct = $state(16);
let restingTextAlphaPct = $state(78);
let showBorderLines = $state(false);

// Settled 02.3 & 02.4 geometry constants:
// 180 CSS px side gutter, 30° slope (tan 30°), F = 84% outer width (151px) & 54% stack height
const GUTTER_PX = 180;
const STACK_H = 320;
const F_WIDTH_RATIO = 0.84;
const F_HEIGHT_RATIO = 0.54;
const TAN_30 = Math.tan(Math.PI / 6);

const INNER_W = Math.round(GUTTER_PX * F_WIDTH_RATIO); // 151 CSS px
const F_H = Math.round(STACK_H * F_HEIGHT_RATIO); // 173 CSS px
const BEVEL_OUTER = Math.round(GUTTER_PX * TAN_30); // 104 CSS px
const BEVEL_INNER = Math.round(INNER_W * TAN_30); // 87 CSS px

type FlapCmd = "L" | "R" | "FL" | "FR";
let activePointers = $state<Record<number, FlapCmd>>({});
let activeKeys = $state<Record<string, boolean>>({});
let simState = $state<string>("Live input");

const SIM_OPTIONS = [
  "Live input",
  "Turn left (L)",
  "Forward burn (F)",
  "Forward + Left (F + L)",
] as const;

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
      simState = "Live input";
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

// Independent pad highlight logic:
// - L highlights ONLY when L is explicitly active (pointer on L, KeyA/ArrowLeft, or simState "Turn left" / "Forward + Left")
// - R highlights ONLY when R is explicitly active (pointer on R, KeyD/ArrowRight)
// - F (both lower pads) highlights when F is active (pointer on FL or FR, KeyW/ArrowUp, or simState "Forward burn" / "Forward + Left")
const isLPadLit = $derived(
  simState === "Turn left (L)" ||
    simState === "Forward + Left (F + L)" ||
    (simState === "Live input" &&
      (Object.values(activePointers).includes("L") ||
        Boolean(activeKeys.KeyA || activeKeys.ArrowLeft))),
);

const isRPadLit = $derived(
  simState === "Live input" &&
    (Object.values(activePointers).includes("R") ||
      Boolean(activeKeys.KeyD || activeKeys.ArrowRight)),
);

const isFPadLit = $derived(
  simState === "Forward burn (F)" ||
    simState === "Forward + Left (F + L)" ||
    (simState === "Live input" &&
      (Object.values(activePointers).includes("FL") ||
        Object.values(activePointers).includes("FR") ||
        Boolean(activeKeys.KeyW || activeKeys.ArrowUp))),
);

const leftThrusterFiring = $derived(isLPadLit || isFPadLit);
const rightThrusterFiring = $derived(isRPadLit || isFPadLit);

function buildStagePolygons(W: number, H: number) {
  const yTopOuter = H - STACK_H;
  const yTopInner = H - F_H;

  // Full outer L/R polygon (0..180, extends to bottom H so F overlaps on top of it)
  const leftOuterFullPoly = `0,${yTopOuter} ${GUTTER_PX},${yTopOuter + BEVEL_OUTER} ${GUTTER_PX},${H} 0,${H}`;
  // Disjoint outer L/R polygon (carves out F so only the L-shaped upper + 29px outer rim is drawn)
  const leftOuterDisjointPoly = `0,${yTopOuter} ${GUTTER_PX},${yTopOuter + BEVEL_OUTER} ${GUTTER_PX},${H} ${INNER_W},${H} ${INNER_W},${yTopInner + BEVEL_INNER} 0,${yTopInner}`;
  // Corner-nested F polygon (0..151, extends to bottom H)
  const leftInnerPoly = `0,${yTopInner} ${INNER_W},${yTopInner + BEVEL_INNER} ${INNER_W},${H} 0,${H}`;

  const rightOuterFullPoly = `${W},${yTopOuter} ${W - GUTTER_PX},${yTopOuter + BEVEL_OUTER} ${W - GUTTER_PX},${H} ${W},${H}`;
  const rightOuterDisjointPoly = `${W},${yTopOuter} ${W - GUTTER_PX},${yTopOuter + BEVEL_OUTER} ${W - GUTTER_PX},${H} ${W - INNER_W},${H} ${W - INNER_W},${yTopInner + BEVEL_INNER} ${W},${yTopInner}`;
  const rightInnerPoly = `${W},${yTopInner} ${W - INNER_W},${yTopInner + BEVEL_INNER} ${W - INNER_W},${H} ${W},${H}`;

  // Both labels share the exact same horizontal distance to the outer screen border (72 CSS px)
  // and TURN sits lower inside the slanted upper L/R corridor (midway between top and bottom slopes at x = 72)
  const labelBorderOffsetPx = 72;
  const lMarkX = labelBorderOffsetPx;
  const fMarkX = labelBorderOffsetPx;
  const lMidSlopeY = Math.round(
    (yTopOuter + yTopInner) / 2 + labelBorderOffsetPx * TAN_30,
  );
  const lMarkY = lMidSlopeY + 4;
  const fMarkY = Math.round(H - F_H * 0.36);

  return {
    W,
    H,
    yTopOuter,
    yTopInner,
    leftOuterPoly: overlapModel.startsWith("Overlapping")
      ? leftOuterFullPoly
      : leftOuterDisjointPoly,
    leftInnerPoly,
    rightOuterPoly: overlapModel.startsWith("Overlapping")
      ? rightOuterFullPoly
      : rightOuterDisjointPoly,
    rightInnerPoly,
    lMarkX,
    lMarkY,
    fMarkX,
    fMarkY,
  };
}

const CLOSEUP_W = 240;
const CLOSEUP_H = 380;
const closeup = $derived(buildStagePolygons(CLOSEUP_W, CLOSEUP_H));

const STAGE_W = 1024;
const STAGE_H = 680;
const stage = $derived(buildStagePolygons(STAGE_W, STAGE_H));

// Resting bluish glass fill vs Active yellow-brand glass fill:
// Lower F pane is denser (more blue when resting, more yellow when pressed) than upper L/R pane
const restingUpperBlueGlass = $derived(
  `color-mix(in lch, var(--color-elev-3) ${restingUpperBluePct}%, transparent)`,
);
const restingLowerBlueGlass = $derived(
  `color-mix(in lch, var(--color-elev-3) ${restingLowerBluePct}%, transparent)`,
);

const activeUpperYellowGlass = $derived(
  `color-mix(in lch, var(--color-selected) ${activeUpperBrandPct}%, transparent)`,
);
const activeLowerYellowGlass = $derived(
  `color-mix(in lch, var(--color-selected) ${activeLowerBrandPct}%, transparent)`,
);

const padStroke = $derived(showBorderLines ? "var(--color-border)" : "none");

const baseTextToken = $derived(
  textInkMode.startsWith("A ·")
    ? "var(--color-text)"
    : textInkMode.startsWith("B ·")
      ? "var(--color-android-green)"
      : "var(--color-brand)",
);

function getTextColor(isLit: boolean) {
  if (isLit) {
    return textInkMode.startsWith("A ·")
      ? "var(--color-text)"
      : textInkMode.startsWith("B ·")
        ? "var(--color-android-green)"
        : "var(--color-brand)";
  }
  return `color-mix(in lch, ${baseTextToken} ${restingTextAlphaPct}%, transparent)`;
}

function getSubTextColor(isLit: boolean) {
  if (isLit) {
    return `color-mix(in lch, ${baseTextToken} 90%, transparent)`;
  }
  return `color-mix(in lch, ${baseTextToken} ${Math.max(40, restingTextAlphaPct - 18)}%, transparent)`;
}

// End-to-end hit-test across the 180 CSS px gutter
function classifyStagePoint(
  svgEl: SVGSVGElement,
  clientX: number,
  clientY: number,
): FlapCmd | null {
  const rect = svgEl.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  const x = ((clientX - rect.left) / rect.width) * stage.W;
  const y = ((clientY - rect.top) / rect.height) * stage.H;

  if (x >= 0 && x <= GUTTER_PX) {
    const topEdgeY = stage.yTopOuter + x * TAN_30;
    const seamY = stage.yTopInner + x * TAN_30;
    if (y >= seamY && y <= stage.H) return "FL";
    if (y >= topEdgeY && y < seamY) return "L";
  }

  const dxRight = stage.W - x;
  if (dxRight >= 0 && dxRight <= GUTTER_PX) {
    const topEdgeY = stage.yTopOuter + dxRight * TAN_30;
    const seamY = stage.yTopInner + dxRight * TAN_30;
    if (y >= seamY && y <= stage.H) return "FR";
    if (y >= topEdgeY && y < seamY) return "R";
  }

  return null;
}

function handlePointerDown(event: PointerEvent) {
  const svgEl = event.currentTarget as SVGSVGElement;
  const cmd = classifyStagePoint(svgEl, event.clientX, event.clientY);
  if (!cmd) return;
  event.preventDefault();
  simState = "Live input";
  svgEl.setPointerCapture(event.pointerId);
  setPointerCmd(event.pointerId, cmd);
}

function handlePointerMove(event: PointerEvent) {
  if (activePointers[event.pointerId] !== undefined) {
    const svgEl = event.currentTarget as SVGSVGElement;
    const cmd = classifyStagePoint(svgEl, event.clientX, event.clientY);
    setPointerCmd(event.pointerId, cmd);
  }
}

function handlePointerUp(event: PointerEvent) {
  setPointerCmd(event.pointerId, null);
}
</script>

<div class="glass-bench">
  <section class="bench-controls" aria-label={label}>
    <div class="control-stack">
      <div class="control-block">
        <span class="control-caption">
          02.6A Technical marking ink (arrow + text)
        </span>
        <Toggle
          label="Technical marking ink"
          options={[...TEXT_INK_OPTIONS]}
          bind:value={textInkMode}
        />
      </div>

      <div class="control-block">
        <span class="control-caption">
          02.6B Inspect independent active pad states (or press pads / keys
          <code>A</code>, <code>D</code>, <code>W</code>)
        </span>
        <Toggle
          label="Active state simulation"
          options={[...SIM_OPTIONS]}
          bind:value={simState}
        />
      </div>

      <div class="control-block">
        <span class="control-caption">02.6C Pane layering model</span>
        <Toggle
          label="Pane layering model"
          options={[...OVERLAP_MODEL_OPTIONS]}
          bind:value={overlapModel}
        />
      </div>
    </div>

    <div class="slider-row">
      <div class="slider-item">
        <RingSlider
          label="Upper L/R resting blue"
          unit="%"
          digits={0}
          min={10}
          max={45}
          step={2}
          bind:value={restingUpperBluePct}
        />
      </div>

      <div class="slider-item">
        <RingSlider
          label="Lower F resting blue (denser)"
          unit="%"
          digits={0}
          min={16}
          max={60}
          step={2}
          bind:value={restingLowerBluePct}
        />
      </div>

      <div class="slider-item">
        <RingSlider
          label="Upper L/R active yellow (thin wash)"
          unit="%"
          digits={0}
          min={3}
          max={30}
          step={1}
          bind:value={activeUpperBrandPct}
        />
      </div>

      <div class="slider-item">
        <RingSlider
          label="Lower F active yellow (denser wash)"
          unit="%"
          digits={0}
          min={5}
          max={35}
          step={1}
          bind:value={activeLowerBrandPct}
        />
      </div>
    </div>
  </section>

  <div class="bench-layout">
    <!-- Left card: 1:1 CSS pixel close-up -->
    <article class="closeup-card">
      <header class="card-header">
        <div>
          <h4>1:1 CSS-pixel close-up</h4>
          <span class="card-sub">
            Disjoint panes · Upper <code>{restingUpperBluePct}%</code> / Lower
            <code>{restingLowerBluePct}%</code>
            blue
          </span>
        </div>
      </header>

      <div class="closeup-frame">
        <svg
          viewBox={`0 0 ${CLOSEUP_W} ${CLOSEUP_H}`}
          role="img"
          aria-label="1 to 1 CSS pixel close-up of borderless translucent glass panes with technical text markings"
        >
          <rect
            x="0"
            y="0"
            width={CLOSEUP_W}
            height={CLOSEUP_H}
            fill="var(--color-void)"
          />

          <!-- Stars & orbit lines passing clearly behind the very translucent glass panes -->
          <circle cx="48" cy="110" r="1.4" fill="var(--color-text)" />
          <circle cx="118" cy="165" r="1.6" fill="var(--color-text)" />
          <circle cx="62" cy="230" r="1.3" fill="var(--color-text-muted)" />
          <circle cx="132" cy="275" r="1.8" fill="var(--color-caution-tape)" />
          <circle cx="88" cy="335" r="1.4" fill="var(--color-text)" />
          <circle cx="158" cy="340" r="1.3" fill="var(--color-text-muted)" />
          <circle
            cx="280"
            cy="210"
            r="215"
            fill="none"
            stroke="var(--color-grid)"
            stroke-dasharray="4 5"
            stroke-opacity="0.55"
            stroke-width="1.2"
          />

          <!-- Outer L pane -->
          <polygon
            points={closeup.leftOuterPoly}
            fill={isLPadLit ? activeUpperYellowGlass : restingUpperBlueGlass}
            stroke={padStroke}
            stroke-width="1"
          />

          <!-- Corner-nested F pane -->
          <polygon
            points={closeup.leftInnerPoly}
            fill={isFPadLit ? activeLowerYellowGlass : restingLowerBlueGlass}
            stroke={padStroke}
            stroke-width="1"
          />

          <!-- Technical arrow + text markings on L and F -->
          <text
            x={closeup.lMarkX}
            y={closeup.lMarkY - 7}
            text-anchor="middle"
            dominant-baseline="middle"
            fill={getTextColor(isLPadLit)}
            class="mark-code"
          >
            ◀ TURN
          </text>
          <text
            x={closeup.lMarkX}
            y={closeup.lMarkY + 10}
            text-anchor="middle"
            dominant-baseline="middle"
            fill={getSubTextColor(isLPadLit)}
            class="mark-sub"
          >
            LEFT ENGINE
          </text>

          <text
            x={closeup.fMarkX}
            y={closeup.fMarkY - 7}
            text-anchor="middle"
            dominant-baseline="middle"
            fill={getTextColor(isFPadLit)}
            class="mark-code"
          >
            ▲ BURN
          </text>
          <text
            x={closeup.fMarkX}
            y={closeup.fMarkY + 10}
            text-anchor="middle"
            dominant-baseline="middle"
            fill={getSubTextColor(isFPadLit)}
            class="mark-sub"
          >
            BOTH ENGINES
          </text>
        </svg>
      </div>
    </article>

    <!-- Right card: Full stage preview -->
    <article class="stage-card">
      <header class="card-header">
        <div>
          <h4>
            In-game stage preview (<code>1024 × 680</code>) — press pads or hold
            <code>A</code>
            / <code>D</code> / <code>W</code>
          </h4>
          <span class="card-sub">
            Notice how pressing <code>L</code> lights only <code>L</code>,
            pressing <code>F</code> lights only the lower <code>F</code> pads,
            and pressing <code>F + L</code> lights both
          </span>
        </div>

        <div class="thruster-readout" aria-live="polite">
          <span class="thruster-pill" class:firing={leftThrusterFiring}>
            L THRUSTER: {leftThrusterFiring ? "ON" : "OFF"}
          </span>
          <span class="thruster-pill" class:firing={rightThrusterFiring}>
            R THRUSTER: {rightThrusterFiring ? "ON" : "OFF"}
          </span>
        </div>
      </header>

      <div class="stage-frame">
        <svg
          class="stage-svg"
          viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
          role="img"
          aria-label="In-game flight stage with borderless translucent blue and yellow glass pads"
          onpointerdown={handlePointerDown}
          onpointermove={handlePointerMove}
          onpointerup={handlePointerUp}
          onpointercancel={handlePointerUp}
          onlostpointercapture={handlePointerUp}
        >
          <rect
            x="0"
            y="0"
            width={STAGE_W}
            height={STAGE_H}
            fill="var(--color-void)"
          />

          <!-- Starfield across the stage and directly behind the translucent glass pads -->
          <circle cx="88" cy="180" r="1.3" fill="var(--color-text-muted)" />
          <circle cx="118" cy="440" r="1.5" fill="var(--color-text)" />
          <circle cx="64" cy="540" r="1.4" fill="var(--color-text)" />
          <circle cx="135" cy="610" r="1.6" fill="var(--color-caution-tape)" />
          <circle cx="310" cy="140" r="1.3" fill="var(--color-text-muted)" />
          <circle cx="740" cy="160" r="1.3" fill="var(--color-text-muted)" />
          <circle cx="910" cy="220" r="1.3" fill="var(--color-text-muted)" />
          <circle cx="916" cy="450" r="1.5" fill="var(--color-text)" />
          <circle cx="948" cy="545" r="1.4" fill="var(--color-text)" />
          <circle cx="892" cy="620" r="1.5" fill="var(--color-caution-tape)" />

          <!-- Central star & orbital rings -->
          <circle
            cx={STAGE_W / 2}
            cy={STAGE_H / 2}
            r="245"
            fill="none"
            stroke="var(--color-border-subtle)"
            stroke-width="1"
          />
          <circle
            cx={STAGE_W / 2}
            cy={STAGE_H / 2}
            r="150"
            fill="none"
            stroke="var(--color-border-faint)"
            stroke-dasharray="4 6"
            stroke-width="1"
          />
          <circle
            cx={STAGE_W / 2}
            cy={STAGE_H / 2}
            r="34"
            fill="var(--color-caution-tape)"
          />

          <!-- Top HUD -->
          <g transform="translate(28, 28)">
            <text
              x="0"
              y="0"
              fill="var(--color-text-muted)"
              font-size="11"
              font-family="var(--font-family-ui)"
            >
              HULL
            </text>
            <text
              x="0"
              y="22"
              fill="var(--color-text)"
              font-size="18"
              font-weight="700"
              font-family="var(--font-family-ui)"
            >
              100%
            </text>
            <rect
              x="0"
              y="30"
              width="96"
              height="4"
              fill="var(--color-resource-hull)"
            />

            <text
              x="124"
              y="0"
              fill="var(--color-text-muted)"
              font-size="11"
              font-family="var(--font-family-ui)"
            >
              POWER
            </text>
            <text
              x="124"
              y="22"
              fill="var(--color-text)"
              font-size="18"
              font-weight="700"
              font-family="var(--font-family-ui)"
            >
              92%
            </text>
            <rect
              x="124"
              y="30"
              width="88"
              height="4"
              fill="var(--color-resource-power)"
            />
          </g>

          <g transform={`translate(${STAGE_W - 28}, 28)`}>
            <text
              x="0"
              y="0"
              text-anchor="end"
              fill="var(--color-text-muted)"
              font-size="11"
              font-family="var(--font-family-ui)"
            >
              SURVIVAL
            </text>
            <text
              x="0"
              y="22"
              text-anchor="end"
              fill="var(--color-text)"
              font-size="18"
              font-weight="700"
              font-family="var(--font-family-ui)"
            >
              42.8s
            </text>
          </g>

          <!-- Ship in orbit with live thruster plumes -->
          <g transform={`translate(${STAGE_W * 0.5}, ${STAGE_H * 0.3})`}>
            <polygon
              class:is-hidden={!leftThrusterFiring}
              points="-11,16 -4,16 -7.5,44"
              fill="var(--color-brand)"
            />
            <polygon
              class:is-hidden={!rightThrusterFiring}
              points="4,16 11,16 7.5,44"
              fill="var(--color-brand)"
            />
            <polygon
              points="0,-18 15,16 5,12 -5,12 -15,16"
              fill="var(--color-elev-3)"
              stroke="var(--color-text)"
              stroke-width="1.5"
            />
          </g>

          <!-- LEFT GUTTER GLASS PANES (L + corner-nested F) -->
          <polygon
            points={stage.leftOuterPoly}
            fill={isLPadLit ? activeUpperYellowGlass : restingUpperBlueGlass}
            stroke={padStroke}
            stroke-width="1"
          />
          <polygon
            points={stage.leftInnerPoly}
            fill={isFPadLit ? activeLowerYellowGlass : restingLowerBlueGlass}
            stroke={padStroke}
            stroke-width="1"
          />

          <!-- RIGHT GUTTER GLASS PANES (R + corner-nested F) -->
          <polygon
            points={stage.rightOuterPoly}
            fill={isRPadLit ? activeUpperYellowGlass : restingUpperBlueGlass}
            stroke={padStroke}
            stroke-width="1"
          />
          <polygon
            points={stage.rightInnerPoly}
            fill={isFPadLit ? activeLowerYellowGlass : restingLowerBlueGlass}
            stroke={padStroke}
            stroke-width="1"
          />

          <!-- TECHNICAL ARROW + TEXT MARKINGS -->
          <text
            x={stage.lMarkX}
            y={stage.lMarkY - 7}
            text-anchor="middle"
            dominant-baseline="middle"
            fill={getTextColor(isLPadLit)}
            class="mark-code"
          >
            ◀ TURN
          </text>
          <text
            x={stage.lMarkX}
            y={stage.lMarkY + 10}
            text-anchor="middle"
            dominant-baseline="middle"
            fill={getSubTextColor(isLPadLit)}
            class="mark-sub"
          >
            LEFT ENGINE
          </text>

          <text
            x={stage.fMarkX}
            y={stage.fMarkY - 7}
            text-anchor="middle"
            dominant-baseline="middle"
            fill={getTextColor(isFPadLit)}
            class="mark-code"
          >
            ▲ BURN
          </text>
          <text
            x={stage.fMarkX}
            y={stage.fMarkY + 10}
            text-anchor="middle"
            dominant-baseline="middle"
            fill={getSubTextColor(isFPadLit)}
            class="mark-sub"
          >
            BOTH ENGINES
          </text>

          <text
            x={STAGE_W - stage.lMarkX}
            y={stage.lMarkY - 7}
            text-anchor="middle"
            dominant-baseline="middle"
            fill={getTextColor(isRPadLit)}
            class="mark-code"
          >
            TURN ▶
          </text>
          <text
            x={STAGE_W - stage.lMarkX}
            y={stage.lMarkY + 10}
            text-anchor="middle"
            dominant-baseline="middle"
            fill={getSubTextColor(isRPadLit)}
            class="mark-sub"
          >
            RIGHT ENGINE
          </text>

          <text
            x={STAGE_W - stage.fMarkX}
            y={stage.fMarkY - 7}
            text-anchor="middle"
            dominant-baseline="middle"
            fill={getTextColor(isFPadLit)}
            class="mark-code"
          >
            ▲ BURN
          </text>
          <text
            x={STAGE_W - stage.fMarkX}
            y={stage.fMarkY + 10}
            text-anchor="middle"
            dominant-baseline="middle"
            fill={getSubTextColor(isFPadLit)}
            class="mark-sub"
          >
            BOTH ENGINES
          </text>

          <!-- Bottom center Pause link -->
          <text
            x={STAGE_W / 2}
            y={STAGE_H - 22}
            text-anchor="middle"
            fill="var(--color-action)"
            font-size="13"
            font-family="var(--font-family-ui)"
          >
            Pause
          </text>
        </svg>
      </div>
    </article>
  </div>
</div>

<style>
.glass-bench {
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

/* Stacked full-width rows so Toggle options never cramp or truncate */
.control-stack {
  display: grid;
  gap: var(--spacing-md);
}

.control-block {
  display: grid;
  gap: var(--spacing-xs);
  justify-items: start;
}

.control-caption {
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
}

.slider-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--spacing-md);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--color-border-subtle);
  align-items: center;
}

.slider-item {
  min-width: 0;
}

.bench-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--spacing-md);
  align-items: start;
}

.closeup-card,
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

.closeup-frame {
  width: 240px;
  margin: 0 auto;
  border: 1px solid var(--color-border);
  background: var(--color-void);
}

.closeup-frame svg {
  width: 100%;
  display: block;
}

.stage-frame {
  border: 1px solid var(--color-border);
  background: var(--color-void);
  overflow: hidden;
}

.stage-svg {
  width: 100%;
  display: block;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  cursor: pointer;
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

.mark-code {
  font-family: var(--font-family-ui);
  font-size: 13px;
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.06em;
  pointer-events: none;
}

.mark-sub {
  font-family: var(--font-family-ui);
  font-size: 9.5px;
  letter-spacing: 0.08em;
  pointer-events: none;
}

.is-hidden {
  display: none;
}
</style>
