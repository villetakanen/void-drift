<script lang="ts">
  import { onMount } from "svelte";
  import { CONFIG } from "./lib/config";
  import { Input } from "./lib/engine/Input";
  import { GameLoop } from "./lib/engine/Loop";
  import { updateShip, Vec2 } from "./lib/engine/Physics";
  import { Renderer } from "./lib/engine/Renderer";

  let canvas;
  let renderer;
  let input;
  let loop;

  const ship = {
    pos: new Vec2(0, 0),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: -Math.PI / 2,
    radius: CONFIG.SHIP_RADIUS,
  };

  function update(dt) {
    if (!renderer || !input) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    updateShip(ship, input.state, dt, width, height);
    renderer.clear();
    renderer.drawShip(ship);
  }

  onMount(() => {
    ship.pos.set(window.innerWidth / 2, window.innerHeight / 2);

    renderer = new Renderer(canvas);
    input = new Input();

    const onResize = () => {
      renderer.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);
    onResize();

    loop = new GameLoop(update);
    loop.start();

    return () => {
      loop.stop();
      input.destroy();
      window.removeEventListener("resize", onResize);
    };
  });
</script>

<canvas bind:this={canvas} class="game-canvas"></canvas>

<div class="ui-overlay">
  <div class="controls-hint">WASD / Arrows to Thrust</div>
</div>

<style>
  .game-canvas {
    display: block;
    width: 100vw;
    height: 100vh;
  }

  .ui-overlay {
    position: absolute;
    bottom: 20px;
    left: 20px;
    pointer-events: none;
    color: rgba(255, 255, 255, 0.5);
    font-family: monospace;
  }
</style>
