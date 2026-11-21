<script lang="ts">
import {
  CloudBodyPainter,
  COLOR,
  canvasFont,
  drawStar,
  drawSunFields,
  drawWorldGravity,
  drawWorldLabel,
  drawWorldOrbit,
  getPlanetInfluenceRadius,
  massWellReach,
} from "@void-drift/core";
import {
  BUILD_FLIGHT_SCALE,
  drawBuild,
  type FlightLayerId,
  GRAVITY_TUNING,
  Simulation,
  starterLoadout,
  stockSettings,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import { loadPracticeMercury } from "../../../lib/assets/rock-planets/authored-materials";
import { SphericalSurface } from "../../../lib/assets/rock-planets/spherical-surface";
import FlightLayers from "../../FlightLayers.svelte";
import { cloudAtlas } from "./cloud-material";

let {
  zoom = 0.7,
  relativeHud = false,
  turnSeconds = 0,
  venusMass,
}: {
  zoom?: number;
  relativeHud?: boolean;
  turnSeconds?: number;
  venusMass?: number;
} = $props();
let canvases = $state<Partial<Record<FlightLayerId, HTMLCanvasElement>>>({});
let error = $state("");
onMount(() => {
  let disposed = false;
  let raf = 0;
  loadPracticeMercury()
    .then((mercury) => {
      if (disposed) return;
      const world = canvases.world?.getContext("2d");
      const lfx = canvases.lfx?.getContext("2d");
      if (!world || !lfx) throw new Error("Scene layers unavailable");
      const width = 1000,
        height = 480;
      const dpr = window.devicePixelRatio || 1;
      for (const canvas of Object.values(canvases)) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
      const sim = new Simulation({
        ...stockSettings("wasp"),
        mode: "practice",
        seed: 71,
      });
      // Historical study comparisons retain their original Mercury mass.
      const referenceMercury = sim.planets.find((p) => p.id === "moon");
      if (referenceMercury?.massWell) referenceMercury.massWell.mass = 1450;
      const star = sim.star;
      const sx = star.pos.x,
        sy = star.pos.y;
      const radius = relativeHud ? 27 * (1 + (12104 / 4879 - 1) / 3) : 30;
      const orbit = (258 * 108.2) / 57.9;
      const venusAngle = 0.14;
      const vx = sx + (relativeHud ? Math.cos(venusAngle) * orbit : 365),
        vy = sy + (relativeHud ? Math.sin(venusAngle) * orbit : 50);
      const shipOffset = radius + 35;
      const mx = sx + Math.cos(-0.6) * 258,
        my = sy + Math.sin(-0.6) * 258;
      const centreX =
          sx + (relativeHud ? (zoom < 0.5 ? 0 : 190) : zoom > 1 ? 285 : 170),
        centreY = sy;
      const surface = new SphericalSurface(cloudAtlas(true, "amber"), "atlas");
      const venus = new CloudBodyPainter([surface.canvas]);
      const draw = (seconds: number) => {
        world.canvas.dataset.cloudSeconds = String(seconds);
        surface.draw(turnSeconds ? (seconds * 2 * Math.PI) / turnSeconds : 0);
        for (const ctx of [world, lfx]) {
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
        world.setTransform(dpr, 0, 0, dpr, 0, 0);
        world.fillStyle = COLOR.void;
        world.fillRect(0, 0, width, height);
        for (const ctx of [world, lfx]) {
          ctx.setTransform(
            dpr * zoom,
            0,
            0,
            dpr * zoom,
            dpr * (width / 2 - centreX * zoom),
            dpr * (height / 2 - centreY * zoom),
          );
        }
        drawSunFields(
          world,
          star,
          { collecting: false, damaging: false },
          width / zoom,
        );
        if (relativeHud) {
          world.save();
          world.setTransform(dpr, 0, 0, dpr, 0, 0);
          const cx = width / 2 + (sx - centreX) * zoom,
            cy = height / 2 + (sy - centreY) * zoom;
          drawWorldOrbit(world, cx, cy, 258 * zoom);
          drawWorldOrbit(world, cx, cy, orbit * zoom);
          const planet = sim.planets.find((p) => p.id === "moon");
          if (planet)
            drawWorldGravity(
              world,
              width / 2 + (mx - centreX) * zoom,
              height / 2 + (my - centreY) * zoom,
              getPlanetInfluenceRadius(planet) * zoom,
            );
          world.restore();
          if (venusMass !== undefined) {
            world.save();
            world.setTransform(dpr, 0, 0, dpr, 0, 0);
            drawWorldGravity(
              world,
              width / 2 + (vx - centreX) * zoom,
              height / 2 + (vy - centreY) * zoom,
              massWellReach(
                venusMass,
                GRAVITY_TUNING.cutoff,
                GRAVITY_TUNING.falloff,
              ) * zoom,
            );
            world.restore();
          }
        }
        drawStar(world, {
          x: sx,
          y: sy,
          radius: star.radius,
          color: star.color,
          glowColor: star.glowColor,
          appearance: star.appearance,
          time: 0,
        });
        // Same production material and directional mask, separate World/LFX canvases.
        mercury.painter.body(world, 0, mx, my, 27);
        mercury.painter.light(lfx, mx, my, 27, sx, sy);
        venus.body(world, 0, vx, vy, radius);
        venus.light(lfx, vx, vy, radius, sx, sy);
        venus.atmosphere(world, vx, vy, radius, sx, sy, zoom);
        drawBuild(
          world,
          starterLoadout("wasp"),
          vx + shipOffset,
          vy + 30,
          -Math.PI / 2,
          BUILD_FLIGHT_SCALE,
          "",
        );
        world.setTransform(dpr, 0, 0, dpr, 0, 0);
        world.fillStyle = COLOR.textMuted;
        world.font = canvasFont(13);
        const label = (text: string, x: number, y: number) =>
          world.fillText(
            text,
            width / 2 + (x - centreX) * zoom,
            height / 2 + (y - centreY) * zoom,
          );
        if (relativeHud) {
          drawWorldLabel(
            world,
            "Mercury",
            width / 2 + (mx - centreX) * zoom,
            height / 2 + (my - centreY) * zoom,
            27 * zoom,
            -0.6,
          );
          drawWorldLabel(
            world,
            "Venus",
            width / 2 + (vx - centreX) * zoom,
            height / 2 + (vy - centreY) * zoom,
            radius * zoom,
            venusAngle,
          );
        } else {
          label("Mercury", mx + 36, my);
          label("Venus · fixture", vx - 30, vy + 70);
        }
        label("Wasp", vx + shipOffset + 15, vy + 45);
        world.fillText(
          `${zoom.toFixed(1)} px/u · ${turnSeconds ? `${turnSeconds}s cloud turn · orbit held` : "static composition · provisional placement"}`,
          20,
          height - 20,
        );
      };
      draw(0);
      if (turnSeconds) {
        const start = performance.now();
        let previous = -1;
        const frame = (now: number) => {
          if (disposed) return;
          const tick = Math.floor(((now - start) / 1000) * 20);
          if (tick !== previous) {
            draw(tick / 20);
            previous = tick;
          }
          raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
      }
    })
    .catch((e: unknown) => {
      if (!disposed)
        error = e instanceof Error ? e.message : "Scene unavailable";
    });
  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
  };
});
</script>
<div class="scene">
  <FlightLayers
    fxGlow={false}
    bind:canvases
    label={`Venus, Mercury, G7 Sun and fitted Wasp at ${zoom} pixels per world unit`}
  />
</div>
{#if error}
  <p role="alert">{error}</p>
{/if}
<style>
.scene {
  width: 1000px;
  max-width: 100%;
  aspect-ratio: 1000 / 480;
  position: relative;
  border: 1px solid var(--color-border);
  margin-block: var(--spacing-lg);
}
</style>
