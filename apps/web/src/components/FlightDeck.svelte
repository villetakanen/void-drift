<script lang="ts">
import {
  Camera,
  createCloudedWorld,
  createRockMaterial,
  Input,
  type InputAction,
  litPads,
  PLANET_MAPS,
  paintCountdown,
  Renderer,
  type ThrustPad,
} from "@void-drift/core";
import {
  buildStats,
  CHALLENGE,
  type DerelictsResult,
  type ExperimentalSetting,
  ExperimentalSettingSchema,
  FlightFx,
  type FlightLayerCanvases,
  type FlightLayerContexts,
  type FlightMode,
  type FlightTickInput,
  fittedParts,
  isScoredEligible,
  type Loadout,
  LoadoutSchema,
  RankedRunSchema,
  resizeFlightLayers,
  type ShipProfileId,
  Simulation,
  STEP,
  stockSettings,
} from "@void-drift/mode-a";
import { onMount, type Snippet, tick } from "svelte";
import { HabitableMaterials } from "../lib/assets/habitable-materials";
import { planetAppearances } from "../lib/assets/planet-appearances";
import { createPracticeVenus } from "../lib/assets/practice-venus";
import { createOuterMercurialMaterial } from "../lib/assets/rock-planets/authored-materials";
import { projectFlightContact } from "../lib/flight-contact-projection";
import {
  type FlightContactCue,
  projectFlightContacts,
} from "../lib/flight-contacts";
import { reportFlightEvent } from "../lib/flight-reporting";
import {
  drawGameField,
  PRACTICE_BACKGROUND,
  systemBackground,
} from "../lib/game-field";
import { fitGameScreen, GAME_HEIGHT } from "../lib/game-screen";
import { settings } from "../lib/stores/settings";
import { initializeShipSetup, shipSetup } from "../lib/stores/ship-setup";
import ThrustPads from "./controls/ThrustPads.svelte";
import { PAD_ASSEMBLY_HEIGHT_PX } from "./controls/thrust-pads";
import Dialog from "./Dialog.svelte";
import FlightContacts from "./FlightContacts.svelte";
import GameFieldBackdrop from "./GameFieldBackdrop.svelte";
import GameOver, { type GameOverOutcome } from "./GameOver.svelte";
import DeckFlap from "./inputs/DeckFlap.svelte";
import PreviewMarker from "./PreviewMarker.svelte";
import RankedResult from "./RankedResult.svelte";
import TitleScreen from "./TitleScreen.svelte";

let {
  loadout,
  launchSource: requestedSource = "title",
  mode: requestedMode = "survival",
  onReturn,
  menu,
}: {
  loadout?: Loadout;
  launchSource?: "title" | "hangar";
  mode?: FlightMode;
  onReturn?: () => void;
  /** A nonmodal menu foreground over the existing landing scene and scrim. */
  menu?: Snippet;
} = $props();
let runSetup = $state.raw<{
  loadout: Loadout;
  experimental: ExperimentalSetting;
  mode: FlightMode;
  source: "title" | "hangar";
}>();
const mode = $derived(runSetup?.mode ?? requestedMode);
const launchSource = $derived(runSetup?.source ?? requestedSource);
// Practice skips the arrival countdown and labels itself; its screen is Survival's.
const testFlight = $derived(mode === "practice");
let canvases = $state<FlightLayerCanvases>({});
let simulation: Simulation;
let practiceVenus: ReturnType<typeof createPracticeVenus> | undefined;
let practiceCradle: Awaited<ReturnType<typeof createCloudedWorld>> | undefined;
let mercurialMaterial:
  | Awaited<ReturnType<typeof createRockMaterial>>
  | undefined;
let outerMercurialMaterial:
  | Awaited<ReturnType<typeof createOuterMercurialMaterial>>
  | undefined;
const habitableMaterials = new HabitableMaterials();
let bodyAppearances: ReturnType<typeof planetAppearances> | undefined;
let input: Input;
let renderer: Renderer;
let camera: Camera;
let skySeed = $state<number | undefined>();
let skyCameraX = $state(960);
let skyCameraY = $state(540);
const background = $derived(
  skySeed === undefined ? PRACTICE_BACKGROUND : systemBackground(skySeed),
);
const flightFx = new FlightFx();
const currentLoadout = $derived(
  loadout ?? $shipSetup.builds[$shipSetup.builds.activeChassis],
);
const runLoadout = $derived(runSetup?.loadout);
const runExperimental = $derived(
  runSetup?.experimental ?? $shipSetup.experimental,
);
let launchBlocked = $state(false);
let chosen = $derived<ShipProfileId>((runLoadout ?? currentLoadout).chassis);
const currentLaunchAvailable = $derived(
  $shipSetup.experimental === "On" || isScoredEligible(currentLoadout),
);
const blockedReason = $derived(
  currentLaunchAvailable
    ? ""
    : "Playground is Off; this setup requires Playground. Change it in Hangar or turn Playground on.",
);
const experimentalRun = $derived(runExperimental === "On");
const rankedRun = $derived(
  mode === "survival" &&
    runLoadout !== undefined &&
    runExperimental === "Off" &&
    isScoredEligible(runLoadout),
);
let status = $state("MENU");
let weaponsChoice = $state<Simulation["weaponsChoice"]>("auto");
let weaponsEnergyEmergency = $state(false);
let canToggleWeapons = $state(false);
let paused = $state(false);
let seconds = $state(0);
let score = $state(0);
let derelictsResult = $state<Readonly<DerelictsResult> | null>(null);
let gauntletResult = $state<Simulation["gauntletResult"]>(null);
let hull = $state(100);
let power = $state(100);
let x = $state(460);
let y = $state(540);
const noContacts: readonly FlightContactCue[] = [];
let flightContacts = $state.raw(noContacts);
let gauntletOpponentCount = $state(0);
let zoom = $state(1);
let zoomLevel = $state(0);
let speedZoomMode = $state(1);
let cameraFitWidth = $state(0);
let cameraFitHeight = $state(0);
let activeZoomSteps = $state(5);
let ticks = $state(0);
let runSeed = $state(0);
let action = $state<InputAction | null>(null);
const lit = $derived(litPads(action));
let cause = $state("");
const completedGauntlet = $derived(mode === "gauntlet" ? gauntletResult : null);
const outcome = $derived.by((): GameOverOutcome => {
  if (completedGauntlet?.winner === "player") {
    return {
      tag: { text: "GAUNTLET CLEARED", tone: "neutral" },
      value: "Victory",
    };
  }
  if (completedGauntlet?.winner === "mutual") {
    return {
      tag: { text: "MUTUAL DESTRUCTION", tone: "alert" },
      value: "Draw",
    };
  }
  const tag = {
    text:
      cause === "STAR"
        ? completedGauntlet
          ? "LOST TO THE STAR"
          : "TOO CLOSE TO THE STAR"
        : cause === "HULL"
          ? "HULL LOST"
          : "POWER DEPLETED",
    tone: "alert" as const,
  };
  if (completedGauntlet) return { tag, value: "Defeat" };
  const time = `${seconds.toFixed(1)} seconds`;
  if (mode === "survival" && !experimentalRun) {
    return {
      tag,
      label: "Score",
      value: score.toLocaleString("en-US"),
      caption: `${time} survived`,
    };
  }
  return { tag, label: "Time survived", value: time };
});
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
let landing = $state(false);
let transitionTime = 0;
let countTime = $state(-1);
let lastFrameTime = 0;
let accumulator = 0;
let narrow = $state(false);
let viewport: HTMLElement;
let screen = $state(fitGameScreen(1920, 1080));
// Every flight mode uses the adaptive stage; only the title landing does not.
const adaptive = $derived(!landing);
let sceneOpacity = $state(1);
let reducedMotion = false;
let stage: HTMLElement;
let pauseButton = $state<HTMLButtonElement>();
let pendingWeaponsShift: string | undefined;
function leaveFlight() {
  if (runSetup)
    reportFlightEvent("left", runSetup.mode, runSetup.loadout.chassis);
}
function enterMenu() {
  leaveFlight();
  runSetup = undefined;
  launchBlocked = false;
  landing = true;
  sceneOpacity = 1;
  phase = "menu";
  reset(false);
  skyCameraX = 480;
  skyCameraY = 270;
  skySeed = (crypto.getRandomValues(new Uint32Array(1))[0] % 2147483646) + 1;
}
let spin = $state(0);
// Once a saved score is opening Top Scores, the result offers nothing else.
let leaving = false;
function openTopScores() {
  leaving = true;
  window.location.assign("/leaderboard");
}
// The bottom gutter describes the captured run, independently of launch source.
const modeLabel = $derived(
  testFlight
    ? "GOD MODE"
    : mode === "gauntlet"
      ? "GAUNTLET · UNRANKED"
      : mode === "survival" && rankedRun
        ? "G CLASS / SHARED CHALLENGE"
        : "UNRANKED",
);
function freshSeed(previous?: number) {
  const max = 2147483647;
  const random = crypto.getRandomValues(new Uint32Array(1))[0];
  if (previous === undefined) return (random % max) + 1;
  // Sample the same range with the previous seed excluded.
  const next = (random % (max - 1)) + 1;
  return next >= previous ? next + 1 : next;
}
function reset(start = false, previousSeed?: number) {
  const arrival = start && !testFlight;
  const loadout = runLoadout ?? currentLoadout;
  const stock = stockSettings(loadout.chassis);
  pendingWeaponsShift = undefined;
  input?.reset();
  action = null;
  accumulator = 0;
  lastFrameTime = performance.now();
  simulation = new Simulation({
    ...stock,
    loadout,
    experimental: runExperimental,
    mode,
    arrival,
    seed:
      arrival || previousSeed !== undefined
        ? freshSeed(previousSeed)
        : stock.seed,
  });
  phase = arrival ? "starting" : start ? "playing" : "menu";
  countTime = arrival ? 0 : -1;
  skySeed = arrival ? simulation.settings.seed : undefined;
  refreshPlanetAppearances();
  void habitableMaterials
    .prepare(simulation.planets)
    .then(refreshPlanetAppearances)
    .catch(() => {});
  if (start) simulation.start();
  paused = start && (narrow || document.hidden);
  if (paused) reportFlightEvent("paused", mode, chosen);
  // A new run enters the star system: the speed camera shows star and ship.
  frameCamera(true, $settings.speedCamera, true);
  sync();
}
function refreshPlanetAppearances() {
  bodyAppearances = planetAppearances(simulation.planets, {
    habitable: habitableMaterials.materials,
    mercury: mercurialMaterial,
    outerMercurial: outerMercurialMaterial,
    venus: mode === "practice" ? practiceVenus : undefined,
    cradle: mode === "practice" ? practiceCradle : undefined,
  });
}
function frameCamera(
  snap = false,
  speedCamera = $settings.speedCamera,
  entrance = false,
) {
  if (!camera || !simulation) return;
  const ship = simulation.ship;
  if (!landing && speedCamera) {
    const star = simulation.star;
    camera.frameSpeed(
      ship.pos.x,
      ship.pos.y,
      ship.vel.x,
      ship.vel.y,
      ship.radius,
      snap,
      entrance ? { x: star.pos.x, y: star.pos.y, radius: star.radius } : null,
    );
    return;
  }
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
  camera.keepShipVisible(ship.pos.x, ship.pos.y, ship.radius);
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
  weaponsChoice = simulation.weaponsChoice;
  weaponsEnergyEmergency = simulation.weaponsEnergyEmergency;
  canToggleWeapons = simulation.canToggleWeapons;
  seconds = simulation.state.elapsedTime;
  score = simulation.survivalScore;
  derelictsResult = simulation.derelictsResult;
  gauntletResult = simulation.gauntletResult;
  gauntletOpponentCount = simulation.opponents.length;
  hull = simulation.state.resources.hull;
  power = simulation.state.resources.power;
  x = simulation.ship.pos.x;
  y = simulation.ship.pos.y;
  flightContacts =
    landing || !$settings.combatHud
      ? noContacts
      : projectFlightContacts(simulation, (worldX, worldY, worldDistance) => {
          const point = camera.worldToScreen(worldX, worldY);
          return projectFlightContact({
            projectedX: point.x * screen.scale,
            projectedY: point.y * screen.scale,
            worldDistance,
            active: screen.active.css,
          });
        });
  ticks = simulation.ticks;
  runSeed = simulation.settings.seed;
  cause = simulation.state.deathCause ?? "";
  zoom = camera?.zoom ?? 1;
  zoomLevel = camera?.zoomLevel ?? 0;
  speedZoomMode = camera?.speedZoomMode ?? 1;
  cameraFitWidth = camera?.activeWidth ?? 0;
  cameraFitHeight = camera?.activeHeight ?? 0;
  activeZoomSteps = simulation.settings.camera.zoomSteps;
}
function captureSetup() {
  const loadout = LoadoutSchema.parse(currentLoadout);
  const experimental = ExperimentalSettingSchema.parse(
    shipSetup.get().experimental,
  );
  if (experimental === "Off" && !isScoredEligible(loadout)) return false;
  runSetup = {
    loadout,
    experimental,
    mode: requestedMode,
    source: requestedSource,
  };
  return true;
}
function beginFlight(previousSeed?: number) {
  landing = false;
  sceneOpacity = 1;
  transitionTime = launchSource === "hangar" ? 0 : 0.3;
  reset(true, previousSeed);
}
function start() {
  if (phase === "starting" || !captureSetup()) return;
  reportFlightEvent("launched", mode, chosen);
  launchBlocked = false;
  if (launchSource === "title" && !reducedMotion && landing) {
    phase = "starting";
    transitionTime = 0;
    paused = narrow;
    if (paused) reportFlightEvent("paused", mode, chosen);
    input?.reset();
  } else beginFlight();
  (document.activeElement as HTMLElement)?.blur();
}
async function retry() {
  if (!runSetup || status !== "GAME_OVER" || leaving) return;
  reportFlightEvent("retried", mode, chosen);
  beginFlight(simulation.settings.seed);
  // Let GameOver release the deck. A replacement dialog keeps it inert.
  await tick();
  if (pauseButton?.isConnected && !pauseButton.closest("[inert]")) {
    pauseButton.focus({ preventScroll: true });
  }
}
function returnToSource() {
  if (leaving) return;
  if (launchSource === "hangar" && onReturn) onReturn();
  else enterMenu();
}
function suspend() {
  pendingWeaponsShift = undefined;
  input?.reset();
  action = null;
  lastFrameTime = performance.now();
  if (!paused && (status === "PLAYING" || phase === "starting")) {
    paused = true;
    reportFlightEvent("paused", mode, chosen);
  }
}
function togglePause() {
  if (narrow || document.hidden) return;
  pendingWeaponsShift = undefined;
  paused = !paused;
  reportFlightEvent(paused ? "paused" : "resumed", mode, chosen);
  input?.reset();
  lastFrameTime = performance.now();
}
function toggleWeapons() {
  pendingWeaponsShift = undefined;
  if (status !== "PLAYING" || paused || narrow || document.hidden) return;
  if (simulation.toggleWeapons()) weaponsChoice = simulation.weaponsChoice;
}
function advance(state: FlightTickInput) {
  const before = simulation.wraps;
  simulation.step(state);
  flightFx.captureFission(simulation);
  if (pendingWeaponsShift && !simulation.canToggleWeapons)
    pendingWeaponsShift = undefined;
  frameCamera(before !== simulation.wraps);
  camera.update(STEP);
}
/* The completed ranked run as its score record, without initials. */
function rankedRecord() {
  if (!rankedRun || !runLoadout) return undefined;
  return RankedRunSchema.safeParse({
    seconds: Math.max(0.001, simulation.elapsedSeconds),
    score: simulation.survivalScore,
    shipId: chosen,
    fitting: fittedParts(runLoadout),
    stabilizers: runLoadout.stabilizers,
    linkedEngines: runLoadout.linkedEngines ?? false,
    challenge: CHALLENGE,
    deathCause: simulation.state.deathCause ?? "POWER",
  });
}
// Pad presses count only while flight runs; releases always clear.
function padPress(pointerId: number, pad: ThrustPad | null) {
  if (pad && (status !== "PLAYING" || paused || narrow || document.hidden))
    return;
  input?.setPointer(pointerId, pad);
}
$effect(() => {
  if (status === "GAME_OVER" && runSetup)
    reportFlightEvent("completed", runSetup.mode, runSetup.loadout.chassis);
});
onMount(() => {
  let disposed = false;
  void createRockMaterial(PLANET_MAPS.mercuryGround)
    .then((asset) => {
      if (disposed) {
        asset.painter.dispose();
        return;
      }
      mercurialMaterial = asset;
      refreshPlanetAppearances();
    })
    .catch(() => {
      /* Keep the stock body when the material is unavailable. */
    });
  void createOuterMercurialMaterial()
    .then((asset) => {
      if (disposed) {
        asset.painter.dispose();
        return;
      }
      outerMercurialMaterial = asset;
      refreshPlanetAppearances();
    })
    .catch(() => {
      /* Keep the stock body when the material is unavailable. */
    });

  if (mode === "practice") {
    try {
      practiceVenus = createPracticeVenus(true);
      refreshPlanetAppearances();
    } catch {
      /* Use the stock body if Canvas material preparation fails. */
    }
    void createCloudedWorld(PLANET_MAPS.cradleGround, PLANET_MAPS.cradleClouds)
      .then((asset) => {
        if (disposed) {
          asset.painter.dispose();
          return;
        }
        practiceCradle = asset;
        refreshPlanetAppearances();
      })
      .catch(() => {
        /* Keep the stock body when the maps are unavailable. */
      });
  }
  const world = canvases.world?.getContext("2d"),
    fx = canvases.fx?.getContext("2d"),
    lfx = canvases.lfx?.getContext("2d");
  if (!world || !fx || !lfx) throw new Error("Flight layers require Canvas 2D");
  const layers: FlightLayerContexts = {
    world,
    fx,
    lfx,
    // The decorative landing field leaves out glow until flight begins.
    get fxGlow() {
      return canvases.fxGlow;
    },
  };
  const canvas = layers.world.canvas;
  renderer = new Renderer(canvas);
  resizeFlightLayers(layers, renderer, 1920, 1080);
  camera = new Camera();
  const stopCameraPreference = settings.listen((next, previous) => {
    if (next.speedCamera !== previous.speedCamera)
      camera.resetSpeedEligibility();
  });
  input = new Input();
  initializeShipSetup();
  const fitStage = () => {
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
    // Framing fits the active area; rendering still covers the whole stage.
    camera.setActiveArea(
      screen.active.logical.width,
      screen.active.logical.height,
      screen.scale,
    );
  };
  // A new run's entrance view needs the stage geometry before it is framed.
  fitStage();
  if (launchSource === "title") enterMenu();
  else if (captureSetup()) {
    reportFlightEvent("launched", mode, chosen);
    beginFlight();
  } else {
    launchBlocked = true;
    reset(false);
  }
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const updateMotion = () => {
    reducedMotion = motion.matches;
  };
  updateMotion();
  motion.addEventListener("change", updateMotion);
  const measure = () => {
    fitStage();
    narrow = screen.narrow;
    if (narrow) suspend();
    frameCamera(false, camera.speedFraming);
  };
  const resize = new ResizeObserver(measure);
  resize.observe(stage);
  resize.observe(viewport);
  window.addEventListener("resize", measure);
  measure();
  lastFrameTime = performance.now();
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
        landing = false;
        reset(true);
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
    if (!landing) {
      const countCentre = camera.getViewCentre();
      skyCameraX = countCentre.x;
      skyCameraY = countCentre.y;
      drawGameField(
        {
          layers,
          renderer,
          camera,
          sim: simulation,
          fx: flightFx,
          bodyAppearances: bodyAppearances,
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
                    mode === "gauntlet" ? "space-purple" : "standard",
                  ),
        },
        background,
      );
    }
    frame = requestAnimationFrame(draw);
  }
  // Live modifier flags cover Ctrl/Alt/Meta, but cannot distinguish both Shifts.
  let heldShift: "ShiftLeft" | "ShiftRight" | undefined;
  const acceptsWeaponsShift = (event: KeyboardEvent) =>
    phase === "playing" &&
    !paused &&
    !narrow &&
    !document.hidden &&
    simulation.canToggleWeapons &&
    !event.defaultPrevented &&
    !event.isComposing &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.metaKey &&
    !(
      event.target instanceof HTMLElement &&
      (event.target.isContentEditable ||
        event.target.closest("input, select, textarea, [inert]"))
    );
  const key = (event: KeyboardEvent) => {
    const { code } = event;
    if (code === "ShiftLeft" || code === "ShiftRight") {
      const otherShift = heldShift !== undefined && heldShift !== code;
      heldShift = code;
      if (otherShift || !acceptsWeaponsShift(event)) {
        pendingWeaponsShift = undefined;
      } else if (!event.repeat) {
        pendingWeaponsShift = code;
      }
    } else {
      if (!event.shiftKey) heldShift = undefined;
      // Repeats from an already-held thrust key aren't a new chord.
      const thrust = /^(Key[ADW]|Arrow(Left|Right|Up))$/.test(code);
      if (!event.shiftKey || !thrust || !event.repeat)
        pendingWeaponsShift = undefined;
      if (code === "Escape" && status === "PLAYING" && !paused) togglePause();
    }
  };
  const releaseKey = (event: KeyboardEvent) => {
    const { code, shiftKey } = event;
    if (!shiftKey) heldShift = undefined;
    else if (code === "ShiftLeft") heldShift = "ShiftRight";
    else if (code === "ShiftRight") heldShift = "ShiftLeft";

    // Only release confirms that Shift was not the start of a chord (e.g. Shift+Tab).
    const armed = pendingWeaponsShift === code;
    if (armed || !shiftKey) pendingWeaponsShift = undefined;
    if (armed && !shiftKey && acceptsWeaponsShift(event)) toggleWeapons();
  };
  const pointerPress = () => {
    pendingWeaponsShift = undefined;
  };
  const interrupt = () => {
    heldShift = undefined;
    suspend();
  };
  const visibility = () => {
    if (document.hidden) interrupt();
  };
  window.addEventListener("keydown", key);
  window.addEventListener("keyup", releaseKey);
  window.addEventListener("pointerdown", pointerPress, true);
  window.addEventListener("blur", interrupt);
  document.addEventListener("visibilitychange", visibility);
  frame = requestAnimationFrame(draw);
  return () => {
    leaveFlight();
    disposed = true;
    cancelAnimationFrame(frame);
    habitableMaterials.dispose();
    mercurialMaterial?.painter.dispose();
    outerMercurialMaterial?.painter.dispose();
    practiceVenus?.painter.dispose();
    practiceCradle?.painter.dispose();
    stopCameraPreference();
    playSurface?.removeEventListener("contextmenu", preventMenu);
    resize.disconnect();
    motion.removeEventListener("change", updateMotion);
    input.destroy();
    window.removeEventListener("keydown", key);
    window.removeEventListener("keyup", releaseKey);
    window.removeEventListener("pointerdown", pointerPress, true);
    window.removeEventListener("blur", interrupt);
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
  data-mode={mode}
  data-countdown-text={countTime < 0 || countTime + ticks * STEP >= 3.4
    ? "none"
    : countTime + ticks * STEP < 3
      ? String(3 - Math.floor(countTime + ticks * STEP))
      : mode === "gauntlet"
        ? "FIGHT"
        : "GO"}
  data-countdown-tone={mode === "gauntlet" ? "space-purple" : "standard"}
  data-chassis={chosen}
  data-experimental={runExperimental}
  data-ranked={rankedRun}
  data-gauntlet-result={gauntletResult?.winner ?? "none"}
  data-gauntlet-opponents={gauntletOpponentCount}
  data-salvage-passes={salvageStats.passes}
  data-salvage-destroyed={salvageStats.destroyed}
  data-rail-shots={salvageStats.rail}
  data-laser-pulses={salvageStats.laser}
  data-salvage-collected={salvageStats.collected}
  data-salvage-bodies={salvageStats.bodies}
  data-weapon-energy={salvageStats.spent}
  data-phase={phase}
  data-landing-sun={landing ? "G" : "none"}
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
        <GameFieldBackdrop
          bind:canvases
          decorative={Boolean(landing)}
          seed={skySeed}
          {background}
          cameraX={skyCameraX}
          cameraY={skyCameraY}
          width={screen.logicalWidth}
          label={landing
            ? "Decorative star and orbiting planets"
            : testFlight
              ? "Fitted ship, star and orbiting planets"
              : "Ship, star and orbiting planets"}
        />
        {#if !landing && $settings.combatHud}
          <FlightContacts
            contacts={flightContacts}
            width={screen.width}
            height={screen.height}
          />
        {/if}
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
            {#if $settings.speedCamera && !landing}
              <div>
                <small>ZOOM</small><strong>{speedZoomMode}×</strong>
              </div>
            {/if}
          </div>
          <div class="deck-instruments right">
            {#if mode === "survival"}
              <div class="timer">
                <small>SURVIVAL</small
                ><strong class="time">{seconds.toFixed(1)}s</strong>
              </div>
              {#if experimentalRun}
                <div class="score experimental-score">
                  <PreviewMarker />
                  <small>No score for this run.</small>
                </div>
              {:else}
                <div class="score">
                  <small>SCORE</small><strong class="points">{score}</strong>
                </div>
              {/if}
            {/if}
          </div>
          <!-- Keep the same Pause node through the dialog's focus round trip. -->
          <div class="deck-flap left" class:standby={status !== "PLAYING"}>
            <DeckFlap
              kind="pause"
              abovePad
              bind:button={pauseButton}
              onactivate={togglePause}
            />
          </div>
          <div class="deck-flap right">
            <DeckFlap
              kind={weaponsEnergyEmergency ? "emergency" : weaponsChoice}
              abovePad
              onactivate={canToggleWeapons ? toggleWeapons : undefined}
            />
          </div>
          <!-- A new run also drops pointer captures held by the old pads. -->
          {#key runSeed}
            <div class="deck-pads left">
              <ThrustPads side="left" {lit} onpress={padPress} />
            </div>
            <div class="deck-pads right">
              <ThrustPads side="right" {lit} onpress={padPress} />
            </div>
          {/key}
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
              class="btn btn-normal"
              onclick={returnToSource}
            >
              Abort
            </button>
            {#if mode === "survival"}
              <a class="btn btn-normal" href="/leaderboard">Top Scores</a>
              <a class="btn btn-normal" href="/settings">Settings</a>
            {/if}
          </div>
        </Dialog>
      {:else if launchBlocked}
        <Dialog label="Flight unavailable" class="flight-card">
          <h1>Flight unavailable</h1>
          <p>{blockedReason}</p>
          <button
            type="button"
            class="btn btn-filled"
            data-autofocus
            onclick={returnToSource}
          >
            Return to Hangar
          </button>
        </Dialog>
      {:else if landing}
        {#if menu}
          {@render menu()}
        {:else}
          <TitleScreen
            onStart={start}
            loadout={currentLoadout}
            experimental={$shipSetup.experimental}
            disabled={phase === "starting" || !currentLaunchAvailable}
            {blockedReason}
          />
        {/if}
      {:else if status === "GAME_OVER"}
        {#snippet statistics()}
          {#if !completedGauntlet && mode === "derelicts" && derelictsResult}
            <p>{derelictsResult.playerKills} derelicts destroyed</p>
          {/if}
        {/snippet}
        {@const ranked = rankedRecord()}
        {#snippet unranked()}
          <p role="status" class="unranked">Unranked</p>
        {/snippet}
        {#snippet rankedAction()}
          {#if ranked?.success}
            <RankedResult run={ranked.data} onsaved={openTopScores} />
          {/if}
        {/snippet}
        <GameOver
          {outcome}
          {statistics}
          resultFields={ranked?.success ? undefined : unranked}
          resultAction={ranked?.success ? rankedAction : undefined}
        >
          {#snippet navigation()}
            <button
              type="button"
              class={rankedRun ? "btn btn-normal" : "btn btn-filled"}
              onclick={retry}
            >
              Retry
            </button>
            <button
              type="button"
              class="btn btn-normal"
              data-autofocus
              onclick={returnToSource}
            >
              {launchSource === "hangar" ? "Hangar" : "Return"}
            </button>
          {/snippet}
        </GameOver>
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
  position: relative;
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
</style>
