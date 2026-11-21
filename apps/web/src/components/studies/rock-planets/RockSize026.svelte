<script lang="ts">
import {
  COLOR,
  canvasFont,
  drawStar,
  drawSunFields,
  drawWorldGravity,
  drawWorldLabel,
  drawWorldOrbit,
  getPlanetInfluenceRadius,
  RockBodyPainter,
  updatePlanetOrbit,
} from "@void-drift/core";
import {
  applyYellowFamilyProfile,
  type FlightLayerId,
  MERCURIAL_ROCK_RADIUS,
  PRACTICE_MERCURY_ORBIT,
  Simulation,
  stockSettings,
  YELLOW_FAMILY_RADIUS,
} from "@void-drift/mode-a";
import { onMount, untrack } from "svelte";
import FlightLayers from "../../FlightLayers.svelte";
import RingSlider from "../../inputs/RingSlider.svelte";
import { loadAuthoredRockMaterials } from "./authored-materials";
import { quiltMineralMaterial } from "./quilted-material";
import { SphericalSurface } from "./spherical-surface";
import "@void-drift/core/styles/buttons.css";

let {
  label = "Mercury size and safe orbital placement",
  hud = false,
}: { label?: string; hud?: boolean } = $props();

const motionDuration = untrack(() => (hud ? 480 : 120));

const sim = new Simulation({ ...stockSettings(), mode: "practice" });
const mercury = sim.planets.find((planet) => planet.id === "moon");
if (!mercury) throw new Error("Practice Mercury unavailable");
const mercuryGravityReach = getPlanetInfluenceRadius(mercury);
let sunRadius = $state(70),
  planetRadius = $state(MERCURIAL_ROCK_RADIUS.practice),
  orbitRadius = $state(PRACTICE_MERCURY_ORBIT);
let speed = $state(4),
  zoom = $state(0.7),
  seconds = $state(0),
  playing = $state(false);
let ready = $state(false),
  failed = $state("");
let resetSerial = $state(0);
let showName = $state(true),
  showOrbit = $state(true),
  showGravity = $state(true);
let layers = $state<Partial<Record<FlightLayerId, HTMLCanvasElement>>>({});
// Derive field geometry through the same owner as production; no copied scaling law.
const profile = $derived.by(() => {
  applyYellowFamilyProfile(sim.star, sunRadius, sim.gravity);
  const danger = sim.star.damageField,
    charge = sim.star.collectionField;
  if (!danger || !charge) throw new Error("Yellow-family fields unavailable");
  return {
    danger: danger.reach,
    charge: charge.reach,
    gravity: sim.star.influenceRadius,
  };
});
const minOrbit = $derived(
  Math.ceil(Math.max(sunRadius, profile.danger) + planetRadius + 1),
);
const maxOrbit = $derived(Math.floor(profile.charge + planetRadius - 1));
$effect(() => {
  orbitRadius = Math.max(minOrbit, Math.min(maxOrbit, orbitRadius));
});
const clearance = $derived(orbitRadius - planetRadius - profile.danger);
const penetration = $derived(profile.charge - (orbitRadius - planetRadius));
const period = $derived((Math.PI * 2 * orbitRadius) / speed);
const clipped = $derived((orbitRadius + planetRadius) * zoom > 310);

onMount(() => {
  let disposed = false,
    raf = 0;
  loadAuthoredRockMaterials()
    .then((materials) => {
      if (disposed) return;
      const surface = new SphericalSurface(
        quiltMineralMaterial(materials[0], 153),
        "atlas",
      );
      const painter = new RockBodyPainter([surface.canvas]);
      for (const canvas of Object.values(layers)) {
        canvas.width = 720;
        canvas.height = 680;
      }
      const world = layers.world?.getContext("2d"),
        fx = layers.fx?.getContext("2d"),
        lfx = layers.lfx?.getContext("2d");
      if (!world || !fx || !lfx)
        throw new Error("Size instrument layers unavailable");
      const planet = mercury;
      let last = performance.now(),
        signature = "",
        phase = -0.6,
        previousSeconds = 0,
        seenReset = 0;
      const draw = (now: number) => {
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        if (playing) {
          seconds = Math.min(motionDuration, seconds + dt);
          if (seconds >= motionDuration) playing = false;
        }
        // Integrate the real orbital law over each time change. Editing radius
        // or speed retains phase rather than reinterpreting all elapsed time.
        if (seenReset !== resetSerial) {
          phase = -0.6;
          previousSeconds = 0;
          seenReset = resetSerial;
          signature = "";
        }
        const elapsed = seconds - previousSeconds;
        planet.orbitAngle = phase;
        planet.orbitRadius = orbitRadius;
        planet.orbitSpeed = speed / orbitRadius;
        planet.orbitCenter.set(sim.star.pos.x, sim.star.pos.y);
        updatePlanetOrbit(planet, elapsed);
        phase = planet.orbitAngle;
        previousSeconds = seconds;
        const next = [
          sunRadius,
          planetRadius,
          orbitRadius,
          speed,
          zoom,
          seconds,
          showName,
          showOrbit,
          showGravity,
        ].join(":");
        if (next !== signature) {
          applyYellowFamilyProfile(sim.star, sunRadius, sim.gravity);
          if (hud) sim.star.designation = `${sim.star.designation}, Sun`;
          surface.draw((seconds * Math.PI * 2) / (2 / (1 / 18 + 1 / 120)));
          for (const ctx of [world, fx, lfx]) ctx.clearRect(0, 0, 720, 680);
          world.fillStyle = COLOR.void;
          world.fillRect(0, 0, 720, 680);
          for (const ctx of [world, lfx]) {
            ctx.save();
            ctx.translate(360, 340);
            ctx.scale(zoom, zoom);
            ctx.translate(-sim.star.pos.x, -sim.star.pos.y);
          }
          drawSunFields(
            world,
            sim.star,
            { collecting: true, damaging: false },
            720,
          );
          drawStar(world, {
            x: sim.star.pos.x,
            y: sim.star.pos.y,
            radius: sim.star.radius,
            color: sim.star.color,
            glowColor: sim.star.glowColor,
            appearance: sim.star.appearance,
            time: seconds * 1000,
          });
          if (!hud) {
            world.strokeStyle = COLOR.border;
            world.lineWidth = 1 / zoom;
            world.beginPath();
            world.arc(
              sim.star.pos.x,
              sim.star.pos.y,
              orbitRadius,
              0,
              Math.PI * 2,
            );
            world.stroke();
          }
          if (hud && showOrbit) {
            world.save();
            world.setTransform(1, 0, 0, 1, 0, 0);
            drawWorldOrbit(world, 360, 340, orbitRadius * zoom);
            world.restore();
          }
          if (hud && showGravity) {
            world.save();
            world.setTransform(1, 0, 0, 1, 0, 0);
            drawWorldGravity(
              world,
              360 + (planet.pos.x - sim.star.pos.x) * zoom,
              340 + (planet.pos.y - sim.star.pos.y) * zoom,
              mercuryGravityReach * zoom,
            );
            world.restore();
          }
          painter.body(world, 0, planet.pos.x, planet.pos.y, planetRadius);
          painter.light(
            lfx,
            planet.pos.x,
            planet.pos.y,
            planetRadius,
            sim.star.pos.x,
            sim.star.pos.y,
          );
          for (const ctx of [world, lfx]) ctx.restore();
          if (hud) {
            if (showName)
              drawWorldLabel(
                world,
                "Mercury",
                360 + (planet.pos.x - sim.star.pos.x) * zoom,
                340 + (planet.pos.y - sim.star.pos.y) * zoom,
                planetRadius * zoom,
                phase,
              );
          }
          world.font = canvasFont(13);
          world.fillStyle = COLOR.textMuted;
          world.textAlign = "left";
          world.fillText(
            `r${sunRadius} Sun · r${planetRadius} rock · orbit ${orbitRadius} u · ${speed.toFixed(1)} u/s · ${zoom.toFixed(2)} px/u`,
            20,
            655,
          );
          signature = next;
        }
        raf = requestAnimationFrame(draw);
      };
      ready = true;
      raf = requestAnimationFrame(draw);
    })
    .catch((error) => {
      if (!disposed)
        failed =
          error instanceof Error
            ? error.message
            : "Size instrument could not load";
    });
  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
  };
});
function reset() {
  resetSerial++;
  playing = false;
  seconds = 0;
  sunRadius = 70;
  planetRadius = MERCURIAL_ROCK_RADIUS.practice;
  orbitRadius = PRACTICE_MERCURY_ORBIT;
  speed = 4;
  zoom = 0.7;
  showName = true;
  showOrbit = true;
  showGravity = true;
}
</script>
<figure
  class="size-instrument"
  aria-label={label}
  data-ready={ready}
  data-orbit={orbitRadius}
  data-min-orbit={minOrbit}
  data-max-orbit={maxOrbit}
  data-mercury-gravity={mercuryGravityReach}
>
  <div class="settings">
    {#if hud}
      <div class="hud-toggles">
        <label
          ><input type="checkbox" bind:checked={showName}>
          Mercury label</label
        >
        <label
          ><input type="checkbox" bind:checked={showOrbit}>
          Orbit marking</label
        >
        <label
          ><input type="checkbox" bind:checked={showGravity}>
          Mercury gravity well</label
        >
      </div>
    {/if}
    <div class="sliders">
      <RingSlider
        label="Sun radius"
        min={YELLOW_FAMILY_RADIUS.min}
        max={YELLOW_FAMILY_RADIUS.max}
        step={1}
        unit="u"
        bind:value={sunRadius}
      />
      <RingSlider
        label="Planet radius"
        min={MERCURIAL_ROCK_RADIUS.min}
        max={MERCURIAL_ROCK_RADIUS.max}
        step={1}
        unit="u"
        bind:value={planetRadius}
      />
      <RingSlider
        label="Orbital distance"
        min={minOrbit}
        max={maxOrbit}
        step={1}
        unit="u"
        bind:value={orbitRadius}
      />
      <RingSlider
        label="Orbital travel speed"
        min={3}
        max={5}
        step={0.1}
        digits={1}
        unit="u/s"
        bind:value={speed}
      />
      <RingSlider
        label="Camera scale"
        min={0.25}
        max={1.25}
        step={0.05}
        digits={2}
        unit="px/u"
        bind:value={zoom}
      />
      <RingSlider
        label="Motion time"
        min={0}
        max={motionDuration}
        step={1 / 60}
        digits={1}
        unit="s"
        bind:value={seconds}
      />
    </div>
    <div class="controls">
      <button
        type="button"
        class="btn btn-filled"
        disabled={!ready}
        onclick={() => {
          if (seconds >= motionDuration) seconds = 0;
          playing = !playing;
        }}
      >
        {playing ? "Pause motion" : "Play motion"}
      </button>
      <button type="button" class="btn btn-ghost" onclick={reset}>
        Reset example
      </button>
    </div>
    <p class="readout" aria-live="polite">
      Outside danger by {clearance.toFixed(1)} u · inside charging by
      {penetration.toFixed(1)}
      u.<br>
      Field radii: danger {profile.danger.toFixed(1)} u · charging
      {profile.charge.toFixed(1)}
      u · gravity {profile.gravity.toFixed(1)} u.<br>
      Planet diameter {(planetRadius * 2).toFixed(0)} u ·
      {((planetRadius / sunRadius) * 100).toFixed(0)}% of Sun diameter · orbit
      period {(period / 60).toFixed(1)} min.
    </p>
    {#if hud}
      <p>
        Mercury gravity reach: {mercuryGravityReach.toFixed(1)} u from its
        centre. Mass follows the existing Practice tuning independently of the
        body-size slider.
      </p>
    {/if}
    <p class="legend">
      Dashed green: gravity · solid green: charging · dotted amber: danger ·
      {hud ? "Dim green: orbit (short dashes)." : "Grey: orbit."}
    </p>
    {#if clipped}
      <p>
        The full orbit extends outside this view. Reduce camera scale to inspect
        it.
      </p>
    {/if}
    {#if failed}
      <p role="alert">{failed}</p>
    {/if}
  </div>
  <div class="stage">
    <FlightLayers
      fxGlow={false}
      bind:canvases={layers}
      label="Rotating mineral Mercury orbiting a production yellow Sun with field boundaries"
    />
  </div>
  <figcaption>
    Size edits clamp orbital distance into the valid band, retaining orbital
    phase. Surface spin stays at 31.3 seconds per turn. Reset restores the
    starting example.
  </figcaption>
</figure>
<style>
.size-instrument {
  width: 1040px;
  max-width: 100%;
  margin-block: var(--spacing-xl);
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: var(--spacing-lg);
  align-items: start;
}
.hud-toggles {
  display: grid;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}
.hud-toggles label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
.sliders {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--spacing-lg);
}
.controls {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-block: var(--spacing-lg);
}
.readout,
.legend,
figcaption {
  color: var(--color-text-muted);
}
.stage {
  aspect-ratio: 720 / 680;
  border: 1px solid var(--color-border);
  position: sticky;
  top: var(--spacing-md);
}
.stage :global(.flight-layers) {
  width: 100%;
  height: 100%;
}
figcaption {
  grid-column: 2;
  margin-block: var(--spacing-md);
}
</style>
