import {
  Camera,
  createCloudedWorld,
  createRockMaterial,
  DEFAULT_ROCK_BODY_LIGHTING,
  PLANET_MAPS,
  type Planet,
  Renderer,
  type RockBodyLighting,
  RockBodyLightingSchema,
  StripSphericalSurface,
  updatePlanetOrbit,
} from "@void-drift/core";
import {
  applyYellowFamilyProfile,
  type BodyAppearance,
  drawFlightFrame,
  FlightFx,
  type FlightLayerContexts,
  GRAVITY_TUNING,
  generateSolarSystem,
  MERCURIAL_ROCK_SPIN_SECONDS,
  mercurialOrbit,
  PRACTICE_CRADLE_SPIN_SECONDS,
  PRACTICE_MERCURY_SPIN_SECONDS,
  PRACTICE_VENUS_SPIN_SECONDS,
  resizeFlightLayers,
  Simulation,
  STEP,
  stockSettings,
} from "@void-drift/mode-a";
import { planetAppearances } from "../assets/planet-appearances";
import { createPracticeVenus } from "../assets/practice-venus";
import {
  MercurialInspectorPlanetSchema,
  type PlanetInspectorDocument,
} from "./config";

const references = {
  mercurial: {
    id: "moon",
    label: "Mercurial",
    spinSeconds: MERCURIAL_ROCK_SPIN_SECONDS,
  },
  mercury: {
    id: "moon",
    label: "Mercury",
    spinSeconds: PRACTICE_MERCURY_SPIN_SECONDS,
  },
  venus: {
    id: "venus",
    label: "Venus",
    spinSeconds: PRACTICE_VENUS_SPIN_SECONDS,
  },
  cradle: {
    id: "cradle",
    label: "The Cradle",
    spinSeconds: PRACTICE_CRADLE_SPIN_SECONDS,
  },
  /** The Cradle's body, air and clouds under its own ground map and name. */
  earth: {
    id: "cradle",
    label: "Earth",
    spinSeconds: PRACTICE_CRADLE_SPIN_SECONDS,
  },
};
const INPUT = { leftThruster: false, rightThruster: false, fire: false };
const PASSES = new Set([
  "void",
  "starfield",
  "star",
  "sun-fields",
  "world-hud",
  "planets",
  "body-light",
]);
const HUD = new Set(["sun-fields", "world-hud"]);

/** The bench stages time; production owns simulation, passes and materials. */
export class PlanetInspectorScene {
  sim: Simulation;
  readonly camera = new Camera();
  readonly reference;
  private renderer: Renderer;
  private fx = new FlightFx();
  private mercury?: Awaited<ReturnType<typeof createRockMaterial>>;
  private venus?: ReturnType<typeof createPracticeVenus>;
  private cradle?: Awaited<ReturnType<typeof createCloudedWorld>>;
  private bodyAppearances: ReadonlyMap<number, BodyAppearance> = new Map();
  private samples: { at: number; ms: number; redraws: number }[] = [];
  private measurementStart = performance.now();
  status: string;
  private disposed = false;
  private stagedRadius?: number;
  private lighting: RockBodyLighting = DEFAULT_ROCK_BODY_LIGHTING;

  constructor(
    private layers: FlightLayerContexts,
    readonly doc: PlanetInspectorDocument,
    changed: () => void,
  ) {
    this.reference = references[doc.planet.name];
    this.stagedRadius =
      doc.planet.kind === "family" ? doc.planet.radius : undefined;
    this.sim = this.createSimulation();
    this.renderer = new Renderer(layers.world.canvas);
    this.seekRotation(doc.opening.rotationDegrees);
    if (doc.opening.orbitDegrees !== undefined)
      this.setOrbit(doc.opening.orbitDegrees);
    this.status = `Loading ${this.reference.label} material…`;
    void this.prepareMaterial(changed);
  }
  private createSimulation() {
    const family = this.doc.planet.kind === "family";
    const sim = new Simulation({
      ...stockSettings("wasp"),
      mode: "practice",
      seed: 2026,
    });
    if (family) {
      const system = generateSolarSystem({ seed: 2026 });
      Object.assign(sim.star, system.star);
      sim.star.name = system.star.name;
      sim.planets.splice(0, sim.planets.length, ...system.planets);
      applyYellowFamilyProfile(sim.star, 70, GRAVITY_TUNING);
    }
    const planet = sim.planets.find((p) => p.id === this.reference.id);
    if (!planet)
      throw new Error(
        `Planet ${this.reference.label} is unavailable in the selected system`,
      );
    sim.planets.splice(0, sim.planets.length, planet);
    if (family) {
      this.stageRadius(sim, planet, this.stagedRadius ?? 27);
    } else planet.displayName = this.reference.label;
    sim.start();
    return sim;
  }
  private stageRadius(sim: Simulation, planet: Planet, radius: number) {
    const parsed = MercurialInspectorPlanetSchema.parse({
      kind: "family",
      name: "mercurial",
      radius,
    });
    const travel = planet.orbitSpeed * planet.orbitRadius;
    const distance = mercurialOrbit(
      sim.star.radius,
      sim.star.damageField?.reach ?? NaN,
      sim.star.collectionField?.reach ?? NaN,
      parsed.radius,
    );
    planet.radius = parsed.radius;
    planet.orbitRadius = distance;
    planet.orbitSpeed = travel / distance;
    updatePlanetOrbit(planet, 0);
  }
  setRadius(radius: number) {
    if (this.doc.planet.kind !== "family")
      throw new Error("Radius belongs to family inspection only");
    this.stageRadius(this.sim, this.planet, radius);
    this.stagedRadius = radius;
  }
  private async prepareMaterial(changed: () => void) {
    let pendingPainter: { dispose: () => void } | undefined;
    try {
      if (
        this.doc.planet.name === "cradle" ||
        this.doc.planet.name === "earth"
      ) {
        const material = await createCloudedWorld(
          this.doc.planet.name === "earth"
            ? PLANET_MAPS.earthGround
            : PLANET_MAPS.cradleGround,
          PLANET_MAPS.cradleClouds,
        );
        pendingPainter = material.painter;
        if (this.disposed) {
          material.painter.dispose();
          pendingPainter = undefined;
          return;
        }
        material.painter.prepareLighting(this.lighting);
        this.cradle = material;
        this.bodyAppearances = planetAppearances(this.sim.planets, {
          cradle: material,
        });
        pendingPainter = undefined;
      } else if (
        this.doc.planet.name === "mercury" ||
        this.doc.planet.name === "mercurial"
      ) {
        const material = await createRockMaterial(PLANET_MAPS.mercuryGround);
        pendingPainter = material.painter;
        if (this.disposed) {
          material.painter.dispose();
          pendingPainter = undefined;
          return;
        }
        material.painter.prepareLighting(this.lighting);
        this.mercury = material;
        this.bodyAppearances = planetAppearances(this.sim.planets, {
          mercury: material,
        });
        pendingPainter = undefined;
      } else {
        const material = createPracticeVenus(true);
        pendingPainter = material.painter;
        if (this.disposed) {
          material.painter.dispose();
          pendingPainter = undefined;
          return;
        }
        material.painter.prepareLighting(this.lighting);
        this.venus = material;
        this.bodyAppearances = planetAppearances(this.sim.planets, {
          venus: material,
        });
        pendingPainter = undefined;
      }
      if (this.disposed) return;
      this.status = "";
    } catch {
      pendingPainter?.dispose();
      if (this.disposed) return;
      this.status = `${this.reference.label} material unavailable; using the production fallback.`;
    }
    changed();
  }
  get planet(): Planet {
    return this.sim.planets[0];
  }
  get spinTicks() {
    return Math.round(this.reference.spinSeconds / STEP);
  }
  get rotation() {
    return this.sim.ticks > 0 && this.sim.ticks % this.spinTicks === 0
      ? 360
      : ((this.sim.ticks % this.spinTicks) * 360) / this.spinTicks;
  }
  get orbit() {
    return ((((this.planet.orbitAngle * 180) / Math.PI) % 360) + 360) % 360;
  }
  seekRotation(value: number) {
    const orbit = this.orbit;
    const tick = Math.round((value / 360) * this.spinTicks);
    if (tick < this.sim.ticks) this.sim = this.createSimulation();
    while (this.sim.ticks < tick) this.step();
    this.setOrbit(orbit);
  }
  setOrbit(value: number) {
    this.planet.orbitAngle = (value * Math.PI) / 180;
    updatePlanetOrbit(this.planet, 0);
  }
  setLighting(input: unknown) {
    const next = RockBodyLightingSchema.parse(input);
    const painter = (this.mercury ?? this.venus ?? this.cradle)?.painter;
    painter?.prepareLighting(next);
    this.lighting = next;
  }
  resize(width: number, height: number) {
    resizeFlightLayers(this.layers, this.renderer, width, height);
    this.camera.viewportWidth = width;
    this.camera.viewportHeight = height;
  }
  step() {
    this.sim.step(INPUT);
  }
  private get surface() {
    const surface = (this.mercury ?? this.venus ?? this.cradle)?.surface;
    return surface instanceof StripSphericalSurface ? surface : undefined;
  }
  get passMilliseconds() {
    return this.samples.length
      ? this.samples.reduce((sum, s) => sum + s.ms, 0) / this.samples.length
      : 0;
  }
  get redrawsPerSecond() {
    const seconds = Math.min(
      1,
      (performance.now() - this.measurementStart) / 1000,
    );
    return seconds > 0
      ? this.samples.reduce((sum, s) => sum + s.redraws, 0) / seconds
      : 0;
  }
  draw(zoom: number, hud: boolean) {
    this.camera.zoom = zoom;
    this.camera.pos.set(this.planet.pos.x, this.planet.pos.y);
    const before = this.surface?.redrawCount ?? 0;
    let milliseconds = 0;
    drawFlightFrame(
      {
        layers: this.layers,
        renderer: this.renderer,
        camera: this.camera,
        sim: this.sim,
        fx: this.fx,
        bodyAppearances: this.bodyAppearances,
      },
      {
        include: (pass) => PASSES.has(pass.id) && (hud || !HUD.has(pass.id)),
        observe: (pass, ms) => {
          if (pass.id === "planets") milliseconds = ms;
        },
      },
    );
    const at = performance.now();
    this.samples.push({
      at,
      ms: milliseconds,
      redraws: (this.surface?.redrawCount ?? 0) - before,
    });
    while (this.samples.length && this.samples[0].at <= at - 1000)
      this.samples.shift();
  }
  dispose() {
    this.disposed = true;
    this.mercury?.painter.dispose();
    this.venus?.painter.dispose();
    this.cradle?.painter.dispose();
    this.mercury = undefined;
    this.venus = undefined;
    this.cradle = undefined;
    this.bodyAppearances = new Map();
    this.samples = [];
    this.fx.clear();
  }
}
