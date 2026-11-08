<script lang="ts">
import { canvasFont, loadCanvasFonts } from "@void-drift/core";
import {
  ENGINE_ART,
  FIGHTER,
  PARTS,
  type PartId,
  SLOT_STYLE,
  SLOT_TYPES,
  type SlotPalette,
  type SlotType,
  slotAccepts,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import "@void-drift/core/styles/buttons.css";

let { label = "LHI Wasp side slot positioner" }: { label?: string } = $props();

type Point = readonly [number, number];

interface Facet {
  readonly points: readonly Point[];
  readonly shade: 0 | 1 | 2 | 3 | 4 | 5;
}

const palette = [
  FIGHTER.facets[0], // #c8f4f0 (0: brightest)
  FIGHTER.facets[1], // #83c7d0 (1: light)
  FIGHTER.facets[5], // #6193a9 (2: medium-light)
  FIGHTER.facets[2], // #437e99 (3: medium)
  FIGHTER.facets[4], // #365d79 (4: dark)
  FIGHTER.facets[3], // #264d6b (5: deepest shadow)
] as const;

// Approved 06.9 hull facets in upright study coordinates (nose at y = -25, stern at y = 24.5)
const hull069StudyFacets: readonly Facet[] = [
  {
    points: [
      [0, -25],
      [-3, -25],
      [-6, -10],
      [-3, -10],
      [0, -16],
    ],
    shade: 0,
  },
  {
    points: [
      [0, -25],
      [0, -16],
      [3, -10],
      [6, -10],
      [3, -25],
    ],
    shade: 3,
  },
  {
    points: [
      [-6, -10],
      [-18, 2],
      [-18, 12.5],
      [-13.5, 12.5],
    ],
    shade: 2,
  },
  {
    points: [
      [6, -10],
      [13.5, 12.5],
      [18, 12.5],
      [18, 2],
    ],
    shade: 4,
  },
  {
    points: [
      [-6, -10],
      [-13.5, 12.5],
      [-9.5, 11],
      [-7.4, 10.1],
    ],
    shade: 1,
  },
  {
    points: [
      [6, -10],
      [7.4, 10.1],
      [9.5, 11],
      [13.5, 12.5],
    ],
    shade: 5,
  },
  {
    points: [
      [-6, -10],
      [-3, -10],
      [-3, -1],
      [-5, 9],
      [-7.4, 10.1],
    ],
    shade: 0,
  },
  {
    points: [
      [6, -10],
      [7.4, 10.1],
      [5, 9],
      [3, -1],
      [3, -10],
    ],
    shade: 2,
  },
  {
    points: [
      [-9.5, 11],
      [-7.4, 10.1],
      [-5, 9],
      [-4, 17.4],
      [-7.3, 18.8],
    ],
    shade: 2,
  },
  {
    points: [
      [9.5, 11],
      [7.3, 18.8],
      [4, 17.4],
      [5, 9],
      [7.4, 10.1],
    ],
    shade: 4,
  },
  {
    points: [
      [-3, -1],
      [-1.4, 24.5],
      [-3.3, 24.5],
      [-5, 9],
    ],
    shade: 0,
  },
  {
    points: [
      [3, -1],
      [5, 9],
      [3.3, 24.5],
      [1.4, 24.5],
    ],
    shade: 3,
  },
  {
    points: [
      [-3, -1],
      [0, 3.5],
      [0, 24.5],
      [-1.4, 24.5],
    ],
    shade: 1,
  },
  {
    points: [
      [0, 3.5],
      [3, -1],
      [1.4, 24.5],
      [0, 24.5],
    ],
    shade: 4,
  },
];

const cockpitStudyPolygons: readonly (readonly Point[])[] = [
  [
    [0, -16],
    [-3, -10],
    [-3, -1],
    [0, 3.5],
  ],
  [
    [0, -16],
    [3, -10],
    [3, -1],
    [0, 3.5],
  ],
];

// Approved rear engine mount (02.7) and 4 stabilizer slits (02.8)
const ENGINE_MOUNT_Y = 17.5;
const STAB_CONFIG = {
  frontX: 4.4,
  frontY: -18.5,
  frontAngleDeg: 8.5,
  rearX: 4.9,
  rearY: 13.5,
  rearAngleDeg: -10.0,
} as const;

// Side Equipment (Q) slots ("under the canopy" -> rendered below the hull in flight, unlinked)
// Approved default: (±12.00, -1.50)
let slotX = $state(12.0);
let slotY = $state(-1.5);

let selectedKey = $state<"hull-0" | "hull-1" | "aft-0">("hull-0");
let leftPart = $state<PartId | null>("rail");
let rightPart = $state<PartId | null>("battery");
let aftPart = $state<PartId | null>("ion");
let viewMode = $state<"builder" | "flight">("builder");
let fontsLoaded = $state(false);

let builderCanvas = $state<HTMLCanvasElement>();
let flightCanvas = $state<HTMLCanvasElement>();

const PREVIEW_SCALE = 5.2;
const PREVIEW_CX = 300;
const PREVIEW_CY = 290;

interface WaspMount {
  key: "hull-0" | "hull-1" | "aft-0";
  number: number;
  type: SlotType;
  label: string;
  studyX: number;
  studyY: number;
  // Ship-forward (+x_ship = -studyY, +y_ship = +studyX)
  x: number;
  y: number;
  angle: number;
  width: number;
  height: number;
  part: PartId | null;
  underHull: boolean;
}

const mounts = $derived<WaspMount[]>([
  {
    key: "hull-0",
    number: 1,
    type: "equipment",
    label: "01 · Left Wing · Equipment (Q · Weapon or Utility)",
    studyX: -slotX,
    studyY: slotY,
    x: -slotY,
    y: -slotX,
    angle: 0,
    width: 11,
    height: 9,
    part: leftPart,
    underHull: true,
  },
  {
    key: "hull-1",
    number: 2,
    type: "equipment",
    label: "02 · Right Wing · Equipment (Q · Weapon or Utility)",
    studyX: slotX,
    studyY: slotY,
    x: -slotY,
    y: slotX,
    angle: 0,
    width: 11,
    height: 9,
    part: rightPart,
    underHull: true,
  },
  {
    key: "aft-0",
    number: 3,
    type: "engine",
    label: "03 · Rear Center · Engine (E · Single Main Engine)",
    studyX: 0,
    studyY: ENGINE_MOUNT_Y,
    x: -ENGINE_MOUNT_Y,
    y: 0,
    angle: 0,
    width: 11,
    height: 9,
    part: aftPart,
    underHull: false,
  },
]);

const activeMount = $derived(
  mounts.find((m) => m.key === selectedKey) ?? mounts[0],
);

const compatibleParts = $derived(
  Object.values(PARTS).filter((part) =>
    slotAccepts(activeMount.type, part.category),
  ),
);

function installOnSelected(id: PartId | null) {
  if (selectedKey === "aft-0" && id === null) return;
  if (id && !slotAccepts(activeMount.type, PARTS[id].category)) return;
  if (selectedKey === "hull-0") leftPart = id;
  else if (selectedKey === "hull-1") rightPart = id;
  else aftPart = id;
}

function fillPolygon(
  ctx: CanvasRenderingContext2D,
  points: readonly Point[],
  color: string,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
}

function drawSingleStabilizerSlit(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#080b13";
  ctx.beginPath();
  ctx.moveTo(-1.2, -3.2);
  ctx.lineTo(1, -2.6);
  ctx.lineTo(1, 2.6);
  ctx.lineTo(-1.2, 3.2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#303d4c";
  ctx.fillRect(-0.45, -2.2, 0.9, 4.4);

  ctx.strokeStyle = "#718594";
  ctx.lineWidth = 0.25;
  ctx.beginPath();
  ctx.moveTo(0.65, -2.5);
  ctx.lineTo(0.65, 2.5);
  ctx.stroke();

  ctx.strokeStyle = "#69cfff";
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.moveTo(-0.7, -2.3);
  ctx.lineTo(-0.7, 2.3);
  ctx.stroke();
}

function drawHullAndStabilizersInShipCoords(
  ctx: CanvasRenderingContext2D,
  translucentHull: boolean,
) {
  ctx.save();
  if (translucentHull) ctx.globalAlpha = 0.7;
  // Convert upright study coords (nose = -y_study) into ship-forward (+x_ship):
  ctx.rotate(Math.PI / 2);

  for (const facet of hull069StudyFacets) {
    fillPolygon(ctx, facet.points, palette[facet.shade]);
  }
  for (const cp of cockpitStudyPolygons) {
    fillPolygon(ctx, cp, "#000000");
  }
  ctx.restore();

  // 4 Stabilizer slits on the hull (behind top-mounted slotted parts)
  ctx.save();
  ctx.rotate(Math.PI / 2);
  const slits = [
    {
      x: -STAB_CONFIG.frontX,
      y: STAB_CONFIG.frontY,
      deg: STAB_CONFIG.frontAngleDeg,
      mirror: false,
    },
    {
      x: STAB_CONFIG.frontX,
      y: STAB_CONFIG.frontY,
      deg: STAB_CONFIG.frontAngleDeg,
      mirror: true,
    },
    {
      x: -STAB_CONFIG.rearX,
      y: STAB_CONFIG.rearY,
      deg: STAB_CONFIG.rearAngleDeg,
      mirror: false,
    },
    {
      x: STAB_CONFIG.rearX,
      y: STAB_CONFIG.rearY,
      deg: STAB_CONFIG.rearAngleDeg,
      mirror: true,
    },
  ] as const;

  for (const s of slits) {
    ctx.save();
    ctx.translate(s.x, s.y);
    if (s.mirror) ctx.scale(-1, 1);
    ctx.rotate((s.deg * Math.PI) / 180);
    drawSingleStabilizerSlit(ctx);
    ctx.restore();
  }
  ctx.restore();
}

function drawEnginePart(
  ctx: CanvasRenderingContext2D,
  partId: PartId,
  selected: boolean,
) {
  const id = partId as "ion" | "heavy-ion" | "fusion" | "plasma";
  const faces = ENGINE_ART[id][3];
  ctx.save();
  if (selected) {
    ctx.shadowColor = "#d4ff00";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#252a31";
    ctx.beginPath();
    for (const face of faces) {
      face.points.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
    }
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  for (const face of faces) {
    fillPolygon(
      ctx,
      face.points,
      face.color === "currentColor"
        ? id === "fusion"
          ? "#c6ff32"
          : "#ffb52e"
        : face.color,
    );
  }
  ctx.restore();
}

function drawEquipmentPart(
  ctx: CanvasRenderingContext2D,
  mount: WaspMount,
  inSlotOverlay: boolean,
) {
  if (!mount.part) return;
  ctx.save();
  if (inSlotOverlay) {
    const fit = Math.min(54 / 7 / mount.height, 64 / 7 / mount.width) * 0.65;
    ctx.scale(fit, fit);
  }
  ctx.strokeStyle = PARTS[mount.part].category === "E" ? "#9af7ff" : "#d4ff00";
  ctx.fillStyle = "#071015";
  ctx.lineWidth = 0.45;
  ctx.fillRect(-mount.width / 2, -mount.height / 2, mount.width, mount.height);
  ctx.strokeRect(
    -mount.width / 2,
    -mount.height / 2,
    mount.width,
    mount.height,
  );

  if (mount.part === "rail" || mount.part === "laser") {
    const barrel = mount.width / 2 + (mount.part === "rail" ? 1 : 0);
    ctx.fillRect(0, -2, barrel, 4);
    ctx.strokeRect(0, -2, barrel, 4);
  } else if (mount.part === "coil") {
    for (let i = -3; i <= 3; i += 3) {
      ctx.beginPath();
      ctx.ellipse(i, 0, 1.5, 3, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (mount.part === "battery") {
    ctx.beginPath();
    ctx.moveTo(-2, -2);
    ctx.lineTo(2, -2);
    ctx.moveTo(0, -4);
    ctx.lineTo(0, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSlotOverlay(
  ctx: CanvasRenderingContext2D,
  mount: WaspMount,
  selected: boolean,
  slotPalette: SlotPalette,
  backgroundOnly = false,
) {
  ctx.save();
  ctx.rotate(Math.PI / 2);
  ctx.scale(1 / SLOT_STYLE.referenceScale, 1 / SLOT_STYLE.referenceScale);
  const { width, height, gap, border } = SLOT_STYLE;
  const w = width / 2 + gap;
  const h = height / 2 + gap;
  const cw = w + 5;
  const ch = h + 5;
  const ink = mount.part ? slotPalette.lime : slotPalette.dark;

  if (backgroundOnly) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = mount.part ? slotPalette.dark : slotPalette.lime;
    ctx.fillRect(-width / 2, -height / 2, width, height);
    ctx.restore();
    return;
  }

  ctx.globalAlpha = 1;
  ctx.strokeStyle = ink;
  ctx.lineWidth = border;
  ctx.strokeRect(-w, -h, w * 2, h * 2);

  if (selected) {
    ctx.strokeStyle = slotPalette.lime;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (const [x, y] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]) {
      ctx.moveTo(x * (cw - 12), y * ch);
      ctx.lineTo(x * cw, y * ch);
      ctx.lineTo(x * cw, y * (ch - 12));
    }
    ctx.stroke();
  }

  if (!mount.part) {
    ctx.fillStyle = ink;
    ctx.globalAlpha = 0.7;
    ctx.font = canvasFont(32, 700);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(SLOT_TYPES[mount.type].symbol, 0, 0);
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = slotPalette.dark;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(-cw - 23, -ch - 12, 22, 16);
  ctx.globalAlpha = 1;
  ctx.font = canvasFont(11);
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = slotPalette.ivory;
  ctx.fillText(String(mount.number).padStart(2, "0"), -cw - 5, -ch);
  ctx.translate(-w - 4, h);
  ctx.rotate(-Math.PI / 2);
  ctx.font = canvasFont(8);
  ctx.textAlign = "left";
  ctx.fillStyle = ink;
  ctx.fillText(SLOT_TYPES[mount.type].label, 0, 0);
  ctx.restore();
}

function renderWaspCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  slotsPalette?: SlotPalette,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 2);
  ctx.scale(scale, scale);

  // 1. In flight view (no slot overlays), draw "under the canopy" side mounts BELOW the hull!
  if (!slotsPalette) {
    for (const mount of mounts.filter((m) => m.underHull)) {
      if (!mount.part) continue;
      ctx.save();
      ctx.translate(mount.x, mount.y);
      ctx.rotate(mount.angle);
      if (PARTS[mount.part].category === "E") {
        drawEnginePart(ctx, mount.part, false);
      } else {
        drawEquipmentPart(ctx, mount, false);
      }
      ctx.restore();
    }
  }

  // 2. Hull + 4 stabilizer slits (0.7 alpha in builder mode so under-wing mounts show through)
  drawHullAndStabilizersInShipCoords(ctx, Boolean(slotsPalette));

  // 3. In builder mode, draw all 3 unlinked slots with their standard overlays & markings.
  //    In flight mode, draw only the top-mounted rear universal slot (since side mounts were drawn below the hull).
  for (const mount of mounts) {
    if (!slotsPalette && mount.underHull) continue;
    const isSelected = selectedKey === mount.key;
    ctx.save();
    ctx.translate(mount.x, mount.y);
    ctx.rotate(mount.angle);

    if (slotsPalette) {
      drawSlotOverlay(ctx, mount, isSelected, slotsPalette, true);
    }

    if (mount.part && PARTS[mount.part].category === "E") {
      drawEnginePart(ctx, mount.part, Boolean(slotsPalette) && isSelected);
      if (slotsPalette) {
        drawSlotOverlay(ctx, mount, isSelected, slotsPalette, false);
      }
      ctx.restore();
      continue;
    }

    if (slotsPalette) {
      drawSlotOverlay(ctx, mount, isSelected, slotsPalette, false);
    }
    if (mount.part) {
      drawEquipmentPart(ctx, mount, Boolean(slotsPalette));
    }
    ctx.restore();
  }

  ctx.restore();
}

function redrawAll() {
  if (builderCanvas) {
    const ctx = builderCanvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 600, 540);
      const style = getComputedStyle(builderCanvas);
      const slotPalette: SlotPalette = {
        dark: style.getPropertyValue("--color-void").trim() || "#080b13",
        lime: style.getPropertyValue("--color-acid-lime").trim() || "#d4ff00",
        ivory: style.getPropertyValue("--color-text").trim() || "#f0f4f8",
      };
      if (viewMode === "builder") {
        renderWaspCanvas(
          ctx,
          PREVIEW_CX,
          PREVIEW_CY,
          PREVIEW_SCALE,
          slotPalette,
        );
      } else {
        renderWaspCanvas(ctx, PREVIEW_CX, PREVIEW_CY, PREVIEW_SCALE);
      }
    }
  }

  if (flightCanvas) {
    const ctx = flightCanvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 320, 320);
      renderWaspCanvas(ctx, 160, 165, 3.6);
    }
  }
}

onMount(() => {
  loadCanvasFonts().then(() => {
    fontsLoaded = true;
  });
});

$effect(() => {
  void fontsLoaded;
  slotX;
  slotY;
  selectedKey;
  leftPart;
  rightPart;
  aftPart;
  viewMode;
  redrawAll();
});
</script>

<section class="wasp-slot-placer" aria-label={label}>
  <div class="controls-bar">
    <div class="slider-group">
      <div class="group-header">
        <span class="group-title">
          Side Equipment Slots (Q · Unlinked · Under Hull)
        </span>
        <div class="preset-btns">
          <button
            type="button"
            class="chip-btn"
            onclick={() => {
              slotX = 12.0;
              slotY = -1.5;
            }}
          >
            Approved (±12.0, −1.5)
          </button>
          <button
            type="button"
            class="chip-btn"
            onclick={() => {
              slotX = 13.5;
              slotY = 4.5;
            }}
          >
            Sketch Grid (±13.5, 4.5)
          </button>
          <button
            type="button"
            class="chip-btn"
            onclick={() => {
              slotX = 11.5;
              slotY = 4.5;
            }}
          >
            Wing Mid (±11.5, 4.5)
          </button>
          <button
            type="button"
            class="chip-btn"
            onclick={() => {
              slotX = 9.5;
              slotY = 3.0;
            }}
          >
            Inner Wing (±9.5, 3.0)
          </button>
        </div>
      </div>

      <div class="sliders-two-col">
        <label class="slider-row">
          <span>Wing Span |X|</span>
          <input
            type="range"
            min="5.0"
            max="16.5"
            step="0.25"
            bind:value={slotX}
          >
          <output>±{slotX.toFixed(2)}</output>
        </label>

        <label class="slider-row">
          <span>Fore / Aft Y</span>
          <input
            type="range"
            min="-8.0"
            max="14.0"
            step="0.25"
            bind:value={slotY}
          >
          <output>{slotY.toFixed(2)}</output>
        </label>
      </div>
    </div>

    <div class="Readout-strip">
      <span>
        Slot 01 (Left Q):
        <strong>({(-slotX).toFixed(2)}, {slotY.toFixed(2)})</strong>
      </span>
      <span>
        Slot 02 (Right Q):
        <strong>(+{slotX.toFixed(2)}, {slotY.toFixed(2)})</strong>
      </span>
      <span>
        Slot 03 (Rear E):
        <strong>(0.00, {ENGINE_MOUNT_Y.toFixed(2)})</strong>
      </span>
      <span> Stabilizers: <strong>Forced On (4 slits)</strong> </span>
    </div>
  </div>

  <div class="builder-workbench">
    <!-- Left: Real ShipBuilder Assembly Blueprint Canvas with Interactive Hit Targets -->
    <section class="assembly-panel" aria-label="Wasp builder assembly">
      <div class="panel-header">
        <div>
          <span class="eyebrow">SHIP BUILDER PREVIEW</span>
          <h4>LHI Wasp · 3 Independent Slots</h4>
        </div>
        <div class="view-switch">
          <button
            type="button"
            class="chip-btn"
            class:active={viewMode === "builder"}
            onclick={() => (viewMode = "builder")}
          >
            Builder Overlays
          </button>
          <button
            type="button"
            class="chip-btn"
            class:active={viewMode === "flight"}
            onclick={() => (viewMode = "flight")}
          >
            Flight Layering (Under Hull)
          </button>
        </div>
      </div>

      <div class="blueprint">
        <div class="grid-lines"></div>
        <canvas
          width="600"
          height="540"
          bind:this={builderCanvas}
          aria-label="LHI Wasp builder slot preview"
        ></canvas>
        {#each mounts as slot}
          <button
            type="button"
            class="mount-hit"
            title={slot.label}
            style:left={`${(PREVIEW_CX + slot.y * PREVIEW_SCALE) / 6}%`}
            style:top={`${(PREVIEW_CY - slot.x * PREVIEW_SCALE) / 5.4}%`}
            style:width={`${(((SLOT_STYLE.width + 2 * SLOT_STYLE.gap) / SLOT_STYLE.referenceScale) * PREVIEW_SCALE) / 6}%`}
            style:height={`${(((SLOT_STYLE.height + 2 * SLOT_STYLE.gap) / SLOT_STYLE.referenceScale) * PREVIEW_SCALE) / 5.4}%`}
            style:transform={`translate(-50%, -50%) rotate(${slot.angle}rad)`}
            aria-label={`${slot.label}: ${slot.part ? PARTS[slot.part].name : "Empty"}`}
            aria-pressed={selectedKey === slot.key}
            onclick={() => (selectedKey = slot.key)}
          ></button>
        {/each}
      </div>

      <p class="panel-note">
        Click any of the three mounts on the blueprint (`01`, `02`, or `03`) to
        select it and test different weapons or utilities. Neither side slot has
        a dashed link connector—each wing equips its own weapon or utility
        independently.
      </p>
    </section>

    <!-- Right: Compatible Parts Picker + Flight Under-Hull Preview -->
    <section
      class="inspector-panel"
      aria-label="Mount fitting and flight preview"
    >
      <div class="flight-mini-card">
        <div class="panel-header">
          <div>
            <span class="eyebrow">FLIGHT RENDER ORDER</span>
            <h4>Under-Canopy / Under-Wing Fitting</h4>
          </div>
          <span class="badge">Side Q drawn below hull</span>
        </div>
        <canvas
          width="320"
          height="320"
          bind:this={flightCanvas}
          class="flight-mini-canvas"
          aria-label="LHI Wasp flight render order showing side equipment underneath the wings"
        ></canvas>
        <p class="panel-note">
          In flight, slots <code>01</code> and <code>02</code> render
          <strong>underneath the hull</strong>
          (so railgun/laser barrels peek out from under the forward wing edge
          while the casing stays tucked under the wing), and slot
          <code>03</code>
          renders on top of the tail.
        </p>
      </div>

      <div class="parts-picker">
        <span class="eyebrow">SELECTED MOUNT</span>
        <h4>{activeMount.label}</h4>
        <div class="quick-parts-grid">
          {#each compatibleParts as part}
            <button
              type="button"
              class="part-card"
              class:installed={activeMount.part === part.id}
              onclick={() => installOnSelected(part.id)}
            >
              <span class="part-title">
                <strong>{part.name}</strong>
                <small>
                  {activeMount.part === part.id ? "FITTED" : part.category}
                </small>
              </span>
              <span class="part-meta">{part.mass} mass</span>
            </button>
          {/each}
          {#if activeMount.type !== "engine"}
            <button
              type="button"
              class="part-card clear-card"
              class:installed={activeMount.part === null}
              onclick={() => installOnSelected(null)}
            >
              <span class="part-title">
                <strong>Empty (Vacant)</strong>
                <small>{activeMount.part === null ? "VACANT" : "–"}</small>
              </span>
              <span class="part-meta"
                >Show {SLOT_TYPES[activeMount.type].symbol} symbol</span
              >
            </button>
          {/if}
        </div>
      </div>
    </section>
  </div>
</section>

<style>
.wasp-slot-placer {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1rem 0 1.75rem;
}

.controls-bar {
  padding: 0.9rem 1rem;
  background: var(--color-void-light, #141824);
  border: 1px solid var(--color-flight-trail, rgba(255, 255, 255, 0.14));
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.group-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.group-title {
  font-family: var(--font-mono, monospace);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-acid-lime, #d4ff00);
}

.preset-btns,
.view-switch {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.chip-btn {
  font-family: var(--font-mono, monospace);
  font-size: 0.72rem;
  padding: 0.28rem 0.55rem;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(8, 11, 19, 0.8);
  color: var(--color-text, #f0f4f8);
  cursor: pointer;
}

.chip-btn:hover,
.chip-btn.active {
  border-color: var(--color-acid-lime, #d4ff00);
  color: var(--color-acid-lime, #d4ff00);
}

.sliders-two-col {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.85rem;
}

.slider-row {
  display: grid;
  grid-template-columns: 7rem 1fr 4.2rem;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono, monospace);
  font-size: 0.76rem;
  color: var(--color-text-dim, #94a3b8);
}

.slider-row input[type="range"] {
  width: 100%;
  accent-color: var(--color-acid-lime, #d4ff00);
}

.slider-row output {
  text-align: right;
  font-weight: 700;
  color: var(--color-text, #f0f4f8);
}

.Readout-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
  padding-top: 0.55rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-family: var(--font-mono, monospace);
  font-size: 0.75rem;
  color: var(--color-text-dim, #94a3b8);
}

.Readout-strip strong {
  color: var(--color-text, #f0f4f8);
}

.builder-workbench {
  display: grid;
  grid-template-columns: minmax(340px, 1.35fr) minmax(280px, 1fr);
  gap: 1rem;
  align-items: start;
}

@media (max-width: 860px) {
  .builder-workbench {
    grid-template-columns: 1fr;
  }
}

.assembly-panel,
.inspector-panel {
  border: 1px solid var(--color-flight-trail, rgba(255, 255, 255, 0.14));
  padding: 1rem;
  background: var(--color-void-light, #141824);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.eyebrow {
  display: block;
  color: var(--color-acid-lime, #d4ff00);
  font-family: var(--font-mono, monospace);
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

h4 {
  margin: 0.15rem 0 0;
  font-size: 1rem;
  color: var(--color-text, #f0f4f8);
}

.badge {
  font-family: var(--font-mono, monospace);
  font-size: 0.68rem;
  padding: 0.2rem 0.45rem;
  border: 1px solid rgba(212, 255, 0, 0.35);
  color: var(--color-acid-lime, #d4ff00);
  background: rgba(212, 255, 0, 0.08);
}

.blueprint {
  position: relative;
  aspect-ratio: 600 / 540;
  width: 100%;
  max-width: 533px;
  margin: 0 auto;
  background: var(--color-void, #080b13);
}

.blueprint canvas {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
}

.grid-lines {
  position: absolute;
  inset: 0;
  opacity: 0.2;
  background-image:
    linear-gradient(#537079 1px, transparent 1px),
    linear-gradient(90deg, #537079 1px, transparent 1px);
  background-size: 30px 30px;
}

.mount-hit {
  position: absolute;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.mount-hit:focus-visible {
  outline: 3px solid var(--color-text, #f0f4f8);
  outline-offset: 4px;
}

.flight-mini-card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.flight-mini-canvas {
  width: 100%;
  max-width: 280px;
  aspect-ratio: 1 / 1;
  margin: 0 auto;
  display: block;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(97, 147, 169, 0.14),
    rgba(8, 11, 19, 0.95) 75%
  );
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.parts-picker {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quick-parts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.45rem;
  margin-top: 0.25rem;
}

.part-card {
  text-align: left;
  background: rgba(8, 11, 19, 0.65);
  color: var(--color-text, #f0f4f8);
  border: 1px solid var(--color-flight-trail, rgba(255, 255, 255, 0.14));
  padding: 0.55rem 0.65rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.part-card:hover,
.part-card.installed {
  border-color: var(--color-acid-lime, #d4ff00);
}

.part-card.installed {
  background: var(--color-void, #080b13);
}

.part-title {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.35rem;
  font-size: 0.8rem;
}

.part-title small {
  font-family: var(--font-mono, monospace);
  font-size: 0.68rem;
  color: var(--color-acid-lime, #d4ff00);
}

.part-meta {
  font-size: 0.72rem;
  color: var(--color-text-dim, #94a3b8);
}

.panel-note {
  margin: 0;
  font-size: 0.76rem;
  line-height: 1.5;
  color: var(--color-text-dim, #94a3b8);
}
</style>
