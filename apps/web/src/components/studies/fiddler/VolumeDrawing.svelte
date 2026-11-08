<script lang="ts">
import { COLOR, canvasFont } from "@void-drift/core";
import {
  defaultLoadout,
  drawBuild,
  drawStabilizerSlits,
  drawUtilityArtwork,
  ENGINE_ART,
  SLOT_STYLE,
  SLOT_TYPES,
} from "@void-drift/mode-a";
import { corvetteVolume, type VolumeVariant } from "./corvette-volume";
import { LHI_FORM, type LhiFace } from "./lhi-form";

let {
  variant,
  view = "Hull",
  scale = 2.65,
  width = 420,
  height = 360,
  label,
}: {
  variant: VolumeVariant | "previous" | "wasp";
  view?: string;
  scale?: number;
  width?: number;
  height?: number;
  label: string;
} = $props();
let canvas: HTMLCanvasElement;
$effect(() => {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  if (variant === "wasp") {
    drawBuild(
      ctx,
      defaultLoadout("wasp"),
      width / 2,
      height / 2,
      -Math.PI / 2,
      scale,
      "",
      undefined,
      [],
    );
    return;
  }
  ctx.translate(width / 2, height / 2);
  ctx.scale(scale, scale);
  const polygon = (face: LhiFace) => {
    ctx.beginPath();
    face.points.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = face.color;
    ctx.fill();
  };
  if (variant === "previous") {
    for (const face of LHI_FORM.heavy) polygon(face);
    return;
  }
  const model = corvetteVolume(variant);
  if (view === "Lineage") ctx.globalAlpha = 0.18;
  for (const face of model.faces) polygon(face);
  ctx.globalAlpha = 1;
  if (view === "Lineage") {
    for (const face of model.inherited) polygon(face);
    return;
  }
  ctx.save();
  ctx.rotate(-Math.PI / 2);
  drawStabilizerSlits(ctx, model.front);
  drawStabilizerSlits(ctx, model.rear);
  ctx.restore();
  for (const mount of model.mounts) {
    if (view === "Mounts") {
      const w = SLOT_STYLE.width / SLOT_STYLE.referenceScale,
        h = SLOT_STYLE.height / SLOT_STYLE.referenceScale;
      ctx.fillStyle = COLOR.void;
      ctx.fillRect(mount.x - w / 2, mount.y - h / 2, w, h);
      ctx.fillStyle = COLOR.text;
      ctx.font = canvasFont(4.5, 700);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(SLOT_TYPES[mount.type].symbol, mount.x, mount.y);
    } else if (view === "Fitted") {
      ctx.save();
      ctx.translate(mount.x, mount.y);
      ctx.rotate(-Math.PI / 2);
      if (mount.type === "engine") {
        for (const face of ENGINE_ART["heavy-ion"][3]) polygon(face);
      } else drawUtilityArtwork(ctx, mount.y < 0 ? "storage" : "solar");
      ctx.restore();
    }
  }
});
</script>
<canvas
  bind:this={canvas}
  style={`width:${width}px;max-width:100%;aspect-ratio:${width}/${height}`}
  aria-label={label}
  >{label}</canvas
>
<style>
canvas {
  display: block;
  height: auto;
  margin-inline: auto;
}
</style>
