<script lang="ts">
import { COLOR, paintBeam } from "@void-drift/core";
import {
  BUILD_FLIGHT_SCALE,
  buildMounts,
  buildPlumeEmitters,
  CHASSIS,
  CRUISER,
  drawBuild,
  type ExperimentalSetting,
  FIDDLER,
  FIGHTER,
  type Loadout,
  PARTS,
  SCOUT,
  SHIP_IDENTITY,
  WASP,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import { version } from "../../package.json";
import { LANDING_HINTS } from "../data/landing-hints";
import { isNarrowerThanMinRatio } from "../lib/game-screen";
import Logo from "./Logo.svelte";
import PreviewMarker from "./PreviewMarker.svelte";

let {
  onStart,
  loadout,
  experimental,
  disabled = false,
  blockedReason = "",
}: {
  onStart: () => void;
  loadout: Loadout;
  experimental: ExperimentalSetting;
  disabled?: boolean;
  blockedReason?: string;
} = $props();
let startButton: HTMLButtonElement;
let hangarLink: HTMLAnchorElement;
let arrivalCanvas: HTMLCanvasElement;

function drawArrival() {
  const ctx = arrivalCanvas.getContext("2d");
  if (!ctx) return;
  const hullPoints =
    loadout.chassis === "fighter"
      ? FIGHTER.hull
      : (loadout.chassis === "fiddler"
          ? FIDDLER.facets
          : loadout.chassis === "wasp"
            ? WASP.facets
            : loadout.chassis === "scout"
              ? SCOUT.facets
              : CRUISER.facets
        ).flatMap((facet) => facet.points);
  const points: number[][] = hullPoints.map((point) => [point[0], point[1]]);
  for (const mount of buildMounts(loadout)) {
    const radius = Math.max(mount.width, mount.height);
    for (const x of [-radius, radius])
      for (const y of [-radius, radius])
        points.push([
          mount.x + x * Math.cos(mount.angle) - y * Math.sin(mount.angle),
          mount.y + x * Math.sin(mount.angle) + y * Math.cos(mount.angle),
        ]);
  }
  const xCoordinates = points.map(([x]) => x);
  const span =
    loadout.chassis === "wasp"
      ? WASP.fullLength
      : Math.max(...xCoordinates) - Math.min(...xCoordinates);
  const scale = 156 / span;
  ctx.scale(2, 2);
  ctx.translate(520, 90);
  ctx.rotate(-Math.PI / 6);
  // Static menu artwork: reuse the arrival ink and the fitted engine's real nozzle.
  const wingTipX = -6.5 * scale;
  const tailLength = 450;
  const tail = ctx.createLinearGradient(wingTipX - tailLength, 0, wingTipX, 0);
  tail.addColorStop(0, "transparent");
  tail.addColorStop(1, COLOR.countdown);
  ctx.fillStyle = tail;
  ctx.globalAlpha = 0.22;
  ctx.fillRect(
    wingTipX - tailLength,
    (-CHASSIS[loadout.chassis].width * scale) / 2,
    tailLength,
    CHASSIS[loadout.chassis].width * scale,
  );
  ctx.globalAlpha = 1;
  const engineCount = buildMounts(loadout).filter((mount) =>
    mount.part ? PARTS[mount.part].category === "E" : false,
  ).length;
  for (const engine of buildPlumeEmitters(loadout).slice(0, engineCount)) {
    ctx.save();
    ctx.translate(
      (engine.x * scale) / BUILD_FLIGHT_SCALE,
      (engine.y * scale) / BUILD_FLIGHT_SCALE,
    );
    ctx.rotate(engine.angle);
    paintBeam(
      ctx,
      2.21,
      engine.style === "plasma" ? "default" : (engine.style ?? "default"),
    );
    ctx.restore();
  }
  drawBuild(ctx, loadout, 0, 0, 0, scale);
}
let hint = $state(0);
let narrow = $state(false);

onMount(() => {
  drawArrival();
  const resize = () => {
    // The title fills the window (fixed, inset 0), so it gates on the window.
    narrow = isNarrowerThanMinRatio(window.innerWidth, window.innerHeight);
  };
  resize();
  window.addEventListener("resize", resize);
  if (disabled && blockedReason) hangarLink.focus();
  else startButton.focus();
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const timer = window.setInterval(() => {
    if (!motion.matches && !narrow) hint = (hint + 1) % LANDING_HINTS.length;
  }, 8000);
  return () => {
    window.removeEventListener("resize", resize);
    window.clearInterval(timer);
  };
});
</script>

<div class="title-screen">
  <div class="title-slot">
    <section class="title-panel panel" aria-label="Game menu">
      <div class="identity">
        <Logo size="sm" />
        <h1>VOID DRIFT</h1>
      </div>
      <nav aria-label="Title screen">
        <div class="button-group button-group--vertical">
          <div class="start-action">
            <button
              bind:this={startButton}
              type="button"
              class="btn btn-filled"
              {disabled}
              onclick={onStart}
            >
              PRESS START
            </button>
            {#if experimental === "On"}
              <PreviewMarker />
            {/if}
          </div>
          <a bind:this={hangarLink} href="/hangar" class="btn btn-normal"
            >HANGAR</a
          >
          <a href="/leaderboard" class="btn btn-normal">TOP SCORES</a>
          <a href="/settings" class="btn btn-normal">SETTINGS</a>
          <a href="/credits" class="btn btn-normal">CREDITS</a>
        </div>
      </nav>
      <p class="version">
        <span class="active-ship">
          ACTIVE SHIP · {SHIP_IDENTITY[loadout.chassis].shortName}
        </span>
        <span>{version}</span>
      </p>
      <canvas
        class="arrival-wasp"
        bind:this={arrivalCanvas}
        width="1200"
        height="800"
        aria-hidden="true"
      ></canvas>
    </section>
    <aside class="hint" aria-label="Title-screen hints">
      {#if narrow}
        <p role="status" class="orientation-warning">
          Rotate your screen to landscape.
        </p>
      {/if}
      {#if blockedReason}
        <p role="status" class="launch-blocked">{blockedReason}</p>
      {:else if !narrow}
        {#key hint}
          <p>{LANDING_HINTS[hint].text}</p>
        {/key}
      {/if}
    </aside>
  </div>
</div>

<style>
.title-screen {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
}
.title-slot {
  position: relative;
  width: min(100%, calc(100dvh * 16 / 9));
  aspect-ratio: 16 / 9;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  gap: var(--spacing-xl);
  padding: var(--spacing-md);
  box-sizing: border-box;
}
.title-panel {
  width: 100%;
  max-width: 26rem;
  justify-self: center;
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  pointer-events: auto;
}
.arrival-wasp {
  position: absolute;
  width: 600px;
  height: 400px;
  max-width: none;
  left: calc(100% - 520px);
  top: calc(100% - 90px);
  pointer-events: none;
}
.identity {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-brand);
}
.identity h1 {
  margin: 0;
  color: var(--color-text);
  font-size: var(--font-size-heading);
}
.version .active-ship {
  margin: 0;
  color: var(--color-text-muted);
  font: var(--font-size-caption) var(--font-family-ui);
  letter-spacing: var(--tracking-eyebrow);
}
.launch-blocked {
  margin: 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-ui);
  text-align: center;
}
.title-panel nav {
  width: 100%;
}
.start-action {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.start-action .btn {
  width: 100%;
  white-space: nowrap;
}
.start-action :global(.preview-marker) {
  align-self: flex-end;
}
.hint {
  max-width: 32rem;
  color: var(--color-android-green);
  line-height: var(--line-height-ui);
  pointer-events: auto;
}
.hint p {
  animation: appear 600ms ease both;
}
.hint .orientation-warning {
  animation: none;
}
.version {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
  text-align: center;
  display: flex;
  justify-content: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}
@keyframes appear {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@media (max-width: 800px) {
  .title-panel {
    padding: var(--spacing-sm);
    gap: var(--spacing-xs);
  }
  .identity,
  .start-action {
    gap: var(--spacing-xs);
  }
}
@media (prefers-reduced-motion: reduce) {
  .hint p {
    animation: none;
  }
}
</style>
