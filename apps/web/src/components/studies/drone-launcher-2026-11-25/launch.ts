import { paintBeam } from "@void-drift/core";
import {
  applyYellowFamilyProfile,
  BUILD_FLIGHT_SCALE,
  buildMounts,
  defaultLoadout,
  drawBuild,
  GRAVITY_TUNING,
  STEP,
  starterLoadout,
  YELLOW_FAMILY_RADIUS,
} from "@void-drift/mode-a";
import droneSvg from "../../../../public/studies/drone-launcher-2026-11-25/02-1-drone-master.svg?raw";
import launcherSvg from "../../../../public/studies/drone-launcher-2026-11-25/02-1-launcher-master.svg?raw";
import {
  type FlightExperiment,
  FlightSceneDocumentSchema,
} from "../../../lib/flight-scene";
import { TOTAL_TICKS } from "../../../lib/instrument/burns";
import { ArmedEncounter, type EncounterSettings } from "./armed-encounter";
import {
  AI_FLIGHT,
  COMMANDS,
  createDronePilot,
  createLaunchGate,
  enemyRoute,
  type PilotOptions,
  PilotOptionsSchema,
} from "./drone-pilot";
import {
  type DroneFlight,
  type DroneSample,
  droneBeam,
  FlightOptionsSchema,
  stepDrone,
} from "./flight-motion";
import { type CarrierPose, previewVisible } from "./launch-motion";
import { initialSizing, MasterSchema } from "./sizing";

const sizing = initialSizing();
const sourceLength = 22.138202;
const droneSourceLength = 9.39426;
const artScale = sizing.length / sourceLength;
const droneLength = droneSourceLength * artScale;
const nozzleBack = (7.879079 - droneSourceLength / 2) * artScale;
// Centre of the yellow receiver hexagon in the mastered SVG.
const receiverCentre = (13.202477 + 21.243787) / 2;
const releaseForward =
  (sizing.length * sizing.anchorPercent) / 100 - receiverCentre * artScale;
const loadout = starterLoadout("fighter");
loadout.hull = [null, null];
// Inert carrier for the study artwork: its stock mass still belongs to the ship.
loadout.aft = ["battery", null];
export const LAUNCH_SCENE = FlightSceneDocumentSchema.parse({
  loadout,
  start: { x: 460, y: 540, rotation: -Math.PI / 2, velocity: { x: 0, y: -90 } },
  encounter: { restTicks: 180 },
  opening: { burn: "course", view: "4x", tick: 132 },
});

export const AI_SCENE = FlightSceneDocumentSchema.parse({
  loadout,
  start: { x: 460, y: 1040, rotation: 0, velocity: { x: 40, y: 0 } },
  encounter: { restTicks: TOTAL_TICKS },
  opening: { burn: "course", view: "1x", tick: 240 },
});
const enemyLoadout = defaultLoadout("scout");
export function pilotExperiment(
  input: unknown,
  report: (text: string) => void = () => {},
) {
  return flightExperiment(AI_FLIGHT, report, PilotOptionsSchema.parse(input));
}

type Face = { fill: string; path: Path2D };
type Gradient = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stops: { offset: number; color: string; opacity: number }[];
};
const gradients = new Map<string, Gradient>();
let launcherFaces: Face[] | undefined;
let droneFaces: Face[] | undefined;
function faces(svg: string): Face[] {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  for (const gradient of doc.querySelectorAll("linearGradient")) {
    gradients.set(gradient.id, {
      x1: Number(gradient.getAttribute("x1")),
      y1: Number(gradient.getAttribute("y1")),
      x2: Number(gradient.getAttribute("x2")),
      y2: Number(gradient.getAttribute("y2")),
      stops: [...gradient.querySelectorAll("stop")].map((stop) => ({
        offset: Number(stop.getAttribute("offset")),
        color: stop.getAttribute("stop-color") ?? "#000000",
        opacity: Number(stop.getAttribute("stop-opacity") ?? 1),
      })),
    });
  }
  const parsed = MasterSchema.parse({
    bounds: doc.documentElement
      .getAttribute("viewBox")
      ?.split(/\s+/)
      .map(Number),
    faces: [...doc.querySelectorAll("path")].map((p) => ({
      fill: p.getAttribute("fill"),
      path: p.getAttribute("d"),
    })),
  });
  return parsed.faces.map((p) => ({ fill: p.fill, path: new Path2D(p.path) }));
}
function paint(ctx: CanvasRenderingContext2D, parts: Face[]) {
  for (const face of parts) {
    const gradientId = /^url\(#(.+)\)$/.exec(face.fill)?.[1];
    const definition = gradientId ? gradients.get(gradientId) : undefined;
    if (definition) {
      // Construct in the same local transform as the mastered paths.
      const gradient = ctx.createLinearGradient(
        definition.x1,
        definition.y1,
        definition.x2,
        definition.y2,
      );
      for (const stop of definition.stops)
        gradient.addColorStop(
          stop.offset,
          `${stop.color}${Math.round(stop.opacity * 255)
            .toString(16)
            .padStart(2, "0")}`,
        );
      ctx.fillStyle = gradient;
    } else ctx.fillStyle = face.fill;
    ctx.fill(face.path);
  }
}
export function drawDrone(ctx: CanvasRenderingContext2D) {
  droneFaces ??= faces(droneSvg);
  ctx.save();
  ctx.rotate(Math.PI / 2);
  ctx.scale(artScale, artScale);
  ctx.translate(0, -droneSourceLength / 2);
  paint(ctx, droneFaces);
  ctx.restore();
}

export function flightExperiment(
  input: unknown,
  report: (text: string) => void = () => {},
  pilotOptions?: PilotOptions,
  hitOptions?: EncounterSettings,
): FlightExperiment {
  const options = FlightOptionsSchema.parse(input);
  const beam = droneBeam(options.plumeSize);
  const plumeRadius =
    nozzleBack + Math.hypot(48 * beam.length + 4, 6 * beam.width);
  const maxLaunches = pilotOptions ? 1 : Math.ceil((TOTAL_TICKS * STEP) / 2);
  return {
    label: hitOptions
      ? "02.10 · powered intercept"
      : pilotOptions
        ? "Drone flight 02.5 · pursuit, return and drift"
        : `Drone flight 02.4 · ${options.style} steering and ion plume`,
    create(sim) {
      applyYellowFamilyProfile(
        sim.star,
        YELLOW_FAMILY_RADIUS.min,
        GRAVITY_TUNING,
      );
      // An empty launch course: retain the real stellar well, omit planetary wells.
      sim.planets.length = 0;
      const encounter = hitOptions ? new ArmedEncounter(hitOptions) : undefined;
      const mount = buildMounts(loadout).find((m) => m.key === "aft-0");
      if (!mount) throw new Error("Fighter aft mount missing");
      const releases: DroneFlight[] = [];
      let drones: DroneSample[] = [];
      let seated = false;
      const pilot = createDronePilot(pilotOptions);
      const gate = createLaunchGate(
        pilotOptions?.launchRange ?? 450,
        options.releaseSeconds,
      );
      let enemy = enemyRoute(0, pilotOptions?.encounter);
      const carrierPose = (ship: typeof sim.ship): CarrierPose => ({
        x: ship.pos.x,
        y: ship.pos.y,
        vx: ship.vel.x,
        vy: ship.vel.y,
        angle: ship.rotation,
      });
      let previous = carrierPose(sim.ship);
      const rail = {
        x:
          mount.x * BUILD_FLIGHT_SCALE + releaseForward * Math.cos(mount.angle),
        y:
          mount.y * BUILD_FLIGHT_SCALE + releaseForward * Math.sin(mount.angle),
        angle: mount.angle,
        length: receiverCentre * artScale,
      };
      report(`Ready · launch at ${options.releaseSeconds.toFixed(2)} s`);
      return {
        fittingPainter(ctx, m) {
          if (m.key !== "aft-0") return false;
          launcherFaces ??= faces(launcherSvg);
          ctx.save();
          ctx.rotate(Math.PI / 2);
          ctx.scale(
            artScale / BUILD_FLIGHT_SCALE,
            artScale / BUILD_FLIGHT_SCALE,
          );
          ctx.translate(0, (-sourceLength * sizing.anchorPercent) / 100);
          paint(ctx, launcherFaces);
          ctx.restore();
          if (seated) {
            ctx.save();
            ctx.scale(1 / BUILD_FLIGHT_SCALE, 1 / BUILD_FLIGHT_SCALE);
            ctx.translate(releaseForward, 0);
            drawDrone(ctx);
            ctx.restore();
          }
          return true;
        },
        step(current, tick) {
          const time = tick * STEP;
          encounter?.target.advance();
          enemy =
            encounter?.targetPose ?? enemyRoute(time, pilotOptions?.encounter);
          const carrier = carrierPose(current.ship);
          const launchDistance = Math.hypot(
            enemy.x - carrier.x,
            enemy.y - carrier.y,
          );
          if (pilotOptions) {
            const launch = gate.step(time, launchDistance);
            seated = launch.seated;
            if (launch.release) releases.push({ time });
          } else {
            const nextRelease = options.releaseSeconds + releases.length * 2;
            if (
              releases.length < maxLaunches &&
              tick >= Math.round(nextRelease / STEP)
            )
              releases.push({ time: nextRelease });
            seated =
              releases.length < maxLaunches &&
              previewVisible(
                time,
                options.releaseSeconds + releases.length * 2,
              );
          }
          drones = encounter?.spent
            ? []
            : releases.map((release) =>
                stepDrone(
                  release,
                  previous,
                  carrier,
                  time,
                  STEP,
                  rail,
                  options,
                  pilotOptions
                    ? (body, spin) =>
                        pilot.command(body, spin, enemy, carrier, tick)
                    : undefined,
                ),
              );
          const fired = encounter?.step(current, drones[0], tick);
          if (encounter?.spent) drones = encounter.visibleHull();
          previous = carrier;
          const pause =
            time >= options.releaseSeconds + (releases.length - 1) * 2 + 1;
          const latest = drones.at(-1);
          if (fired !== undefined)
            report(
              `Detonation at ${(fired * STEP).toFixed(2)} s · ${hitOptions?.range} u trigger · ${hitOptions?.response}`,
            );
          else if (pilotOptions && latest?.powered) {
            const state = pilot.state;
            report(
              `${state.mode} · ${latest.command} · drive ${(latest.output * 100).toFixed(0)}%\nEnemy ${state.enemyDistance.toFixed(0)} u · carrier ${state.carrierDistance.toFixed(0)} u\nSpeed ${Math.hypot(latest.vx, latest.vy).toFixed(0)} u/s · spin ${((latest.angularVelocity * 180) / Math.PI).toFixed(0)}°/s\n${state.mode === "Drift" ? "Main drive off · stabilizing" : `Plan ${COMMANDS[state.command].name} → ${COMMANDS[state.continuation].name} · next look in ${Math.max(0, state.nextPlan - tick)} ticks`}`,
            );
          } else if (pilotOptions && !latest) {
            report(
              `${seated ? "Ready on launcher" : "Waiting for launch range"} · enemy ${launchDistance.toFixed(0)} u from carrier\nLaunch at ≤${pilotOptions.launchRange} u · one drone`,
            );
          } else
            report(
              latest
                ? `${releases.length} launched · ${pause ? "Pause" : "Launch"} · latest: ${latest.command} · ${Math.hypot(latest.vx, latest.vy).toFixed(0)} u/s · drive ${(latest.output * 100).toFixed(0)}%`
                : `Pause · first launch at ${options.releaseSeconds.toFixed(2)} s`,
            );
        },
        passes: [
          {
            id: "study-drone-launch",
            name: "Launched drone",
            layer: "world",
            space: "world",
            draws: "Sequential study drones after ejection",
            source: "study/drone-launcher/launch.ts",
            draw(frame, ctx) {
              const view = frame.camera.getViewRect();
              if (pilotOptions) {
                if (
                  enemy.x + 25 >= view.x &&
                  enemy.x - 25 <= view.x + view.width &&
                  enemy.y + 25 >= view.y &&
                  enemy.y - 25 <= view.y + view.height
                ) {
                  drawBuild(
                    ctx,
                    enemyLoadout,
                    enemy.x,
                    enemy.y,
                    encounter?.target.sim.ship.rotation ??
                      Math.atan2(enemy.vy, enemy.vx),
                    BUILD_FLIGHT_SCALE,
                  );
                }
                const drone = drones[0];
                if (pilotOptions.ranges && drone) {
                  ctx.save();
                  ctx.strokeStyle = "rgba(140,180,205,0.3)";
                  ctx.lineWidth = 1 / frame.camera.zoom;
                  ctx.setLineDash([
                    6 / frame.camera.zoom,
                    6 / frame.camera.zoom,
                  ]);
                  ctx.beginPath();
                  ctx.arc(
                    drone.x,
                    drone.y,
                    pilotOptions.pursuitRange,
                    0,
                    Math.PI * 2,
                  );
                  if (pilotOptions.returnRange !== pilotOptions.pursuitRange) {
                    ctx.stroke();
                    ctx.strokeStyle = "rgba(210,195,130,0.35)";
                    ctx.beginPath();
                    ctx.arc(
                      drone.x,
                      drone.y,
                      pilotOptions.returnRange,
                      0,
                      Math.PI * 2,
                    );
                  }
                  ctx.stroke();
                  ctx.restore();
                }
              }
              for (const drone of drones) {
                if (
                  drone.x + droneLength < view.x ||
                  drone.x - droneLength > view.x + view.width ||
                  drone.y + droneLength < view.y ||
                  drone.y - droneLength > view.y + view.height
                )
                  continue;
                ctx.save();
                ctx.translate(drone.x, drone.y);
                ctx.rotate(drone.angle);
                drawDrone(ctx);
                ctx.restore();
              }
            },
          },
          ...(encounter
            ? [
                {
                  id: "intercept-light",
                  name: "Detonation",
                  layer: "lfx" as const,
                  space: "world" as const,
                  draws: "Live flash and sparks",
                  source: "study/drone-launcher/armed-encounter.ts",
                  draw(
                    frame: import("@void-drift/mode-a").FlightFrame,
                    ctx: CanvasRenderingContext2D,
                  ) {
                    encounter.live(ctx, frame.camera.getViewRect());
                  },
                },
              ]
            : []),
        ],
        fx(ctx, pass) {
          encounter?.fx(ctx, pass);
          for (const drone of drones) {
            if (
              !(drone.output > 0) ||
              !pass.visible(drone.x, drone.y, plumeRadius) ||
              !pass.budget.take(true)
            )
              continue;
            ctx.save();
            ctx.globalAlpha *= pass.opacity;
            ctx.translate(drone.x, drone.y);
            ctx.rotate(drone.angle);
            ctx.translate(-nozzleBack, 0);
            paintBeam(ctx, Math.sqrt(Math.min(1, drone.output)), beam);
            ctx.restore();
          }
        },
      };
    },
  };
}
