import { Camera } from "@void-drift/core";
import {
  drawFlightFrame,
  type FlightFrame,
  type FlightLayerContexts,
  STEP,
} from "@void-drift/mode-a";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FlightSceneDocumentSchema, type FlightView } from "./config";
import { FISSION_REST_TICKS, FISSION_SCENES } from "./fission-fixture";
import { FlightRun } from "./flight";
import { FlightScene } from "./scene";
import { STARTER_FLIGHT_SCENE } from "./starter";

// Keep the real simulation, projection and replay. Rasterization belongs to
// browser fidelity review; capture its frame boundary here without a DOM.
vi.mock("@void-drift/mode-a", async (original) => ({
  ...(await original<typeof import("@void-drift/mode-a")>()),
  drawFlightFrame: vi.fn(),
  FlightFx: class {
    clear = vi.fn();
    captureFission = vi.fn();
  },
}));

function layers(): FlightLayerContexts {
  const context = () => {
    const ctx = {
      canvas: { width: 1728, height: 1080, getContext: () => ctx },
    };
    return ctx as unknown as CanvasRenderingContext2D;
  };
  return { world: context(), fx: context(), lfx: context() };
}
const doc = FlightSceneDocumentSchema.parse({
  ...STARTER_FLIGHT_SCENE,
  opening: { view: "auto" },
});
function frame() {
  const calls = vi.mocked(drawFlightFrame).mock.calls;
  return calls[calls.length - 1][0];
}
function snapshot(frame: FlightFrame) {
  return {
    tick: frame.sim.ticks,
    centre: frame.camera.getViewCentre(),
    zoom: frame.camera.zoom,
    ship: { ...frame.sim.ship.pos },
  };
}

const emitted: ReturnType<typeof snapshot>[] = [];
beforeEach(() => {
  emitted.length = 0;
  vi.mocked(drawFlightFrame).mockClear();
  vi.mocked(drawFlightFrame).mockImplementation((frame) => {
    emitted.push(snapshot(frame));
  });
});

it("captures tick-local Fission events before the shared FX pass and reconstructs that history on seek", () => {
  const staged = FlightSceneDocumentSchema.parse(FISSION_SCENES[1].document);
  const scene = new FlightScene(layers(), staged, 1728);
  const history: unknown[] = [];
  const append = (kind: string, sim: FlightFrame["sim"]) => {
    history.push({
      kind,
      tick: sim.ticks,
      ignitions: [...sim.fissionIgnitions],
      contacts: [...sim.fissionContacts],
    });
  };
  vi.mocked(drawFlightFrame).mockImplementation(({ sim }) =>
    append("pass", sim),
  );
  scene.draw();
  vi.mocked(frame().fx.captureFission).mockImplementation((sim) =>
    append("capture", sim),
  );
  history.length = 0;
  const end = FISSION_REST_TICKS + 16;
  scene.seek("course", end, Infinity);
  expect(history.map((item) => (item as { kind: string }).kind)).toEqual(
    Array.from({ length: end }, () => ["capture", "pass"]).flat(),
  );
  expect(history[2 * FISSION_REST_TICKS]).toMatchObject({
    kind: "capture",
    ignitions: [{ mountKey: "aft-0" }, { mountKey: "aft-1" }],
  });
  const fresh = [...history];
  scene.seek("course", 0, Infinity);
  history.length = 0;
  scene.seek("course", end, Infinity);
  expect(history).toEqual(fresh);
  history.length = 0;
  scene.seek("course", end, Infinity);
  expect(history).toEqual([fresh.at(-1)]);
});

describe("Flight scene camera replay", () => {
  it("holds CSS magnification and centres the ship across resized stages, after AUTO", () => {
    const scene = new FlightScene(layers(), doc, 1728);
    for (const cssWidth of [1280, 1440, 1920]) {
      scene.configureViewport(cssWidth, true);
      scene.restart("course", "auto");
      scene.seek("course", 180, Infinity);
      for (const [view, pixels] of [
        ["1x", 50],
        ["2x", 100],
        ["4x", 200],
        ["8x", 400],
      ] as const) {
        scene.restart("course", view);
        scene.seek("course", 180, Infinity);
        const { camera, sim } = frame();
        const start = camera.worldToScreen(sim.ship.pos.x, sim.ship.pos.y);
        const end = camera.worldToScreen(sim.ship.pos.x + 100, sim.ship.pos.y);
        expect(((end.x - start.x) * cssWidth) / 1728).toBeCloseTo(pixels);
        expect(start.x).toBeCloseTo(864);
        expect(start.y).toBeCloseTo(540);
        expect(scene.tick).toBe(180);
      }
    }
    // Keep the chosen view when resize reconstructs the run.
    scene.configureViewport(1440, true);
    scene.seek("course", 180, Infinity);
    expect((frame().camera.zoom * 1440) / 1728).toBeCloseTo(4);
  });

  it.each([false, true])(
    "AUTO reproduces production framing (speed preference %s) and clears replay history",
    (speed) => {
      const scene = new FlightScene(layers(), doc, 1728);
      scene.configureViewport(1280, speed);
      const run = new FlightRun(doc, "course");
      const camera = new Camera({ viewportWidth: 1728 });
      camera.setActiveArea(null, null, 1280 / 1728);
      const productionFrame = (snap = false, entrance = false) => {
        const { ship, star, settings } = run.sim;
        if (speed)
          camera.frameSpeed(
            ship.pos.x,
            ship.pos.y,
            ship.vel.x,
            ship.vel.y,
            ship.radius,
            snap,
            entrance
              ? { x: star.pos.x, y: star.pos.y, radius: star.radius }
              : null,
          );
        else {
          const c = settings.camera;
          camera.frame(
            ship.pos.x,
            ship.pos.y,
            960,
            540,
            c.padding,
            c.smoothing,
            snap,
            c.zoomSteps,
          );
          camera.keepShipVisible(ship.pos.x, ship.pos.y, ship.radius);
        }
      };
      productionFrame(true, true);
      run.seek(180, (wrapped) => {
        productionFrame(wrapped);
        camera.update(STEP);
      });
      scene.seek("course", 180, Infinity);
      const fresh = snapshot(frame());
      expect(fresh.centre).toEqual(camera.getViewCentre());
      expect(fresh.zoom).toBe(camera.zoom);
      const history = () => [...emitted];
      for (const view of ["8x", "auto"] satisfies FlightView[]) {
        const clears = vi.mocked(frame().fx.clear).mock.calls.length;
        scene.restart("course", view);
        expect(frame().fx.clear).toHaveBeenCalledTimes(clears + 1);
        emitted.length = 0;
        scene.seek("course", 180, Infinity);
        expect(frame().fx.clear).toHaveBeenCalled();
      }
      const replayFrames = history();
      expect(snapshot(frame())).toEqual(fresh);
      scene.seek("course", 60, Infinity);
      scene.restart("course", "auto");
      emitted.length = 0;
      scene.seek("course", 180, Infinity);
      expect(history()).toEqual(replayFrames);
    },
  );
});
