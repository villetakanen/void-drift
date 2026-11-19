import {
  CAMERA_ARENA_RADIUS,
  Camera,
  createRockMaterial,
  massWellReach,
  PLANET_MAPS,
  Renderer,
} from "@void-drift/core";
import {
  drawFlightFrame,
  FlightFx,
  type FlightLayerContexts,
  resizeFlightLayers,
  Simulation,
  stockSettings,
} from "@void-drift/mode-a";
import { planetAppearances } from "../assets/planet-appearances";
import { createOuterMercurialMaterial } from "../assets/rock-planets/authored-materials";
import { SystemInstrumentDocumentSchema } from "./config";

const PASSES = new Set([
  "void",
  "starfield",
  "arena-boundary",
  "star",
  "sun-fields",
  "world-hud",
  "planets",
  "body-light",
]);

/** Static production world; only the camera and prepared material belong to the Lab. */
export class SystemInstrumentScene {
  sim: Simulation;
  seed: number;
  status = "Loading mercurial material…";
  readonly camera = new Camera();
  private renderer: Renderer;
  private fx = new FlightFx();
  private material?: Awaited<ReturnType<typeof createRockMaterial>>;
  private outerMaterial?: Awaited<
    ReturnType<typeof createOuterMercurialMaterial>
  >;
  private disposed = false;
  private appearances: ReturnType<typeof planetAppearances> = new Map();
  private bindMaterials() {
    this.appearances = planetAppearances(this.sim.planets, {
      mercury: this.material,
      outerMercurial: this.outerMaterial,
    });
  }

  constructor(
    private layers: FlightLayerContexts,
    seed: number,
    changed: () => void,
  ) {
    const doc = SystemInstrumentDocumentSchema.parse({ seed });
    this.seed = doc.seed;
    this.sim = this.create(doc.seed);
    this.renderer = new Renderer(layers.world.canvas);
    void this.prepare(changed);
  }
  private create(seed: number) {
    return new Simulation({
      ...stockSettings("wasp"),
      mode: "derelicts",
      seed,
    });
  }
  generate(input: unknown) {
    const { seed } = SystemInstrumentDocumentSchema.parse(input);
    const next = this.create(seed);
    this.sim = next;
    this.seed = seed;
    this.bindMaterials();
    this.draw();
  }
  private async prepare(changed: () => void) {
    const [mercury, outer] = await Promise.allSettled([
      createRockMaterial(PLANET_MAPS.mercuryGround),
      createOuterMercurialMaterial(),
    ]);
    if (this.disposed) {
      if (mercury.status === "fulfilled") mercury.value.painter.dispose();
      if (outer.status === "fulfilled") outer.value.painter.dispose();
      return;
    }
    if (mercury.status === "fulfilled") this.material = mercury.value;
    if (outer.status === "fulfilled") this.outerMaterial = outer.value;
    this.bindMaterials();
    this.status =
      mercury.status === "rejected" || outer.status === "rejected"
        ? "A Mercurial material is unavailable; using the production fallback."
        : "";
    this.draw();
    changed();
  }
  resize(width: number, height: number) {
    if (width <= 0 || height <= 0) return;
    resizeFlightLayers(this.layers, this.renderer, width, height);
    this.camera.viewportWidth = width;
    this.camera.viewportHeight = height;
    this.draw();
  }
  draw() {
    if (this.disposed) return;
    const star = this.sim.star;
    const reach = (well: typeof star.massWell) =>
      well ? massWellReach(well.mass, well.cutoff, well.falloff) : 0;
    const extent = Math.max(
      CAMERA_ARENA_RADIUS,
      star.radius,
      star.collectionField?.reach ?? 0,
      star.damageField?.reach ?? 0,
      reach(star.massWell),
      ...this.sim.planets.map(
        (p) => p.orbitRadius + Math.max(p.radius, reach(p.massWell)),
      ),
    );
    this.camera.pos.set(star.pos.x, star.pos.y);
    this.camera.zoom = Math.max(
      0.001,
      Math.min(
        (this.camera.viewportWidth - 128) / (2 * extent),
        (this.camera.viewportHeight - 128) / (2 * extent),
      ),
    );
    drawFlightFrame(
      {
        layers: this.layers,
        renderer: this.renderer,
        camera: this.camera,
        sim: this.sim,
        fx: this.fx,
        bodyAppearances: this.appearances,
      },
      { include: (pass) => PASSES.has(pass.id) },
    );
  }
  dispose() {
    this.disposed = true;
    this.material?.painter.dispose();
    this.outerMaterial?.painter.dispose();
    this.fx.clear();
  }
}
