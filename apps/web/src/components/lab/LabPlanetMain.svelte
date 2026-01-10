<script lang="ts">
    import Canvas from "../Canvas.svelte";
    import { drawPlanet } from "@void-drift/core";
    import {
        planetLabState,
        sliderToOrbit,
        sliderToSize,
        getPlanetColor,
    } from "./planet-state.svelte";

    let { ...props }: { [key: string]: any } = $props();
    let stageWidth = $state(600);
    let stageHeight = $state(400);
    let elapsedTime = $state(0);

    // Derived values from sliders
    const orbitRadius = $derived(sliderToOrbit(planetLabState.orbitSlider));
    const planetRadius = $derived(sliderToSize(planetLabState.sizeSlider));
    const planetColor = $derived(getPlanetColor());

    // Animation Loop
    $effect(() => {
        let lastTime = performance.now();
        let handle: number;
        const loop = (t: number) => {
            const dt = (t - lastTime) / 1000;
            lastTime = t;
            if (planetLabState.animating) {
                elapsedTime += dt * planetLabState.timeScale;
            }
            handle = requestAnimationFrame(loop);
        };
        handle = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(handle);
    });

    function drawRing(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        radius: number,
        color: string,
    ) {
        const ringInner = radius * 1.3;
        const ringOuter = radius * 1.8;

        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = (ringOuter - ringInner) * 0.7;
        ctx.beginPath();
        ctx.ellipse(
            x,
            y,
            (ringInner + ringOuter) / 2,
            (ringInner + ringOuter) / 4,
            0,
            0,
            Math.PI * 2,
        );
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    function drawPlanetPreview(ctx: CanvasRenderingContext2D) {
        const cx = ctx.canvas.width / 2;
        const cy = ctx.canvas.height / 2;

        // Scale to fit canvas (use 40% of smaller dimension as max orbit)
        const scale = (Math.min(stageWidth, stageHeight) * 0.4) / 1000;
        const scaledOrbit = orbitRadius * scale;
        const scaledRadius = Math.max(planetRadius * scale, 8); // Min 8px visible

        // Draw central star placeholder
        ctx.fillStyle = "#ffaa00";
        ctx.beginPath();
        ctx.arc(cx, cy, 15, 0, Math.PI * 2);
        ctx.fill();

        // Calculate current orbital position
        const angle = 0.05 * elapsedTime; // Fixed orbit speed for preview
        const px = cx + Math.cos(angle) * scaledOrbit;
        const py = cy + Math.sin(angle) * scaledOrbit;

        // Draw orbit path
        if (planetLabState.showOrbit) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(cx, cy, scaledOrbit, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Draw ring behind planet (if enabled)
        if (planetLabState.hasRing) {
            drawRing(ctx, px, py, scaledRadius, planetColor);
        }

        // Draw planet
        drawPlanet(ctx, {
            x: px,
            y: py,
            radius: scaledRadius,
            color: planetColor,
        });

        // Draw selection indicator
        ctx.strokeStyle = "var(--color-acid-lime, #d4ff00)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, scaledRadius + 6, 0, Math.PI * 2);
        ctx.stroke();

        // Draw info labels
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`Orbit: ${orbitRadius.toFixed(0)}px`, 10, 20);
        ctx.fillText(`Radius: ${planetRadius.toFixed(0)}px`, 10, 35);
        ctx.fillText(`Type: ${planetLabState.planetType}`, 10, 50);
        if (planetLabState.hasRing) {
            ctx.fillText("Ring: ON", 10, 65);
        }
    }
</script>

<div
    class="stage-content"
    bind:clientWidth={stageWidth}
    bind:clientHeight={stageHeight}
>
    <Canvas width={stageWidth} height={stageHeight} draw={drawPlanetPreview} />
</div>

<style>
    .stage-content {
        flex: 1;
        display: flex;
        overflow: hidden;
        position: relative;
        background-image: linear-gradient(
                rgba(255, 255, 255, 0.05) 1px,
                transparent 1px
            ),
            linear-gradient(
                90deg,
                rgba(255, 255, 255, 0.05) 1px,
                transparent 1px
            );
        background-size: 20px 20px;
    }
</style>
