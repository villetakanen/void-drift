<script lang="ts">
import { COLOR, drawStar, SUN_CONFIG } from "@void-drift/core";
import {
  BUILD_FLIGHT_SCALE,
  defaultLoadout,
  drawBuild,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import { activeArcs, activeAtmosphere, activeSurface } from "./active-star-art";

let {
  kind,
  label,
  moments,
}: {
  kind: "sun" | "giant" | "flare" | "ember" | "pulsar";
  label: string;
  moments: [string, string, string];
} = $props();
let canvas: HTMLCanvasElement;

onMount(() => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const width = 1040,
    height = 276;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  ctx.fillStyle = COLOR.void;
  ctx.fillRect(0, 0, width, height);
  const ship = defaultLoadout("wasp");

  const line = (points: number[][], color: string, weight = 1) => {
    ctx.beginPath();
    for (const [i, point] of points.entries()) {
      if (i === 0) ctx.moveTo(point[0], point[1]);
      else ctx.lineTo(point[0], point[1]);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = weight;
    ctx.stroke();
  };
  const disc = (r: number, color: string) => {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };
  const halo = (r: number, color: string) => {
    const g = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r * 2.5);
    g.addColorStop(0, color);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(-r * 2.5, -r * 2.5, r * 5, r * 5);
  };
  const star = (r: number, phase: number) => {
    if (kind === "sun") {
      drawStar(ctx, {
        x: 0,
        y: 0,
        radius: r,
        color: SUN_CONFIG.G.color,
        glowColor: SUN_CONFIG.G.glowColor,
        pulseSpeed: SUN_CONFIG.G.pulseSpeed,
        time: 700 + phase * 450,
      });
    }
    if (kind === "giant") {
      halo(r, "#b9dfff45");
      // Irregular luminous texture avoids suggesting a banded gas planet.
      disc(r, "#edf5ff");
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.clip();
      for (let i = 0; i < 95; i++) {
        const a = i * 2.39996;
        const d = r * Math.sqrt((i + 0.5) / 95);
        const x = Math.cos(a) * d,
          y = Math.sin(a) * d;
        ctx.beginPath();
        for (let j = 0; j < 7; j++) {
          const angle = (j * Math.PI) / 3 + a;
          const size = r * (0.07 + ((i + j) % 4) * 0.02);
          const px = x + Math.cos(angle) * size;
          const py = y + Math.sin(angle) * size;
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.fillStyle = i % 3 ? "#ffffff80" : "#bed7ee65";
        ctx.fill();
      }
      ctx.restore();
      // Material streaming away, rather than the Sun's closed concentric rings.
      for (let i = 0; i < 33; i++) {
        const a = i * 2.39996,
          d = r * (1.15 + ((i + phase * 3) % 9) / 8);
        const length = r * (0.1 + (i % 4) * 0.08);
        line(
          [
            [Math.cos(a) * d, Math.sin(a) * d],
            [Math.cos(a) * (d + length), Math.sin(a) * (d + length)],
          ],
          "#b4d7ff65",
        );
      }
    }
    if (kind === "flare") {
      const activity = [0.25, 1, 0.35][phase];
      activeSurface(ctx, r, activity);
      activeAtmosphere(ctx, r, activity);
      activeArcs(ctx, r, activity);
    }
    if (kind === "ember") {
      // The debris belongs to this particular remnant, not all white dwarfs.
      for (let i = 0; i < 65; i++) {
        const base = (i * 2.39996) % (Math.PI * 2);
        if (base > 0.1 && base < 0.95) continue;
        const a = base + phase * 0.5;
        const d = r * (3.6 + (i % 6) * 0.28);
        const x = Math.cos(a) * d,
          y = Math.sin(a) * d * 0.6;
        ctx.fillStyle = i % 5 === 0 ? "#e8c0a3" : "#907967";
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a);
        ctx.fillRect(-1, -1, i % 5 === 0 ? 4 : 2, 1.5);
        ctx.restore();
      }
      ctx.beginPath();
      ctx.ellipse(
        0,
        0,
        r * 4.2,
        r * 2.52,
        0,
        1 + phase * 0.5,
        2.3 + phase * 0.5,
      );
      ctx.strokeStyle = "#eac9aa55";
      ctx.lineWidth = 2;
      ctx.stroke();
      halo(r * 1.8, "#c4e6ff48");
      disc(r, "#f1faff");
      line(
        [
          [-r * 1.8, 0],
          [r * 1.8, 0],
        ],
        "#e3f5ffb0",
      );
      line(
        [
          [0, -r * 1.8],
          [0, r * 1.8],
        ],
        "#e3f5ffb0",
      );
    }
    if (kind === "pulsar") {
      ctx.save();
      ctx.rotate([-0.65, 0, 0.65][phase]);
      for (const direction of [1, -1]) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(direction * r * 17, -r * 3.5);
        ctx.lineTo(direction * r * 17, r * 3.5);
        ctx.closePath();
        ctx.fillStyle = "#bca5ff25";
        ctx.fill();
        line(
          [
            [0, 0],
            [direction * r * 18, 0],
          ],
          "#d4c7ffbb",
          1.5,
        );
      }
      ctx.restore();
      halo(r * 2, "#9b8aff38");
      disc(r, "#f4f0ff");
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 3, r * 1.2, -0.65, 0, Math.PI * 2);
      ctx.strokeStyle = "#ab9ada80";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };

  const radii = { sun: 23, giant: 42, flare: 24, ember: 9, pulsar: 8 };
  const labels = ["CLOSE / CHARACTER", ...moments];
  for (let panel = 0; panel < 4; panel++) {
    const x = panel * 260;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, 0, 260, height);
    ctx.clip();
    ctx.fillStyle = COLOR.textMuted;
    ctx.font = "11px monospace";
    ctx.fillText(labels[panel], x + 16, 24);
    for (let i = 0; i < 22; i++) {
      ctx.fillStyle = i % 3 ? "#ffffff20" : "#ffffff40";
      ctx.fillRect(x + ((i * 73.7 + 19) % 250), 45 + ((i * 91.3) % 200), 1, 1);
    }
    ctx.translate(x + (panel === 0 ? 130 : 105), 148);
    star(
      panel === 0
        ? kind === "ember" || kind === "pulsar"
          ? 18
          : 58
        : radii[kind],
      panel === 0 ? 0 : panel - 1,
    );
    if (panel > 0) {
      // A shared production Wasp, fixed in place: this is a storyboard, not a flight trace.
      drawBuild(ctx, ship, 102, 0, Math.PI, BUILD_FLIGHT_SCALE);
    }
    ctx.restore();
    if (panel > 0)
      line(
        [
          [x, 10],
          [x, height - 10],
        ],
        COLOR.border,
      );
  }
});
</script>

<canvas bind:this={canvas} aria-label={label}>
  {label}. Close view followed by {moments.join(", ")}.
</canvas>

<style>
canvas {
  display: block;
  width: 100%;
  aspect-ratio: 1040 / 276;
  border: 1px solid var(--color-border);
  background: var(--color-void);
}
</style>
