<script lang="ts">
import {
  Camera,
  Input,
  type InputAction,
  litPads,
  paintCountdown,
  Renderer,
  type ThrustPad,
} from "@void-drift/core";
import {
  buildStats,
  CHALLENGE,
  clearFlightLayer,
  type DerelictsResult,
  drawFlightFrame,
  FlightFx,
  type FlightLayerContexts,
  type FlightLayerId,
  type FlightMode,
  type FlightTickInput,
  gameSettings,
  LandingSystem,
  type Loadout,
  resizeFlightLayers,
  type ShipProfileId,
  Simulation,
  STEP,
  scoresAvailable,
  stockSettings,
  submitHighScore,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import { fitGameScreen, GAME_HEIGHT } from "../lib/game-screen";
import { settings } from "../lib/stores/settings";
import Dialog from "./Dialog.svelte";
import FlightLayers from "./FlightLayers.svelte";
import ThrustPads from "./inputs/ThrustPads.svelte";
import { PAD_ASSEMBLY_HEIGHT_PX } from "./inputs/thrust-pads";
import TitleScreen from "./TitleScreen.svelte";

let {
  loadout,
  launchSource = "title",
  mode = "survival",
  onReturn,
}: {
  loadout?: Loadout;
  launchSource?: "title" | "hangar";
  mode?: FlightMode;
  onReturn?: () => void;
} = $props();
// Practice skips the arrival countdown and labels itself; its screen is Survival's.
const testFlight = $derived(mode === "practice");
let canvases = $state<Partial<Record<FlightLayerId, HTMLCanvasElement>>>({});
let simulation: Simulation;
let input: Input;
let renderer: Renderer;
let camera: Camera;
const flightFx = new FlightFx();
let chosen = $derived<ShipProfileId>(loadout?.chassis ?? "wasp");
let status = $state("MENU");
let paused = $state(false);
let seconds = $state(0);
let score = $state(0);
let derelictsResult = $state<Readonly<DerelictsResult> | null>(null);
let hull = $state(100);
let power = $state(100);
let x = $state(460);
let y = $state(540);
let zoom = $state(1);
let zoomLevel = $state(0);
let cameraFitWidth = $state(0);
let cameraFitHeight = $state(0);
let activeZoomSteps = $state(5);
let ticks = $state(0);
let runSeed = $state(0);
let action = $state<InputAction | null>(null);
const lit = $derived(litPads(action));
let cause = $state("");
let salvageFeedback = $state("");
let salvageStats = $state({
  passes: 0,
  destroyed: 0,
  rail: 0,
  laser: 0,
  collected: 0,
  bodies: 0,
  spent: 0,
});
let engineFeedback = $state("");
let activeLoadout = $state<Loadout>();
let phase = $state<"menu" | "starting" | "playing">("menu");
let landing = $state.raw<LandingSystem>();
let transitionTime = 0;
let countTime = -1;
let lastFrameTime = 0;
let narrow = $state(false);
let viewport: HTMLElement;
let screen = $state(fitGameScreen(1920, 1080));
// Every flight mode uses the adaptive stage; only the title landing does not.
const adaptive = $derived(!landing);
let sceneOpacity = $state(1);
let reducedMotion = false;
let stage: HTMLElement;
let landingFrame = { width: 1920, height: 1080, cardRight: 1200 };
function enterMenu() {
  landing = new LandingSystem();
  sceneOpacity = 1;
  phase = "menu";
  reset(false);
}
let spin = $state(0);
let message = $state("");
let initials = $state("AAA");
// The bottom gutter's mode label: only the stock run is ranked.
const modeLabel = $derived(
  testFlight
    ? "GOD MODE"
    : loadout || chosen === "fiddler"
      ? "UNRANKED"
      : "G CLASS / SHARED CHALLENGE",
);
let saving = $state(false);
let scoreSaved = $state(false);
function reset(start = false) {
  if (phase !== "starting") phase = start ? "playing" : "menu";
  input?.reset();
  simulation = new Simulation(
    loadout
      ? { ...stockSettings(loadout.chassis), loadout, mode }
      : { ...gameSettings("wasp"), mode },
  );
  if (start && !testFlight) {
    simulation = new Simulation({
      ...simulation.settings,
      arrival: true,
      seed: (crypto.getRandomValues(new Uint32Array(1))[0] % 2147483647) + 1,
    });
    countTime = 0;
    phase = "starting";
  } else countTime = -1;
  if (start) simulation.start();
  paused = start && narrow;
  scoreSaved = false;
  message = "";
  frameCamera(true);
  sync();
}
function frameCamera(snap = false) {
  if (!camera || !simulation) return;
  const c = simulation.settings.camera;
  camera.frame(
    simulation.ship.pos.x,
    simulation.ship.pos.y,
    960,
    540,
    c.padding,
    c.smoothing,
    snap,
    c.zoomSteps,
    null,
  );
}
function sync() {
  const salvage = simulation.salvage;
  salvageStats = {
    passes: salvage?.passes ?? 0,
    destroyed: salvage?.destroyed ?? 0,
    rail: salvage?.shotsFired ?? 0,
    laser: salvage?.laserPulses ?? 0,
    collected: salvage?.energyCollected ?? 0,
    bodies: salvage?.bodies.length ?? 0,
    spent: salvage?.energySpent ?? 0,
  };
  salvageFeedback =
    salvage && salvage.time - salvage.lastCollection.time < 2
      ? `+${salvage.lastCollection.amount.toFixed(1)} energy collected`
      : "";
  engineFeedback = simulation.engineFeedback;
  activeLoadout = simulation.settings.loadout;
  spin = (simulation.angularMotion.velocity * 180) / Math.PI;
  status = simulation.state.status;
  seconds = simulation.state.elapsedTime;
  score = simulation.survivalScore;
  derelictsResult = simulation.derelictsResult;
  hull = simulation.state.resources.hull;
  power = simulation.state.resources.power;
  x = simulation.ship.pos.x;
  y = simulation.ship.pos.y;
  ticks = simulation.ticks;
  runSeed = simulation.settings.seed;
  cause = simulation.state.deathCause ?? "";
  zoom = camera?.zoom ?? 1;
  zoomLevel = camera?.zoomLevel ?? 0;
  cameraFitWidth = camera?.activeWidth ?? 0;
  cameraFitHeight = camera?.activeHeight ?? 0;
  activeZoomSteps = simulation.settings.camera.zoomSteps;
}
function start() {
  if (phase === "starting") return;
  if (launchSource === "title" && !reducedMotion && landing) {
    phase = "starting";
    transitionTime = 0;
    paused = narrow;
    input?.reset();
  } else {
    landing = undefined;
    phase = "playing";
    transitionTime = 0.3;
    reset(true);
  }
  (document.activeElement as HTMLElement)?.blur();
}
function suspend() {
  input?.reset();
  action = null;
  lastFrameTime = performance.now();
  if (status === "PLAYING" || phase === "starting") paused = true;
}
function togglePause() {
  if (narrow || document.hidden) return;
  paused = !paused;
  input?.reset();
  lastFrameTime = performance.now();
}
function advance(state: FlightTickInput) {
  const before = simulation.wraps;
  simulation.step(state);
  frameCamera(before !== simulation.wraps);
  camera.update(STEP);
}
async function save() {
  if (
    mode !== "survival" ||
    loadout ||
    chosen === "fiddler" ||
    status !== "GAME_OVER" ||
    saving ||
    scoreSaved
  )
    return;
  saving = true;
  const result = await submitHighScore({
    initials,
    seconds: Math.max(1, simulation.wholeSeconds),
    score: Math.max(1, simulation.survivalScore),
    shipId: chosen,
    challenge: CHALLENGE,
    deathCause: simulation.state.deathCause ?? "POWER",
  });
  saving = false;
  scoreSaved = result.success;
  if (result.success) {
    window.location.assign("/leaderboard");
  } else {
    message = result.error;
  }
}
// Pad presses count only while flight runs; releases always clear.
function padPress(pointerId: number, pad: ThrustPad | null) {
  if (pad && (paused || narrow || document.hidden)) return;
  input?.setPointer(pointerId, pad);
}
onMount(() => {
  const world = canvases.world?.getContext("2d"),
    fx = canvases.fx?.getContext("2d"),
    lfx = canvases.lfx?.getContext("2d");
  if (!world || !fx || !lfx) throw new Error("Flight layers require Canvas 2D");
  const layers: FlightLayerContexts = { world, fx, lfx };
  const context = layers.world,
    canvas = context.canvas;
  renderer = new Renderer(canvas);
  resizeFlightLayers(layers, renderer, 1920, 1080);
  camera = new Camera();
  input = new Input();
  if (launchSource === "title") enterMenu();
  else reset(Boolean(loadout));
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const updateMotion = () => {
    reducedMotion = motion.matches;
  };
  updateMotion();
  motion.addEventListener("change", updateMotion);
  const measure = () => {
    const available = viewport.getBoundingClientRect();
    const css = getComputedStyle(viewport);
    screen = fitGameScreen(
      available.width -
        parseFloat(css.paddingLeft) -
        parseFloat(css.paddingRight),
      available.height -
        parseFloat(css.paddingTop) -
        parseFloat(css.paddingBottom),
    );
    narrow = screen.narrow;
    if (narrow) suspend();
    // Framing fits the active area; rendering still covers the whole stage.
    camera.setActiveArea(
      screen.active.logical.width,
      screen.active.logical.height,
    );
    frameCamera();
    const bounds = stage.getBoundingClientRect();
    landingFrame = {
      width: bounds.width,
      height: bounds.height,
      cardRight: bounds.width / 2,
    };
  };
  const resize = new ResizeObserver(measure);
  resize.observe(stage);
  resize.observe(viewport);
  window.addEventListener("resize", measure);
  measure();
  lastFrameTime = performance.now();
  let accumulator = 0;
  let frame = 0;
  const playSurface = canvas.closest(".flight-stage-layer");
  const preventMenu = (event: Event) => event.preventDefault();
  playSurface?.addEventListener("contextmenu", preventMenu);
  function draw(time: number) {
    const dt = Math.max(0, Math.min((time - lastFrameTime) / 1000, 0.1));
    if (narrow || document.hidden) suspend();
    const blocked = paused || narrow || document.hidden;
    if (blocked) input.reset();
    const renderWidth = adaptive ? Math.round(screen.logicalWidth) : 1920;
    if (canvas.width !== renderWidth) {
      resizeFlightLayers(layers, renderer, renderWidth, GAME_HEIGHT);
      // Render geometry only; framing follows the active area set on measure.
      camera.viewportWidth = renderWidth;
    }
    lastFrameTime = time;
    let released = false;
    if (phase === "starting" && !blocked) {
      transitionTime += reducedMotion ? 0.3 : dt;
      if (transitionTime >= 0.15 && landing) {
        landing = undefined;
        reset(true);
        accumulator = 0;
      }
      sceneOpacity =
        transitionTime < 0.15
          ? 1 - transitionTime / 0.15
          : Math.min(1, (transitionTime - 0.15) / 0.15);
      if (transitionTime >= 0.3 && countTime >= 3) {
        released = true;
        phase = "playing";
        accumulator = 0;
      }
    }
    if (phase === "starting" && !landing && transitionTime >= 0.3 && !blocked)
      countTime = Math.min(3, countTime + dt);
    const invert = settings.get().invertControls;
    const controls = input.getEffectiveState(invert);
    action = input.getAction(invert);
    if (
      !blocked &&
      !released &&
      phase !== "starting" &&
      simulation.state.status === "PLAYING"
    ) {
      accumulator += dt;
      while (accumulator >= STEP) {
        advance(controls);
        accumulator -= STEP;
      }
    } else accumulator = 0;
    sync();
    if (landing) {
      renderer.clear();
      clearFlightLayer(layers.fx);
      clearFlightLayer(layers.lfx);
      if (!document.hidden && !reducedMotion) landing.step(dt);
      // The title backdrop fills the viewport independently of the play stage.
      renderer.drawBackground();
      context.save();
      context.scale(1920 / landingFrame.width, 1080 / landingFrame.height);
      landing.draw(
        context,
        landingFrame.width,
        landingFrame.height,
        landingFrame.cardRight,
      );
      context.restore();
    } else {
      const countCentre = camera.screenToWorld(
        canvas.width / 2,
        canvas.height / 2,
      );
      drawFlightFrame({
        layers,
        renderer,
        camera,
        sim: simulation,
        fx: flightFx,
        stockShip: chosen === "fiddler" ? undefined : chosen,
        lightTime: Math.max(0, countTime) + simulation.ticks * STEP,
        lightOverlay:
          countTime < 0
            ? undefined
            : (light, pass) =>
                paintCountdown(
                  light,
                  pass,
                  countTime + simulation.ticks * STEP,
                  countCentre.x,
                  countCentre.y,
                  camera.zoom,
                  reducedMotion,
                ),
      });
    }
    frame = requestAnimationFrame(draw);
  }
  const key = (event: KeyboardEvent) => {
    if (event.code === "Escape" && status === "PLAYING" && !paused)
      togglePause();
  };
  const visibility = () => {
    if (document.hidden) suspend();
  };
  window.addEventListener("keydown", key);
  window.addEventListener("blur", suspend);
  document.addEventListener("visibilitychange", visibility);
  frame = requestAnimationFrame(draw);
  return () => {
    cancelAnimationFrame(frame);
    playSurface?.removeEventListener("contextmenu", preventMenu);
    resize.disconnect();
    motion.removeEventListener("change", updateMotion);
    input.destroy();
    window.removeEventListener("keydown", key);
    window.removeEventListener("blur", suspend);
    window.removeEventListener("resize", measure);
    document.removeEventListener("visibilitychange", visibility);
  };
});
</script>

<div
  class="flight-page"
  class:title-active={Boolean(landing)}
  data-paused={paused}
  data-action={action ?? "none"}
  data-narrow={narrow}
  data-launch-source={launchSource}
  data-status={status}
  data-salvage-passes={salvageStats.passes}
  data-salvage-destroyed={salvageStats.destroyed}
  data-rail-shots={salvageStats.rail}
  data-laser-pulses={salvageStats.laser}
  data-salvage-collected={salvageStats.collected}
  data-salvage-bodies={salvageStats.bodies}
  data-weapon-energy={salvageStats.spent}
  data-phase={phase}
  data-landing-sun={landing?.star.type}
  data-x={x.toFixed(4)}
  data-y={y.toFixed(4)}
  data-ticks={ticks}
  data-seed={runSeed}
  data-spin={spin.toFixed(4)}
  data-stabilizers={activeLoadout?.stabilizers ?? false}
  data-zoom={zoom.toFixed(4)}
  data-zoom-level={zoomLevel}
  data-zoom-steps={activeZoomSteps}
  data-camera-fit-width={cameraFitWidth}
  data-camera-fit-height={cameraFitHeight}
>
  <div class="flight-layout" bind:this={viewport}>
    <section
      bind:this={stage}
      class="flight-stage"
      class:landing={Boolean(landing)}
      class:adaptive
      style:width={adaptive ? `${screen.width}px` : undefined}
      style:height={adaptive ? `${screen.height}px` : undefined}
      style:--game-gutter={`${screen.gutter.side}px`}
      style:--game-gutter-edge={`${screen.gutter.edge}px`}
      data-active-width={screen.active.css.width}
      data-active-height={screen.active.css.height}
      data-active-logical-width={screen.active.logical.width}
      data-active-logical-height={screen.active.logical.height}
      style:opacity={paused || narrow ? 1 : sceneOpacity}
      aria-label="Flight arena"
    >
      <div
        class="flight-stage-layer"
        class:scrim-stage={Boolean(landing)}
        data-stage
      >
        <FlightLayers
          bind:canvases
          label={landing
            ? "Decorative star and orbiting planets"
            : testFlight
              ? "Fitted ship, star and orbiting planets"
              : "Ship, star and orbiting planets"}
        />
        <!-- The deck: screen-fixed parts in the gutters, clear of the active
             area. One grid holds both side gutters, so their rows and pads
             share a height. -->
        <div
          class="deck"
          data-deck
          style:--deck-pad-height={`${PAD_ASSEMBLY_HEIGHT_PX}px`}
        >
          <div class="deck-instruments left">
            <div>
              <small>HULL</small><strong>{hull.toFixed(0)}%</strong
              ><progress aria-label="Hull" max="100" value={hull}></progress>
            </div>
            <div>
              <small>POWER</small><strong>{power.toFixed(0)}%</strong
              ><progress
                aria-label="Power"
                max={activeLoadout ? buildStats(activeLoadout).capacity : 100}
                value={power}
              ></progress>
            </div>
          </div>
          <div class="deck-instruments right">
            {#if mode === "survival"}
              <div class="timer">
                <small>SURVIVAL</small
                ><strong class="time">{seconds.toFixed(1)}s</strong>
              </div>
              <div class="score">
                <small>SCORE</small><strong class="points">{score}</strong>
              </div>
            {/if}
          </div>
          <!-- Pause keeps its place outside active play, so the pads never move. -->
          <button
            type="button"
            class="deck-button left"
            class:standby={status !== "PLAYING"}
            onclick={togglePause}
          >
            Pause
          </button>
          <!-- A placeholder until weapons get their own control. -->
          <button type="button" class="deck-button right" disabled>
            Weapons
          </button>
          <div class="deck-pads left">
            <ThrustPads side="left" {lit} onpress={padPress} />
          </div>
          <div class="deck-pads right">
            <ThrustPads side="right" {lit} onpress={padPress} />
          </div>
        </div>
        <div class="deck-info" data-deck>
          <small class="mode-label">{modeLabel}</small>
          {#if mode === "derelicts" && salvageFeedback}
            <small role="status">{salvageFeedback}</small>
          {/if}
          {#if activeLoadout && engineFeedback}
            <small class="engine-feedback">{engineFeedback}</small>
          {/if}
        </div>
      </div>
      {#if narrow && (phase !== "menu" || !landing)}
        <Dialog
          label="Rotate to continue"
          class="flight-card"
          returnFocus={false}
        >
          <h1>Rotate to continue</h1>
          <p>
            Flight is paused. Turn your screen sideways or widen the window to
            continue.
          </p>
        </Dialog>
      {:else if paused}
        <Dialog label="Paused" class="flight-card" onclose={togglePause}>
          <p class="eyebrow">PAUSED</p>
          <div class="button-group button-group--vertical">
            <button
              type="button"
              class="btn btn-filled"
              data-autofocus
              onclick={togglePause}
            >
              Resume
            </button>
            <button
              type="button"
              class="btn btn-ghost"
              onclick={() => (onReturn ? onReturn() : enterMenu())}
            >
              Abort
            </button>
            {#if mode === "survival"}
              <a class="btn btn-ghost" href="/leaderboard">Top Scores</a>
              <a class="btn btn-ghost" href="/settings">Settings</a>
            {/if}
          </div>
        </Dialog>
      {:else if landing}
        <div class="dialog-scrim" aria-hidden="true"></div>
        <TitleScreen onStart={start} disabled={phase === "starting"} />
      {:else if status === "GAME_OVER"}
        <Dialog label="Run complete" class="flight-card">
          <p class="eyebrow">
            {cause === "STAR"
              ? "TOO CLOSE TO THE STAR"
              : cause === "HULL"
                ? "HULL LOST"
                : "POWER DEPLETED"}
          </p>
          {#if mode === "derelicts" && derelictsResult}
            <h1>{derelictsResult.score.toFixed(1)} points.</h1>
            <p>
              {derelictsResult.seconds.toFixed(1)}
              seconds · {derelictsResult.playerKills} derelicts destroyed
            </p>
          {:else}
            <h1>{seconds.toFixed(1)} seconds.</h1>
            {#if mode === "survival"}
              <p>Score {score}</p>
            {/if}
            <p>Every orbit teaches you something.</p>
          {/if}
          {#if mode === "survival" && !loadout && chosen !== "fiddler"}
            <label for="initials">Your initials</label>
            <input
              id="initials"
              data-autofocus
              maxlength="3"
              bind:value={initials}
              oninput={() => {
                initials = initials.toUpperCase().replace(/[^A-Z]/g, "");
              }}
            >
          {/if}
          {#if message}
            <p role="status" class="flight-message">{message}</p>
          {/if}
          <div class="button-group button-group--vertical">
            {#if mode === "survival" && !loadout && chosen !== "fiddler"}
              <button
                type="button"
                class="btn btn-filled"
                disabled={saving ||
                  scoreSaved ||
                  !scoresAvailable() ||
                  !/^[A-Z]{3}$/.test(initials)}
                onclick={save}
              >
                {saving ? "Saving…" : scoreSaved ? "Saved" : "Save Score"}
              </button>
            {/if}
            <button
              type="button"
              class="btn btn-ghost"
              data-autofocus
              onclick={() => (onReturn ? onReturn() : enterMenu())}
            >
              {launchSource === "hangar"
                ? "Return to Hangar"
                : "Return to title screen"}
            </button>
            {#if mode === "survival"}
              <a class="btn btn-ghost" href="/leaderboard">Top Scores</a>
            {/if}
          </div>
        </Dialog>
      {/if}
    </section>
  </div>
</div>

<style>
/* Every flight mode measures the safe viewport; the title resets it below. */
.flight-layout {
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
  padding: env(safe-area-inset-top) env(safe-area-inset-right)
    env(safe-area-inset-bottom) env(safe-area-inset-left);
}
.flight-stage.adaptive {
  flex: none;
}
.flight-stage-layer {
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  overscroll-behavior: none;
}
.title-active .flight-layout {
  padding: 0;
}

.flight-message {
  position: static;
}
.title-active {
  padding: 0;
}
.title-active .flight-layout {
  display: block;
  height: 100dvh;
}
.title-active .flight-stage {
  width: 100%;
  height: 100%;
  max-height: none;
  aspect-ratio: auto;
}
.title-active .flight-stage-layer {
  width: 100%;
  height: 100%;
}
.title-active [data-deck] {
  display: none;
}

.flight-stage.landing > .flight-stage-layer :global(canvas) {
  object-fit: fill;
}
</style>
