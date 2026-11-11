import type { FlightLayerContexts, Loadout } from "@void-drift/mode-a";
import {
  type FlightSceneDocument,
  FlightScene as SharedScene,
  type TargetMode,
} from "../../lib/flight-scene";
import type { BurnId } from "../../lib/instrument";

// The dated studies 021–024 were built on this engine. It now lives in
// lib/flight-scene; this keeps their original calls, and what they show, as
// they were.

/** What a study places in the scene. Targets are wrecks, in world units. */
export interface FlightSceneConfig {
  loadout: Loadout;
  targets: { x: number; y: number }[];
  /** Where the ship starts, at rest; absent means where a run starts. */
  start?: { x: number; y: number; rotation: number };
  /** A wreck held this far ahead of the ship; its shards go after two seconds. */
  escort?: number;
}

/** How the scene is looked at: the game camera, or the ship held at a zoom. */
export interface FlightSceneView {
  follow: number | null;
}
export const GAME_VIEW: FlightSceneView = { follow: null };

function toDocument(
  config: FlightSceneConfig,
  zoom: number,
): FlightSceneDocument {
  return {
    loadout: config.loadout,
    start: config.start,
    targets: config.targets,
    held:
      config.escort === undefined
        ? undefined
        : { distance: config.escort, shardLife: 2 },
    follow: { near: zoom, far: zoom + 1 },
    opening: { burn: "course", view: "follow", tick: 0 },
  };
}
function mode(config: FlightSceneConfig): TargetMode {
  if (config.escort !== undefined) return "held";
  return config.targets.length ? "placed" : "none";
}

export class FlightScene {
  private readonly scene: SharedScene;
  private zoom: number | null = null;
  private burn: BurnId = "course";
  constructor(
    layers: FlightLayerContexts,
    private config: FlightSceneConfig,
    width = 1920,
  ) {
    this.scene = new SharedScene(
      layers,
      {
        ...toDocument(config, 1),
        opening: { burn: "course", view: "game", tick: 0 },
      },
      width,
      mode(config),
    );
  }
  get tick() {
    return this.scene.tick;
  }
  get lost() {
    return this.scene.lost;
  }
  private apply() {
    this.scene.configure(
      toDocument(this.config, this.zoom ?? 1),
      mode(this.config),
    );
  }
  /** Another scene flies the burn again from its start. */
  configure(config: FlightSceneConfig) {
    this.config = config;
    this.apply();
    this.scene.restart(this.burn, this.zoom === null ? "game" : "follow");
  }
  restart(burn: BurnId, view?: FlightSceneView) {
    if (view) {
      this.zoom = view.follow;
      this.apply();
    }
    this.burn = burn;
    this.scene.restart(burn, this.zoom === null ? "game" : "follow");
  }
  seek(burn: BurnId, target: number, history: number) {
    this.burn = burn;
    this.scene.seek(burn, target, history);
  }
  draw() {
    this.scene.draw();
  }
}
