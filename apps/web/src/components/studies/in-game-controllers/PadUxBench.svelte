<script lang="ts">
import { onMount } from "svelte";
import Switch from "../../inputs/Switch.svelte";
import Toggle from "../../inputs/Toggle.svelte";

interface Props {
  label?: string;
}

const {
  label = "02.5 Pad surface fill, border outline, markings, and active-state UX explorer",
}: Props = $props();

const FILL_OPTIONS = [
  "0% Transparent",
  "3% Brand tint",
  "6% Brand tint",
  "Dark glass",
] as const;

const BORDER_OPTIONS = [
  "Borderless (fill only)",
  "1px subtle neutral",
  "1px 22% brand outline",
  "Seam + inner rim only",
] as const;

const MARKING_OPTIONS = [
  "Directional chevrons (◀ / ▲)",
  "Letters (L / R / F)",
  "Chevron + caption",
  "Unmarked",
] as const;

const ACTIVE_OPTIONS = [
  "18% Brand fill + crisp rim",
  "32% Brand fill + soft glow",
  "Solid brand invert",
] as const;

let fillStyle = $state<string>("3% Brand tint");
let borderStyle = $state<string>("1px 22% brand outline");
let markingStyle = $state<string>("Directional chevrons (◀ / ▲)");
let activeStyle = $state<string>("18% Brand fill + crisp rim");
let showStageGuides = $state(false);
let coupleOuterOnF = $state(true);

// Settled 02.3 & 02.4 geometry constants:
// 180 CSS px side gutter, 30° slope (tan 30°), F = 84% outer width (151px) & 54% stack height
const GUTTER_PX = 180;
const STACK_H = 320;
const F_WIDTH_RATIO = 0.84;
const F_HEIGHT_RATIO = 0.54;
const TAN_30 = Math.tan(Math.PI / 6);

const INNER_W = Math.round(GUTTER_PX * F_WIDTH_RATIO); // 151 CSS px
const F_H = Math.round(STACK_H * F_HEIGHT_RATIO); // 173 CSS px
const L_EXPOSED_H = STACK_H - F_H; // 147 CSS px
const BEVEL_OUTER = Math.round(GUTTER_PX * TAN_30); // 104 CSS px
const BEVEL_INNER = Math.round(INNER_W * TAN_30); // 87 CSS px

type FlapCmd = "L" | "R" | "FL" | "FR";
let activePointers = $state<Record<number, FlapCmd>>({});
let activeKeys = $state<Record<string, boolean>>({});

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

const leftThrusterFiring = $derived(isLActive || isFLActive || isFRActive);
const rightThrusterFiring = $derived(isRActive || isFLActive || isFRActive);

function buildStagePolygons(W: number, H: number) {
  const yTopOuter = H - STACK_H;
  const yTopInner = H - F_H;

  // Left outer L tab (0..180, extends to H)
  const leftOuterPoly = `0,${yTopOuter} ${GUTTER_PX},${yTopOuter + BEVEL_OUTER} ${GUTTER_PX},${H} 0,${H}`;
  // Left corner-nested F tab (0..151, extends to H)
  const leftInnerPoly = `0,${yTopInner} ${INNER_W},${yTopInner + BEVEL_INNER} ${INNER_W},${H} 0,${H}`;
  // Left exposed upper L polygon (for non-overlapping fill if needed so inner F doesn't double-multiply alpha unless desired)
  const leftUpperOnlyPoly = `0,${yTopOuter} ${GUTTER_PX},${yTopOuter + BEVEL_OUTER} ${GUTTER_PX},${H} ${INNER_W},${H} ${INNER_W},${yTopInner + BEVEL_INNER} 0,${yTopInner}`;

  // Right outer R tab (W-180..W, extends to H)
  const rightOuterPoly = `${W},${yTopOuter} ${W - GUTTER_PX},${yTopOuter + BEVEL_OUTER} ${W - GUTTER_PX},${H} ${W},${H}`;
  // Right corner-nested F tab (W-151..W, extends to H)
  const rightInnerPoly = `${W},${yTopInner} ${W - INNER_W},${yTopInner + BEVEL_INNER} ${W - INNER_W},${H} ${W},${H}`;
  const rightUpperOnlyPoly = `${W},${yTopOuter} ${W - GUTTER_PX},${yTopOuter + BEVEL_OUTER} ${W - GUTTER_PX},${H} ${W - INNER_W},${H} ${W - INNER_W},${yTopInner + BEVEL_INNER} ${W},${yTopInner}`;

  // Seam-only path for "Seam + inner rim only" border option
  const leftSeamPath = `M 0,${yTopOuter} L ${GUTTER_PX},${yTopOuter + BEVEL_OUTER} L ${GUTTER_PX},${H} M 0,${yTopInner} L ${INNER_W},${yTopInner + BEVEL_INNER} L ${INNER_W},${H}`;
  const rightSeamPath = `M ${W},${yTopOuter} L ${W - GUTTER_PX},${yTopOuter + BEVEL_OUTER} L ${W - GUTTER_PX},${H} M ${W},${yTopInner} L ${W - INNER_W},${yTopInner + BEVEL_INNER} L ${W - INNER_W},${H}`;

  // Visual optical centers for markings
  const lMarkX = 82;
  const lMarkY = Math.round(yTopOuter + L_EXPOSED_H * 0.64);
  const fMarkX = 72;
  const fMarkY = Math.round(H - F_H * 0.38);

  return {
    W,
    H,
    yTopOuter,
    yTopInner,
    leftOuterPoly,
    leftInnerPoly,
    leftUpperOnlyPoly,
    rightOuterPoly,
    rightInnerPoly,
    rightUpperOnlyPoly,
    leftSeamPath,
    rightSeamPath,
    lMarkX,
    lMarkY,
    fMarkX,
    fMarkY,
  };
}

// 1:1 close-up card (240 × 380 CSS px)
const CLOSEUP_W = 240;
const CLOSEUP_H = 380;
const closeup = $derived(buildStagePolygons(CLOSEUP_W, CLOSEUP_H));

// Interactive iPad stage (1024 × 680 CSS px)
const STAGE_W = 1024;
const STAGE_H = 680;
const stage = $derived(buildStagePolygons(STAGE_W, STAGE_H));

// Compute CSS fill & stroke strings from current UX switches
const restingOuterFill = $derived(
  fillStyle === "0% Transparent"
    ? "transparent"
    : fillStyle === "3% Brand tint"
      ? "color-mix(in lch, var(--color-brand) 3%, transparent)"
      : fillStyle === "6% Brand tint"
        ? "color-mix(in lch, var(--color-brand) 6%, transparent)"
        : "color-mix(in lch, var(--color-elev-2) 62%, transparent)",
);

// Inner F tab gets a subtle step up so its nested corner shape is distinguishable
const restingInnerFill = $derived(
  fillStyle === "0% Transparent"
    ? "transparent"
    : fillStyle === "3% Brand tint"
      ? "color-mix(in lch, var(--color-brand) 5.5%, transparent)"
      : fillStyle === "6% Brand tint"
        ? "color-mix(in lch, var(--color-brand) 10%, transparent)"
        : "color-mix(in lch, var(--color-elev-3) 68%, transparent)",
);

const restingStroke = $derived(
  borderStyle === "Borderless (fill only)" ||
    borderStyle === "Seam + inner rim only"
    ? "none"
    : borderStyle === "1px subtle neutral"
      ? "var(--color-border)"
      : "color-mix(in lch, var(--color-brand) 24%, transparent)",
);

const restingSeamStroke = $derived(
  borderStyle === "Seam + inner rim only"
    ? "color-mix(in lch, var(--color-brand) 28%, transparent)"
    : "none",
);

function getActiveFill() {
  if (activeStyle === "Solid brand invert") return "var(--color-selected)";
  if (activeStyle === "32% Brand fill + soft glow") {
    return "color-mix(in lch, var(--color-selected) 32%, var(--color-void))";
  }
  return "color-mix(in lch, var(--color-selected) 18%, var(--color-void))";
}

function getCoupledParentFill() {
  if (!coupleOuterOnF) return restingOuterFill;
  return "color-mix(in lch, var(--color-selected) 9%, transparent)";
}

function getActiveTextFill(isActive: boolean) {
  if (!isActive) {
    return borderStyle === "1px subtle neutral"
      ? "var(--color-text-muted)"
      : "color-mix(in lch, var(--color-brand) 68%, var(--color-text-muted))";
  }
  if (activeStyle === "Solid brand invert") return "var(--color-on-brand)";
  return "var(--color-selected)";
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

const PRESETS = [
  {
    name: "1 · Whisper tint (3% brand fill + 22% brand line)",
    fill: "3% Brand tint",
    border: "1px 22% brand outline",
    marking: "Directional chevrons (◀ / ▲)",
    active: "18% Brand fill + crisp rim",
  },
  {
    name: "2 · Minimal seam (3% brand fill + inner seam only)",
    fill: "3% Brand tint",
    border: "Seam + inner rim only",
    marking: "Directional chevrons (◀ / ▲)",
    active: "18% Brand fill + crisp rim",
  },
  {
    name: "3 · Instrument HUD (Dark glass + 1px neutral border)",
    fill: "Dark glass",
    border: "1px subtle neutral",
    marking: "Chevron + caption",
    active: "32% Brand fill + soft glow",
  },
  {
    name: "4 · Ghost wireframe (0% fill + 22% brand line)",
    fill: "0% Transparent",
    border: "1px 22% brand outline",
    marking: "Letters (L / R / F)",
    active: "18% Brand fill + crisp rim",
  },
] as const;

function applyPreset(p: (typeof PRESETS)[number]) {
  fillStyle = p.fill;
  borderStyle = p.border;
  markingStyle = p.marking;
  activeStyle = p.active;
}
</script>

<div class="ux-bench">
  <section class="bench-controls" aria-label={label}>
    <div class="preset-row">
      <span class="control-caption"
        >02.5 Quick combinations (or mix independently below)</span
      >
      <div class="pill-row">
        {#each PRESETS as p}
          <button
            type="button"
            class="btn"
            class:btn-filled={fillStyle === p.fill &&
              borderStyle === p.border &&
              markingStyle === p.marking &&
              activeStyle === p.active}
            class:btn-ghost={!(
              fillStyle === p.fill &&
              borderStyle === p.border &&
              markingStyle === p.marking &&
              activeStyle === p.active
            )}
            onclick={() => applyPreset(p)}
          >
            {p.name}
          </button>
        {/each}
      </div>
    </div>

    <div class="control-grid">
      <div class="control-block">
        <span class="control-caption">A · Resting background fill</span>
        <Toggle
          compact
          label="Resting background fill"
          options={[...FILL_OPTIONS]}
          bind:value={fillStyle}
        />
      </div>

      <div class="control-block">
        <span class="control-caption">B · Border / outline treatment</span>
        <Toggle
          compact
          label="Border outline treatment"
          options={[...BORDER_OPTIONS]}
          bind:value={borderStyle}
        />
      </div>

      <div class="control-block">
        <span class="control-caption">C · Pad markings / iconography</span>
        <Toggle
          compact
          label="Pad markings"
          options={[...MARKING_OPTIONS]}
          bind:value={markingStyle}
        />
      </div>

      <div class="control-block">
        <span class="control-caption">D · Pressed / active state response</span>
        <Toggle
          compact
          label="Pressed state response"
          options={[...ACTIVE_OPTIONS]}
          bind:value={activeStyle}
        />
      </div>
    </div>

    <div class="switch-row">
      <label class="switch-block" for="couple-outer-switch">
        <span class="switch-copy">
          <span class="switch-title"
            >Couple outer L/R rim when F is pressed</span
          >
          <span class="switch-sub">
            Subtly tints the enclosing L/R tab when F fires both engines
          </span>
        </span>
        <Switch id="couple-outer-switch" bind:checked={coupleOuterOnF} />
      </label>

      <label class="switch-block" for="stage-guides-switch">
        <span class="switch-copy">
          <span class="switch-title">Show 180px gutter &amp; seam guides</span>
          <span class="switch-sub">
            Off by default so you see the clean in-game look
          </span>
        </span>
        <Switch id="stage-guides-switch" bind:checked={showStageGuides} />
      </label>
    </div>
  </section>

  <div class="bench-layout">
    <!-- Left card: 1:1 CSS pixel close-up over deep space & starlight -->
    <article class="closeup-card">
      <header class="card-header">
        <div>
          <h4>1:1 CSS-pixel close-up</h4>
          <span class="card-sub">
            True size on screen (<code>180px</code>
            outer,
            <code>151px</code>
            nested <code>F</code>)
          </span>
        </div>
      </header>

      <div class="closeup-frame">
        <svg
          viewBox={`0 0 ${CLOSEUP_W} ${CLOSEUP_H}`}
          role="img"
          aria-label="1 to 1 CSS pixel close-up of pad fill, border, and markings"
        >
          <rect
            x="0"
            y="0"
            width={CLOSEUP_W}
            height={CLOSEUP_H}
            fill="var(--color-void)"
          />

          <!-- Subtle background stars & orbit arc passing behind the gutter to judge 3% tint & border -->
          <circle cx="48" cy="110" r="1.2" fill="var(--color-text-muted)" />
          <circle cx="135" cy="180" r="1.5" fill="var(--color-text)" />
          <circle cx="92" cy="270" r="1.2" fill="var(--color-text-muted)" />
          <circle cx="164" cy="320" r="1.4" fill="var(--color-text-muted)" />
          <circle
            cx="290"
            cy="210"
            r="220"
            fill="none"
            stroke="var(--color-border-faint)"
            stroke-width="1"
          />

          <!-- Optional 180px gutter guide -->
          <g class:is-hidden={!showStageGuides}>
            <line
              x1={GUTTER_PX}
              y1="0"
              x2={GUTTER_PX}
              y2={CLOSEUP_H}
              stroke="var(--color-action)"
              stroke-dasharray="5 5"
              stroke-opacity="0.45"
              stroke-width="1"
            />
          </g>

          <!-- Outer L exposed polygon -->
          <polygon
            points={closeup.leftOuterPoly}
            fill={isLActive
              ? getActiveFill()
              : isFLActive
                ? getCoupledParentFill()
                : restingOuterFill}
            stroke={isLActive
              ? "var(--color-selected)"
              : isFLActive && coupleOuterOnF
                ? "color-mix(in lch, var(--color-selected) 45%, transparent)"
                : restingStroke}
            stroke-width={isLActive ? "2" : "1"}
            class:has-glow={isLActive &&
              activeStyle === "32% Brand fill + soft glow"}
          />

          <!-- Corner-nested F polygon -->
          <polygon
            points={closeup.leftInnerPoly}
            fill={isFLActive ? getActiveFill() : restingInnerFill}
            stroke={isFLActive ? "var(--color-selected)" : restingStroke}
            stroke-width={isFLActive ? "2" : "1"}
            class:has-glow={isFLActive &&
              activeStyle === "32% Brand fill + soft glow"}
          />

          <!-- Seam + inner rim only stroke option -->
          {#if borderStyle === "Seam + inner rim only"}
            <path
              d={closeup.leftSeamPath}
              fill="none"
              stroke={isLActive || isFLActive
                ? "var(--color-selected)"
                : restingSeamStroke}
              stroke-width="1.25"
            />
          {/if}

          <!-- Markings on L and F -->
          {#if markingStyle === "Directional chevrons (◀ / ▲)"}
            <!-- Crisp geometric left-turn chevron on L -->
            <path
              d={`M ${closeup.lMarkX + 7},${closeup.lMarkY - 9} L ${closeup.lMarkX - 7},${closeup.lMarkY} L ${closeup.lMarkX + 7},${closeup.lMarkY + 9}`}
              fill="none"
              stroke={getActiveTextFill(isLActive)}
              stroke-width="2.2"
              stroke-linecap="square"
            />
            <!-- Double upward thrust chevron on F -->
            <path
              d={`M ${closeup.fMarkX - 9},${closeup.fMarkY + 3} L ${closeup.fMarkX},${closeup.fMarkY - 7} L ${closeup.fMarkX + 9},${closeup.fMarkY + 3} M ${closeup.fMarkX - 9},${closeup.fMarkY + 11} L ${closeup.fMarkX},${closeup.fMarkY + 1} L ${closeup.fMarkX + 9},${closeup.fMarkY + 11}`}
              fill="none"
              stroke={getActiveTextFill(isFLActive)}
              stroke-width="2.2"
              stroke-linecap="square"
            />
          {:else if markingStyle === "Letters (L / R / F)"}
            <text
              x={closeup.lMarkX}
              y={closeup.lMarkY}
              text-anchor="middle"
              dominant-baseline="middle"
              fill={getActiveTextFill(isLActive)}
              class="mark-letter"
            >
              L
            </text>
            <text
              x={closeup.fMarkX}
              y={closeup.fMarkY}
              text-anchor="middle"
              dominant-baseline="middle"
              fill={getActiveTextFill(isFLActive)}
              class="mark-letter"
            >
              F
            </text>
          {:else if markingStyle === "Chevron + caption"}
            <text
              x={closeup.lMarkX}
              y={closeup.lMarkY - 7}
              text-anchor="middle"
              dominant-baseline="middle"
              fill={getActiveTextFill(isLActive)}
              class="mark-code"
            >
              ◀ TURN
            </text>
            <text
              x={closeup.lMarkX}
              y={closeup.lMarkY + 10}
              text-anchor="middle"
              dominant-baseline="middle"
              fill={getActiveTextFill(isLActive)}
              class="mark-sub"
            >
              LEFT ENGINE
            </text>

            <text
              x={closeup.fMarkX}
              y={closeup.fMarkY - 7}
              text-anchor="middle"
              dominant-baseline="middle"
              fill={getActiveTextFill(isFLActive)}
              class="mark-code"
            >
              ▲ BURN
            </text>
            <text
              x={closeup.fMarkX}
              y={closeup.fMarkY + 10}
              text-anchor="middle"
              dominant-baseline="middle"
              fill={getActiveTextFill(isFLActive)}
              class="mark-sub"
            >
              BOTH ENGINES
            </text>
          {/if}
        </svg>
      </div>
    </article>

    <!-- Right card: Clean in-game FlightDeck stage preview -->
    <article class="stage-card">
      <header class="card-header">
        <div>
          <h4>
            In-game stage preview (<code>1024 × 680</code>) — press pads or hold
            <code>A</code>
            / <code>D</code> / <code>W</code>
          </h4>
          <span class="card-sub">
            Judge how the resting fill, outline, and markings sit alongside the
            star, ship, and HUD without cluttering space
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
          aria-label="In-game flight stage preview with customizable pad fill, border, and markings"
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

          <!-- Subtle starfield across the whole stage (including behind the 180px gutters) -->
          <circle cx="92" cy="180" r="1.2" fill="var(--color-text-muted)" />
          <circle cx="144" cy="490" r="1.4" fill="var(--color-text-muted)" />
          <circle cx="64" cy="580" r="1.2" fill="var(--color-text)" />
          <circle cx="310" cy="140" r="1.3" fill="var(--color-text-muted)" />
          <circle cx="740" cy="160" r="1.3" fill="var(--color-text-muted)" />
          <circle cx="910" cy="220" r="1.2" fill="var(--color-text-muted)" />
          <circle cx="948" cy="520" r="1.4" fill="var(--color-text)" />
          <circle cx="885" cy="610" r="1.2" fill="var(--color-text-muted)" />

          <!-- Central star & orbital ring -->
          <circle
            cx={STAGE_W / 2}
            cy={STAGE_H / 2}
            r="235"
            fill="none"
            stroke="var(--color-border-subtle)"
            stroke-width="1"
          />
          <circle
            cx={STAGE_W / 2}
            cy={STAGE_H / 2}
            r="145"
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

          <!-- Top HUD (Hull, Power, Survival timer) -->
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

          <!-- Optional 180 CSS px gutter & end-to-end touch seam guides -->
          <g class:is-hidden={!showStageGuides}>
            <line
              x1={GUTTER_PX}
              y1="0"
              x2={GUTTER_PX}
              y2={STAGE_H}
              stroke="var(--color-action)"
              stroke-dasharray="6 6"
              stroke-opacity="0.45"
              stroke-width="1.5"
            />
            <line
              x1={STAGE_W - GUTTER_PX}
              y1="0"
              x2={STAGE_W - GUTTER_PX}
              y2={STAGE_H}
              stroke="var(--color-action)"
              stroke-dasharray="6 6"
              stroke-opacity="0.45"
              stroke-width="1.5"
            />
            <line
              x1="0"
              y1={stage.yTopInner}
              x2={GUTTER_PX}
              y2={stage.yTopInner + BEVEL_OUTER}
              stroke="var(--color-caution-tape)"
              stroke-dasharray="5 4"
              stroke-width="1.5"
            />
            <line
              x1={STAGE_W}
              y1={stage.yTopInner}
              x2={STAGE_W - GUTTER_PX}
              y2={stage.yTopInner + BEVEL_OUTER}
              stroke="var(--color-caution-tape)"
              stroke-dasharray="5 4"
              stroke-width="1.5"
            />
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

          <!-- LEFT GUTTER PAD ASSEMBLY (L + corner-nested F) -->
          <polygon
            points={stage.leftOuterPoly}
            fill={isLActive
              ? getActiveFill()
              : isFLActive
                ? getCoupledParentFill()
                : restingOuterFill}
            stroke={isLActive
              ? "var(--color-selected)"
              : isFLActive && coupleOuterOnF
                ? "color-mix(in lch, var(--color-selected) 45%, transparent)"
                : restingStroke}
            stroke-width={isLActive ? "2" : "1"}
            class:has-glow={isLActive &&
              activeStyle === "32% Brand fill + soft glow"}
          />
          <polygon
            points={stage.leftInnerPoly}
            fill={isFLActive ? getActiveFill() : restingInnerFill}
            stroke={isFLActive ? "var(--color-selected)" : restingStroke}
            stroke-width={isFLActive ? "2" : "1"}
            class:has-glow={isFLActive &&
              activeStyle === "32% Brand fill + soft glow"}
          />

          <!-- RIGHT GUTTER PAD ASSEMBLY (R + corner-nested F) -->
          <polygon
            points={stage.rightOuterPoly}
            fill={isRActive
              ? getActiveFill()
              : isFRActive
                ? getCoupledParentFill()
                : restingOuterFill}
            stroke={isRActive
              ? "var(--color-selected)"
              : isFRActive && coupleOuterOnF
                ? "color-mix(in lch, var(--color-selected) 45%, transparent)"
                : restingStroke}
            stroke-width={isRActive ? "2" : "1"}
            class:has-glow={isRActive &&
              activeStyle === "32% Brand fill + soft glow"}
          />
          <polygon
            points={stage.rightInnerPoly}
            fill={isFRActive ? getActiveFill() : restingInnerFill}
            stroke={isFRActive ? "var(--color-selected)" : restingStroke}
            stroke-width={isFRActive ? "2" : "1"}
            class:has-glow={isFRActive &&
              activeStyle === "32% Brand fill + soft glow"}
          />

          {#if borderStyle === "Seam + inner rim only"}
            <path
              d={stage.leftSeamPath}
              fill="none"
              stroke={isLActive || isFLActive
                ? "var(--color-selected)"
                : restingSeamStroke}
              stroke-width="1.25"
            />
            <path
              d={stage.rightSeamPath}
              fill="none"
              stroke={isRActive || isFRActive
                ? "var(--color-selected)"
                : restingSeamStroke}
              stroke-width="1.25"
            />
          {/if}

          <!-- LEFT & RIGHT MARKINGS -->
          {#if markingStyle === "Directional chevrons (◀ / ▲)"}
            <!-- Left L chevron (◀) -->
            <path
              d={`M ${stage.lMarkX + 7},${stage.lMarkY - 9} L ${stage.lMarkX - 7},${stage.lMarkY} L ${stage.lMarkX + 7},${stage.lMarkY + 9}`}
              fill="none"
              stroke={getActiveTextFill(isLActive)}
              stroke-width="2.2"
              stroke-linecap="square"
            />
            <!-- Left F double chevron (▲) -->
            <path
              d={`M ${stage.fMarkX - 9},${stage.fMarkY + 3} L ${stage.fMarkX},${stage.fMarkY - 7} L ${stage.fMarkX + 9},${stage.fMarkY + 3} M ${stage.fMarkX - 9},${stage.fMarkY + 11} L ${stage.fMarkX},${stage.fMarkY + 1} L ${stage.fMarkX + 9},${stage.fMarkY + 11}`}
              fill="none"
              stroke={getActiveTextFill(isFLActive)}
              stroke-width="2.2"
              stroke-linecap="square"
            />

            <!-- Right R chevron (▶) -->
            <path
              d={`M ${STAGE_W - stage.lMarkX - 7},${stage.lMarkY - 9} L ${STAGE_W - stage.lMarkX + 7},${stage.lMarkY} L ${STAGE_W - stage.lMarkX - 7},${stage.lMarkY + 9}`}
              fill="none"
              stroke={getActiveTextFill(isRActive)}
              stroke-width="2.2"
              stroke-linecap="square"
            />
            <!-- Right F double chevron (▲) -->
            <path
              d={`M ${STAGE_W - stage.fMarkX - 9},${stage.fMarkY + 3} L ${STAGE_W - stage.fMarkX},${stage.fMarkY - 7} L ${STAGE_W - stage.fMarkX + 9},${stage.fMarkY + 3} M ${STAGE_W - stage.fMarkX - 9},${stage.fMarkY + 11} L ${STAGE_W - stage.fMarkX},${stage.fMarkY + 1} L ${STAGE_W - stage.fMarkX + 9},${stage.fMarkY + 11}`}
              fill="none"
              stroke={getActiveTextFill(isFRActive)}
              stroke-width="2.2"
              stroke-linecap="square"
            />
          {:else if markingStyle === "Letters (L / R / F)"}
            <text
              x={stage.lMarkX}
              y={stage.lMarkY}
              text-anchor="middle"
              dominant-baseline="middle"
              fill={getActiveTextFill(isLActive)}
              class="mark-letter"
            >
              L
            </text>
            <text
              x={stage.fMarkX}
              y={stage.fMarkY}
              text-anchor="middle"
              dominant-baseline="middle"
              fill={getActiveTextFill(isFLActive)}
              class="mark-letter"
            >
              F
            </text>
            <text
              x={STAGE_W - stage.lMarkX}
              y={stage.lMarkY}
              text-anchor="middle"
              dominant-baseline="middle"
              fill={getActiveTextFill(isRActive)}
              class="mark-letter"
            >
              R
            </text>
            <text
              x={STAGE_W - stage.fMarkX}
              y={stage.fMarkY}
              text-anchor="middle"
              dominant-baseline="middle"
              fill={getActiveTextFill(isFRActive)}
              class="mark-letter"
            >
              F
            </text>
          {:else if markingStyle === "Chevron + caption"}
            <text
              x={stage.lMarkX}
              y={stage.lMarkY - 7}
              text-anchor="middle"
              dominant-baseline="middle"
              fill={getActiveTextFill(isLActive)}
              class="mark-code"
            >
              ◀ TURN
            </text>
            <text
              x={stage.lMarkX}
              y={stage.lMarkY + 10}
              text-anchor="middle"
              dominant-baseline="middle"
              fill={getActiveTextFill(isLActive)}
              class="mark-sub"
            >
              LEFT ENGINE
            </text>

            <text
              x={stage.fMarkX}
              y={stage.fMarkY - 7}
              text-anchor="middle"
              dominant-baseline="middle"
              fill={getActiveTextFill(isFLActive)}
              class="mark-code"
            >
              ▲ BURN
            </text>
            <text
              x={stage.fMarkX}
              y={stage.fMarkY + 10}
              text-anchor="middle"
              dominant-baseline="middle"
              fill={getActiveTextFill(isFLActive)}
              class="mark-sub"
            >
              BOTH ENGINES
            </text>

            <text
              x={STAGE_W - stage.lMarkX}
              y={stage.lMarkY - 7}
              text-anchor="middle"
              dominant-baseline="middle"
              fill={getActiveTextFill(isRActive)}
              class="mark-code"
            >
              TURN ▶
            </text>
            <text
              x={STAGE_W - stage.lMarkX}
              y={stage.lMarkY + 10}
              text-anchor="middle"
              dominant-baseline="middle"
              fill={getActiveTextFill(isRActive)}
              class="mark-sub"
            >
              RIGHT ENGINE
            </text>

            <text
              x={STAGE_W - stage.fMarkX}
              y={stage.fMarkY - 7}
              text-anchor="middle"
              dominant-baseline="middle"
              fill={getActiveTextFill(isFRActive)}
              class="mark-code"
            >
              ▲ BURN
            </text>
            <text
              x={STAGE_W - stage.fMarkX}
              y={stage.fMarkY + 10}
              text-anchor="middle"
              dominant-baseline="middle"
              fill={getActiveTextFill(isFRActive)}
              class="mark-sub"
            >
              BOTH ENGINES
            </text>
          {/if}

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
.ux-bench {
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

.preset-row {
  display: grid;
  gap: var(--spacing-xs);
}

.pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.control-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-md);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--color-border-subtle);
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

.switch-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--color-border-subtle);
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

.has-glow {
  filter: drop-shadow(
    0 0 18px color-mix(in lch, var(--color-selected) 32%, transparent)
  );
}

.mark-letter {
  font-family: var(--font-family-ui);
  font-size: 20px;
  font-weight: var(--font-weight-bold);
  pointer-events: none;
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
  opacity: 0.78;
  pointer-events: none;
}

.is-hidden {
  display: none;
}
</style>
