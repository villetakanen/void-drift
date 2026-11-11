<script lang="ts">
import {
  BUILD_FLIGHT_SCALE,
  defaultLoadout,
  drawBuild,
  drawSalvage,
  drawSalvageApertures,
  FlightFx,
  LoadoutSchema,
  POINT_DEFENCE,
  SALVAGE,
  type SalvageBody,
  Simulation,
  STEP,
  stockSettings,
  weaponPose,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import "@void-drift/core/styles/buttons.css";

type Scenario = "switch" | "reach" | "first-contact" | "turning" | "scout";
let { label = "Production Ion Point Defence encounter" }: { label?: string } =
  $props();
let canvas: HTMLCanvasElement;
let scenario = $state<Scenario>("switch");
let playing = $state(false);
let ready = $state(false);
let moving = $state(false);
let effects = $state(true);
let zoom = $state(1.5);
let shots = $state(0),
  hits = $state(0),
  spent = $state(0),
  seconds = $state(0),
  target = $state(""),
  hulls = $state("");
let reset = () => {};
let advance = () => {};
onMount(() => {
  const context = canvas.getContext("2d");
  if (!context) return;
  const ctx: CanvasRenderingContext2D = context;
  const fx = new FlightFx();
  let sim: Simulation;
  function start() {
    const chassis = scenario === "scout" ? "scout" : "fighter";
    const loadout = defaultLoadout(chassis);
    loadout.hull[0] = "ion-point-defence";
    sim = new Simulation({
      ...stockSettings(chassis),
      loadout: LoadoutSchema.parse(loadout),
      mode: "derelicts",
      arrival: false,
    });
    sim.planets.length = 0;
    sim.star.pos.set(1800, 1000);
    sim.ship.pos.set(400, 400);
    sim.ship.rotation = 0;
    sim.ship.vel.set(0, 0);
    sim.start();
    fx.clear();
    moving = scenario === "turning";
    const salvage = sim.salvage;
    const turret = salvage?.weapons.find((w) => w.kind === "ion-point-defence");
    if (!salvage || !turret) return;
    salvage.nextPass = Infinity;
    const pivot = weaponPose(sim.ship, turret.mount, turret.angle);
    /** A real body `range` units from the pivot centre along a bearing in degrees. */
    const body = (
      id: number,
      kind: "wreck" | "fragment",
      bearing: number,
      range: number,
      speed = 0,
      miss = 0,
    ) => {
      const a = (bearing * Math.PI) / 180;
      const x = pivot.x + Math.cos(a) * range,
        y = pivot.y + Math.sin(a) * range;
      // Head towards a point `miss` units beside the pivot so the body passes by.
      const aimX = pivot.x - Math.sin(a) * miss - x,
        aimY = pivot.y + Math.cos(a) * miss - y;
      const aimLength = Math.hypot(aimX, aimY);
      const b: SalvageBody = {
        id,
        group: id,
        kind,
        x,
        y,
        previousX: x,
        previousY: y,
        vx: (aimX / aimLength) * speed,
        vy: (aimY / aimLength) * speed,
        radius:
          kind === "wreck" ? SALVAGE.wreck.radius : SALVAGE.fragment.radius,
        hull: kind === "wreck" ? SALVAGE.wreck.hull : SALVAGE.fragment.hull,
        life: 60,
        rotation: 0,
        ...(kind === "wreck"
          ? { initialHull: SALVAGE.wreck.hull, releasedMask: 0 }
          : { shardIndex: 2 }),
      };
      salvage.bodies.push(b);
      return b;
    };
    if (scenario === "switch") {
      // Retained fragment beyond reach; a wreck closes in until it is 10 units closer.
      body(101, "fragment", -60, POINT_DEFENCE.reach + 35);
      body(102, "wreck", 70, POINT_DEFENCE.reach + 100, 30, 70);
    } else if (scenario === "reach") {
      // The fitted hull extends towards the pivot: keep its surface beyond reach.
      body(101, "wreck", 135, POINT_DEFENCE.trackingRange);
    } else if (scenario === "first-contact") {
      // The near wreck stops every ray; the wreck behind it on the same line is untouched.
      body(101, "wreck", 30, 45);
      body(102, "wreck", 30, 110);
    } else if (scenario === "turning") {
      body(101, "wreck", 90, 70);
      body(102, "fragment", -100, 85);
    } else {
      body(101, "wreck", -40, 60);
    }
    shots = hits = spent = seconds = 0;
    draw();
  }
  function draw() {
    ctx.resetTransform();
    ctx.fillStyle = "#070710";
    ctx.fillRect(0, 0, 1080, 600);
    ctx.setTransform(
      zoom,
      0,
      0,
      zoom,
      540 - sim.ship.pos.x * zoom,
      300 - sim.ship.pos.y * zoom,
    );
    ctx.strokeStyle = "#202437";
    ctx.lineWidth = 1 / zoom;
    for (let x = 0; x < 1920; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1080);
      ctx.stroke();
    }
    for (let y = 0; y < 1080; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1920, y);
      ctx.stroke();
    }
    const salvage = sim.salvage;
    const turret = salvage?.weapons.find((w) => w.kind === "ion-point-defence");
    if (turret) {
      // Lab guides use the production reach and tracking range about the pivot.
      const pivot = weaponPose(sim.ship, turret.mount, turret.angle);
      ctx.save();
      ctx.strokeStyle = "#437e99";
      ctx.setLineDash([3, 4]);
      for (const radius of [POINT_DEFENCE.reach, POINT_DEFENCE.trackingRange]) {
        ctx.globalAlpha = radius === POINT_DEFENCE.reach ? 1 : 0.5;
        ctx.beginPath();
        ctx.arc(pivot.x, pivot.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (salvage) drawSalvage(ctx, salvage);
    if (sim.settings.loadout)
      drawBuild(
        ctx,
        sim.settings.loadout,
        sim.ship.pos.x,
        sim.ship.pos.y,
        sim.ship.rotation,
        BUILD_FLIGHT_SCALE,
        "",
        undefined,
        undefined,
        salvage?.angles,
      );
    if (effects) fx.draw(ctx, sim);
    if (salvage) drawSalvageApertures(ctx, salvage);
    // Fresh final light pass, shared with FlightDeck and the mixed-effects bench.
    if (effects) fx.drawLfx(ctx, sim);
    ctx.resetTransform();
    shots = salvage?.pointDefenceDischarges ?? 0;
    hits = salvage?.hits ?? 0;
    spent = Math.round((salvage?.energySpent ?? 0) * 1000) / 1000;
    seconds = sim.ticks * STEP;
    target = turret?.target === null || !turret ? "" : String(turret.target);
    hulls = (salvage?.bodies ?? [])
      // Scenario bodies only; released fragments take ids from the simulation.
      .filter((b) => b.kind !== "cell" && b.id > 100)
      .map((b) => `${b.id}:${b.hull}`)
      .join(" ");
  }
  reset = start;
  advance = () => {
    sim.step({ leftThruster: moving, rightThruster: false, fire: false });
    draw();
  };
  start();
  ready = true;
  let previous = performance.now(),
    accumulated = 0,
    raf = 0;
  function frame(now: number) {
    if (playing) {
      accumulated += Math.min(0.1, (now - previous) / 1000);
      while (accumulated >= STEP) {
        sim.step({ leftThruster: moving, rightThruster: false, fire: false });
        accumulated -= STEP;
      }
    } else accumulated = 0;
    previous = now;
    draw();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
});
</script>
<section
  aria-label={label}
  data-shots={shots}
  data-hits={hits}
  data-spent={spent}
  data-target={target}
  data-hulls={hulls}
>
  <div class="controls">
    <label
      >Encounter
      <select
        aria-label="Encounter"
        bind:value={scenario}
        onchange={() => {
          playing = false;
          reset();
        }}
      >
        <option value="switch">Switches to a clearly closer target</option>
        <option value="reach">Target out of reach · tracked</option>
        <option value="first-contact">First contact stops the ray</option>
        <option value="turning">Turning ship</option>
        <option value="scout">Hidden turret on Scout</option>
      </select></label
    >
    <button
      disabled={!ready}
      type="button"
      class="btn"
      onclick={() => (playing = !playing)}
    >
      {playing ? "Pause encounter" : "Play encounter"}
    </button>
    <button
      disabled={!ready}
      type="button"
      class="btn"
      onclick={() => {
        playing = false;
        advance();
      }}
    >
      Step encounter
    </button>
    <button
      disabled={!ready}
      type="button"
      class="btn"
      onclick={() => {
        playing = false;
        reset();
      }}
    >
      Reset encounter
    </button>
    <label><input type="checkbox" bind:checked={moving}>Turn and burn</label>
    <label><input type="checkbox" bind:checked={effects}>Effects</label>
    <label
      >Zoom
      <select aria-label="Zoom" bind:value={zoom}>
        <option value={1}>1×</option>
        <option value={1.5}>1.5×</option>
        <option value={2}>2×</option>
        <option value={3}>3×</option>
      </select></label
    >
  </div>
  <p>
    {seconds.toFixed(2)}
    s · {shots} discharges · {hits} hits · {spent.toFixed(1)}p spent · target
    {target || "none"}
    · 50-unit grid; dashed rings mark {POINT_DEFENCE.reach}-unit reach and
    {POINT_DEFENCE.trackingRange}-unit tracking
  </p>
  <canvas
    bind:this={canvas}
    width="1080"
    height="600"
    aria-label="Real point-defence simulation, ship, targets, impacts and LFX"
  ></canvas>
  <p>
    Real validated fittings, collision geometry, targeting and damage. Pause or
    step to inspect alignment, the muzzle and first contact; turn and burn to
    inspect turning against the ship. Reset repeats the same encounter. Play the
    equipped ship in
    <a href="/hangar">Hangar → Derelicts</a>
    with keyboard or landscape touch controls.
  </p>
</section>
<style>
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-md);
}
label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
select {
  background: var(--color-elev-1);
  color: var(--color-text);
  padding: var(--spacing-sm);
}
canvas {
  display: block;
  width: 100%;
  background: var(--color-void);
}
</style>
