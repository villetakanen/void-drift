<script lang="ts">
import {
  COLOR,
  drawShip,
  FX_INK,
  type FxPass,
  FxSurface,
  Renderer,
} from "@void-drift/core";
import { onMount } from "svelte";

// Study-scoped face; self-hosted beside the study (SIL OFL 1.1, see OFL.txt).
const SAIRA = "/studies/run-countdown-2026-11-05/saira-stencil-700-latin.woff2";
const W = 1920;
const H = 1080;
const LEAD = 0.6;
const FINAL = 0.6;
const TAIL = 1.2;

const variants = [
  {
    id: "held",
    title: "A / Held stamp",
    note: "Each digit is stamped steadily for 0.8 s, then stops. The shared surface decay alone fades it before the next digit.",
  },
  {
    id: "ignition",
    title: "B / Ignition",
    note: "Each digit strikes like a neon tube: a deterministic flicker with a sideways interference slip, then steady light.",
  },
  {
    id: "approach",
    title: "C / Approach",
    note: "Each digit grows towards the viewer through its second. The persistent surface turns that motion into an echo trail.",
  },
] as const;
const inks = [
  { id: "android", label: "Android green" },
  { id: "ion", label: "Ion mint" },
  { id: "lime", label: "Brand lime" },
] as const;
const faces = [
  { id: "saira", label: "Saira Stencil", css: '"Saira Stencil"' },
  { id: "b612", label: "B612 Mono (UI face)", css: '"B612 Mono"' },
] as const;
const scenes = [
  { id: "void", label: "Void" },
  { id: "stars", label: "Starfield" },
  { id: "ship", label: "Starfield and ship" },
] as const;

let { label = "Run countdown comparison" }: { label?: string } = $props();
let variant = $state<(typeof variants)[number]["id"]>("ignition");
let ink = $state<(typeof inks)[number]["id"]>("android");
let face = $state<(typeof faces)[number]["id"]>("saira");
let scene = $state<(typeof scenes)[number]["id"]>("ship");
let ending = $state<"GO" | "0">("GO");
let placement = $state<"centre" | "above">("centre");
let ring = $state(false);
let loop = $state(true);
let readout = $state("");
let canvas: HTMLCanvasElement;
let started = 0;

const current = $derived(variants.find((v) => v.id === variant) ?? variants[0]);

function replay() {
  started = performance.now();
}

onMount(() => {
  canvas.width = W;
  canvas.height = H;
  const renderer = new Renderer(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const surface = new FxSurface();
  const stamps = new Map<string, HTMLCanvasElement>();
  const android = getComputedStyle(document.documentElement)
    .getPropertyValue("--color-android-green")
    .trim();
  const inkColour = () =>
    ink === "android" ? android : ink === "lime" ? COLOR.brand : FX_INK.ion;
  const font = new FontFace("Saira Stencil", `url(${SAIRA})`, {
    weight: "700",
  });
  document.fonts.add(font);
  let ready = false;
  Promise.all([font.load(), document.fonts.load('700 100px "B612 Mono"')])
    .catch(() => undefined)
    .finally(() => {
      ready = true;
      replay();
    });

  /** A complete luminous glyph: halo, ink body and a hot core, built once. */
  function stamp(text: string) {
    const fontCss = faces.find((f) => f.id === face)?.css ?? "sans-serif";
    const colour = inkColour();
    const key = `${text}|${fontCss}|${colour}`;
    const cached = stamps.get(key);
    if (cached) return cached;
    const size = 420;
    const pad = 90;
    const probe = document.createElement("canvas").getContext("2d");
    if (!probe) throw new Error("Canvas 2D unavailable");
    probe.font = `700 ${size}px ${fontCss}`;
    const width = Math.ceil(probe.measureText(text).width) + pad * 2;
    const out = document.createElement("canvas");
    out.width = width;
    out.height = size + pad * 2;
    const c = out.getContext("2d");
    if (!c) throw new Error("Canvas 2D unavailable");
    c.font = probe.font;
    c.textAlign = "center";
    c.textBaseline = "middle";
    const x = width / 2;
    const y = out.height / 2 + size * 0.04;
    c.fillStyle = colour;
    c.shadowColor = colour;
    c.shadowBlur = 48;
    c.globalAlpha = 0.55;
    c.fillText(text, x, y);
    c.shadowBlur = 0;
    c.globalAlpha = 1;
    c.fillText(text, x, y);
    c.globalCompositeOperation = "lighter";
    c.globalAlpha = 0.3;
    c.fillStyle = FX_INK.core;
    c.fillText(text, x, y);
    stamps.set(key, out);
    return out;
  }

  function paint(
    target: CanvasRenderingContext2D,
    pass: FxPass,
    text: string,
    cx: number,
    cy: number,
    scale: number,
    intensity: number,
  ) {
    if (intensity <= 0 || !pass.budget.take(true)) return;
    const image = stamp(text);
    const w = image.width * scale;
    const h = image.height * scale;
    target.globalAlpha = Math.min(1, pass.opacity * intensity);
    target.drawImage(image, cx - w / 2, cy - h / 2, w, h);
  }

  /** Deterministic flicker: on/off per 1/30 s step within the strike. */
  function strike(local: number) {
    if (local > 0.28) return 1;
    const step = Math.floor(local * 30);
    const hash = (Math.imul(step + 7, 2654435761) >>> 0) % 5;
    return hash < 2 ? 0 : hash === 4 ? 0.5 : 1;
  }

  function emit(target: CanvasRenderingContext2D, pass: FxPass, t: number) {
    const cx = W / 2;
    const cy = placement === "centre" ? H / 2 : H / 2 - 300;
    const baseScale = placement === "centre" ? 1 : 0.62;
    if (t < 0) return;
    if (t < 3) {
      const digit = String(3 - Math.floor(t));
      const local = t % 1;
      if (variant === "held") {
        if (local < 0.8) paint(target, pass, digit, cx, cy, baseScale, 0.45);
      } else if (variant === "ignition") {
        if (local < 0.8) {
          const on = strike(local);
          const slip = on === 0.5 ? 18 : 0;
          paint(target, pass, digit, cx + slip, cy, baseScale, 0.45 * on);
        }
      } else {
        const scale = baseScale * (0.55 + local * 0.9);
        const fade = local < 0.7 ? 0.5 : 0.5 * (1 - (local - 0.7) / 0.3);
        paint(target, pass, digit, cx, cy, scale, fade);
      }
      return;
    }
    const local = t - 3;
    if (local < FINAL) {
      const scale =
        variant === "approach" ? baseScale * (1.1 + local * 1.2) : baseScale;
      paint(target, pass, ending, cx, cy, scale, local < 0.4 ? 0.6 : 0);
      if (ring && local < 0.45 && pass.budget.take(true)) {
        const radius = 120 + (local / 0.45) * 900;
        // A full-strength stamp each frame: the decay leaves a ripple of rings.
        target.globalAlpha = 0.6 * (1 - local / 0.45);
        target.strokeStyle = inkColour();
        target.lineWidth = 6;
        target.beginPath();
        target.arc(cx, cy, radius, 0, Math.PI * 2);
        target.stroke();
      }
    }
  }

  let frame = 0;
  const draw = (now: number) => {
    frame = requestAnimationFrame(draw);
    if (!ready) return;
    let elapsed = (now - started) / 1000;
    const total = LEAD + 3 + FINAL + TAIL;
    if (elapsed > total && loop) {
      started = now;
      elapsed = 0;
    }
    const t = Math.min(elapsed, total) - LEAD;
    renderer.clear();
    if (scene !== "void") renderer.drawBackground();
    if (scene === "ship")
      drawShip(ctx, {
        x: W / 2,
        y: H / 2,
        rotation: -Math.PI / 2,
        variant: "wasp",
        size: 1.4,
      });
    ctx.resetTransform();
    surface.draw(ctx, Math.min(elapsed, total), (target, pass) =>
      emit(target, pass, t),
    );
    readout =
      t < 0
        ? "Ready"
        : t < 3
          ? `Count ${3 - Math.floor(t)} · ${(t % 1).toFixed(2)} s`
          : t < 3 + FINAL
            ? `${ending} · control live`
            : "Flying";
  };
  frame = requestAnimationFrame(draw);
  return () => {
    cancelAnimationFrame(frame);
    document.fonts.delete(font);
  };
});

$effect(() => {
  variant;
  ink;
  face;
  ending;
  placement;
  replay();
});
</script>

<section class="countdown" aria-label={label}>
  <div class="controls">
    <fieldset>
      <legend>Motion</legend>
      {#each variants as item}
        <label
          ><input type="radio" value={item.id} bind:group={variant}>
          {item.title}</label
        >
      {/each}
    </fieldset>
    <fieldset>
      <legend>Ink</legend>
      {#each inks as item}
        <label
          ><input type="radio" value={item.id} bind:group={ink}>
          {item.label}</label
        >
      {/each}
    </fieldset>
    <fieldset>
      <legend>Typeface</legend>
      {#each faces as item}
        <label
          ><input type="radio" value={item.id} bind:group={face}>
          {item.label}</label
        >
      {/each}
    </fieldset>
    <fieldset>
      <legend>Final mark</legend>
      <label><input type="radio" value="GO" bind:group={ending}> GO</label>
      <label><input type="radio" value="0" bind:group={ending}> 0</label>
    </fieldset>
    <fieldset>
      <legend>Placement</legend>
      <label
        ><input type="radio" value="centre" bind:group={placement}>
        Centred on the ship</label
      >
      <label
        ><input type="radio" value="above" bind:group={placement}>
        Smaller, above the ship</label
      >
    </fieldset>
    <fieldset>
      <legend>Scene</legend>
      {#each scenes as item}
        <label
          ><input type="radio" value={item.id} bind:group={scene}>
          {item.label}</label
        >
      {/each}
    </fieldset>
    <fieldset>
      <legend>Options</legend>
      <label><input type="checkbox" bind:checked={ring}> Launch ring</label>
      <label><input type="checkbox" bind:checked={loop}> Loop</label>
      <button type="button" onclick={replay}>Replay</button>
    </fieldset>
  </div>
  <figure>
    <canvas
      bind:this={canvas}
      aria-label={`${current.title}: countdown 3, 2, 1, ${ending} painted as light on the effects surface`}
    ></canvas>
    <figcaption>
      <strong>{current.title}</strong>
      <span>{current.note}</span>
      <output aria-live="off">{readout}</output>
    </figcaption>
  </figure>
</section>

<style>
.countdown {
  display: grid;
  gap: var(--spacing-md);
  margin-block: var(--spacing-lg);
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  font: var(--font-size-caption) var(--font-family-ui);
}
fieldset {
  display: grid;
  gap: var(--spacing-xs);
  align-content: start;
  margin: 0;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
}
legend {
  color: var(--color-text-muted);
  padding-inline: var(--spacing-xs);
}
label {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}
input {
  accent-color: var(--color-selected);
}
button {
  margin-top: var(--spacing-xs);
  font: inherit;
  color: var(--color-on-brand);
  background: var(--color-action);
  border: 0;
  padding: var(--spacing-xs) var(--spacing-md);
  cursor: pointer;
}
figure {
  margin: 0;
}
canvas {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 1px solid var(--color-border);
  background: var(--color-void);
}
figcaption {
  display: flex;
  gap: var(--spacing-md);
  align-items: baseline;
  padding-top: var(--spacing-sm);
  font: var(--font-size-caption) var(--font-family-ui);
  color: var(--color-text-muted);
}
figcaption strong {
  color: var(--color-text);
  white-space: nowrap;
}
output {
  margin-left: auto;
  white-space: nowrap;
}
</style>
